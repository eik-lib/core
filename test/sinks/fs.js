'use strict';

const { Writable, pipeline } = require('stream');
const { test } = require('tap');
const slug = require('unique-slug');
const path = require('path');
const fs = require('fs');
const os = require('os');

const utils = require('../../lib/utils/utils');
const Sink = require('../../lib/sinks/fs');

/*
const cred = path.join(__dirname, '../gcloud.json');
process.env.GOOGLE_APPLICATION_CREDENTIALS = cred;
*/

const fixture = fs.readFileSync(path.join(__dirname, '../../fixtures/import-map.json')).toString();

const readFileStream = (file = '../README.md') => {
    const pathname = path.join(__dirname, file);
    return fs.createReadStream(pathname);
};

const pipeInto = (...streams) => {
    return new Promise((resolve, reject) => {
        const buffer = [];

        const to = new Writable({
            objectMode: false,
            write(chunk, encoding, callback) {
                buffer.push(chunk);
                callback();
            },
        });

        pipeline(...streams, to, error => {
            if (error) return reject(error);
            const str = buffer.join('').toString();
            return resolve(str);
        });
    });
}

const pipe = (...streams) => {
    return new Promise((resolve, reject) => {
        pipeline(...streams, error => {
            if (error) return reject(error);
            return resolve();
        });
    });
}

const DEFAULT_CONFIG = {
    sinkFsRootPath: path.join(os.tmpdir(), '/eik-test-files')
};

test('Sink() - Object type', (t) => {
    const sink = new Sink(DEFAULT_CONFIG);
    const name = Object.prototype.toString.call(sink);
    t.true(name.startsWith('[object Sink'), 'should begin with Sink');
    t.end();
});

test('Sink() - .write()', async (t) => {
    const sink = new Sink(DEFAULT_CONFIG);
    const dir = slug();
    const file = `${dir}/bar/map.json`;

    const writeFrom = readFileStream('../../fixtures/import-map.json');
    const writeTo = await sink.write(file);

    t.resolves(pipe(writeFrom, writeTo), 'should write file to sink');

    // Clean up sink
    await sink.delete(dir);
    t.end();
});

test('Sink() - .write() - directory traversal prevention', async (t) => {
    const sink = new Sink(DEFAULT_CONFIG);
    const dir = slug();

    t.rejects(sink.write(`../../${dir}/sensitive.data`), new Error('Directory traversal'), 'should reject on ../../ at beginning of filepath');
    t.rejects(sink.write(`../${dir}/sensitive.data`), new Error('Directory traversal'), 'should reject on ../ at beginning of filepath');
    t.rejects(sink.write(`/${dir}/../../../foo/sensitive.data`), new Error('Directory traversal'), 'should reject on path traversal in the middle of filepath');
    t.resolves(sink.write(`./${dir}/sensitive.data`), 'should resolve on ./ at beginning of filepath');
    t.resolves(sink.write(`/${dir}/sensitive.data`), 'should resolve on / at beginning of filepath');
    t.resolves(sink.write(`//${dir}/sensitive.data`), 'should resolve on // at beginning of filepath');

    // Clean up sink
    await sink.delete(dir);
    t.end();
});

test('Sink() - .read() - File exists', async (t) => {
    const sink = new Sink(DEFAULT_CONFIG);
    const dir = slug();
    const file = `${dir}/bar/map.json`;


    const writeFrom = readFileStream('../../fixtures/import-map.json');
    const writeTo = await sink.write(file);

    await pipe(writeFrom, writeTo);

    const readFrom = await sink.read(file);

    t.true(utils.isReadableStream(readFrom.stream), 'should resolve with a ReadFile object which has a .stream property');
    t.type(readFrom.etag, 'string', 'should resolve with a ReadFile object which has a .etag property');

    const result = await pipeInto(readFrom.stream);

    t.equal(result, fixture, 'should read file from sink which equals the fixture');

    // Clean up sink
    await sink.delete(dir);
    t.end();
});

test('Sink() - .read() - File does NOT exist', (t) => {
    const sink = new Sink(DEFAULT_CONFIG);
    const dir = slug();
    t.rejects(sink.read(`/${dir}/foo/not-exist.json`), 'should reject');
    t.end();
});

test('Sink() - .delete() - Delete existing file', async (t) => {
    const sink = new Sink(DEFAULT_CONFIG);

    const dir = slug();
    const file = `${dir}/bar/map.json`;

    const writeFrom = readFileStream('../../fixtures/import-map.json');
    const writeTo = await sink.write(file);

    await pipe(writeFrom, writeTo);

    t.resolves(sink.exist(file), 'should resolve - file is in sink before deletion');

    await sink.delete(file);

    t.rejects(sink.exist(file), 'should reject - file was deleted');

    // Clean up sink
    await sink.delete(dir);
    t.end();
});

test('Sink() - .read() - directory traversal prevention', async (t) => {
    const sink = new Sink(DEFAULT_CONFIG);
    const dir = slug();
    const file = `${dir}/map.json`;

    const writeFrom = readFileStream('../../fixtures/import-map.json');
    const writeTo = await sink.write(file);

    await pipe(writeFrom, writeTo);

    t.rejects(sink.read(`../../${dir}/sensitive.data`), new Error('Directory traversal'), 'should reject on ../../ at beginning of filepath');
    t.rejects(sink.read(`../${dir}/sensitive.data`), new Error('Directory traversal'), 'should reject on ../ at beginning of filepath');
    t.rejects(sink.read(`/${dir}/../../../foo/sensitive.data`), new Error('Directory traversal'), 'should reject on path traversal in the middle of filepath');
    t.resolves(sink.read(`./${file}`), 'should resolve on ./ at beginning of filepath');
    t.resolves(sink.read(`/${file}`), 'should resolve on / at beginning of filepath');
    t.resolves(sink.read(`//${file}`), 'should resolve on // at beginning of filepath');

    // Clean up sink
    await sink.delete(dir);
    t.end();
});

test('Sink() - .delete() - Delete non existing file', (t) => {
    const sink = new Sink(DEFAULT_CONFIG);
    t.resolves(sink.delete('/bar/foo/not-exist.json'), 'should resolve');
    t.end();
});

test('Sink() - .delete() - Delete file in tree structure', async (t) => {
    const sink = new Sink(DEFAULT_CONFIG);
    const dir = slug();
    const fileA = `${dir}/a/map.json`;
    const fileB = `${dir}/b/map.json`;

    const writeFromA = readFileStream('../../fixtures/import-map.json');
    const writeToA = await sink.write(fileA);
    await pipe(writeFromA, writeToA);

    const writeFromB = readFileStream('../../fixtures/import-map.json');
    const writeToB = await sink.write(fileB);
    await pipe(writeFromB, writeToB);

    await sink.delete(fileA);

    t.rejects(sink.exist(fileA), 'should reject on file A - file was deleted');
    t.resolves(sink.exist(fileB), 'should resolve on file B - file was NOT deleted');

    // Clean up sink
    await sink.delete(dir);
    t.end();
});

test('Sink() - .delete() - Delete files recursively', async (t) => {
    const sink = new Sink(DEFAULT_CONFIG);
    const dir = slug();
    const fileA = `${dir}/a/map.json`;
    const fileB = `${dir}/b/map.json`;

    const writeFromA = readFileStream('../../fixtures/import-map.json');
    const writeToA = await sink.write(fileA);
    await pipe(writeFromA, writeToA);

    const writeFromB = readFileStream('../../fixtures/import-map.json');
    const writeToB = await sink.write(fileB);
    await pipe(writeFromB, writeToB);

    await sink.delete(dir);

    t.rejects(sink.exist(fileA), 'should reject on file A - file was deleted');
    t.rejects(sink.exist(fileB), 'should reject on file B - file was deleted');

    t.end();
});

test('Sink() - .delete() - directory traversal prevention', async (t) => {
    const sink = new Sink(DEFAULT_CONFIG);
    const dir = slug();
    const file = `${dir}/map.json`;

    t.rejects(sink.delete(`../../${dir}/sensitive.data`), new Error('Directory traversal'), 'should reject on ../../ at beginning of filepath');
    t.rejects(sink.delete(`../${dir}/sensitive.data`), new Error('Directory traversal'), 'should reject on ../ at beginning of filepath');
    t.rejects(sink.delete(`/${dir}/../../../foo/sensitive.data`), new Error('Directory traversal'), 'should reject on path traversal in the middle of filepath');
    t.resolves(sink.delete(`./${file}`), 'should resolve on ./ at beginning of filepath');
    t.resolves(sink.delete(`/${file}`), 'should resolve on / at beginning of filepath');
    t.resolves(sink.delete(`//${file}`), 'should resolve on // at beginning of filepath');

    // Clean up sink
    await sink.delete(dir);
    t.end();
});

test('Sink() - .exist() - Check existing file', async (t) => {
    const sink = new Sink(DEFAULT_CONFIG);
    const dir = slug();
    const file = `${dir}/map.json`;

    const writeFrom = readFileStream('../../fixtures/import-map.json');
    const writeTo = await sink.write(file);

    await pipe(writeFrom, writeTo);

    t.resolves(sink.exist(file), 'should resolve - file is in sink');

    // Clean up sink
    await sink.delete(dir);
    t.end();
});

test('Sink() - .exist() - Check non existing file', (t) => {
    const sink = new Sink(DEFAULT_CONFIG);
    t.rejects(sink.exist('/bar/foo/not-exist.json'), 'should reject - file does not exist');
    t.end();
});

test('Sink() - .exist() - directory traversal prevention', async (t) => {
    const sink = new Sink(DEFAULT_CONFIG);
    const dir = slug();
    const file = `${dir}/map.json`;

    const writeFrom = readFileStream('../../fixtures/import-map.json');
    const writeTo = await sink.write(file);

    await pipe(writeFrom, writeTo);

    t.rejects(sink.exist(`../../${dir}/sensitive.data`), new Error('Directory traversal'), 'should reject on ../../ at beginning of filepath');
    t.rejects(sink.exist(`../${dir}/sensitive.data`), new Error('Directory traversal'), 'should reject on ../ at beginning of filepath');
    t.rejects(sink.exist(`/${dir}/../../../foo/sensitive.data`), new Error('Directory traversal'), 'should reject on path traversal in the middle of filepath');
    t.resolves(sink.exist(`./${file}`), 'should resolve on ./ at beginning of filepath');
    t.resolves(sink.exist(`/${file}`), 'should resolve on / at beginning of filepath');
    t.resolves(sink.exist(`//${file}`), 'should resolve on // at beginning of filepath');

    // Clean up sink
    await sink.delete(dir);
    t.end();
});
