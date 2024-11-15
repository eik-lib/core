/* IMPORTANT
 * This snapshot file is auto-generated, but designed for humans.
 * It should be checked into source control and tracked carefully.
 * Re-generate by setting TAP_SNAPSHOT=1 and running tests.
 * Make sure to inspect the output below.  Do not ignore changes!
 */
"use strict";
exports[
	`test/multipart/parser.js > TAP > Parser() - Request contains multiple files and fields > parsed request should match snapshot 1`
] = `
Array [
  FormFile {
    "_name": "tgz",
    "_value": Array [
      Asset {
        "_integrity": "sha512-i1oU4MCMKNS1akPh2DGG4w4SKDxj0mg7XW7jvIGx+/6wRxWREm5CCLhugpsnzc8MvhBW1h/7AT3nINtGT++nTQ==",
        "_mimeType": "text/javascript",
        "_name": "buz",
        "_org": "biz",
        "_pathname": "/ie11/index.js",
        "_size": 111,
        "_type": "pkg",
        "_version": "1.1.1",
      },
      Asset {
        "_integrity": "sha512-aBcMYl0ZnkXf/9yCbnVXted2i0TcwBwNZZ9zdAip7iqSbhnRAHEn0Qgbo8VrhJs6o+iiWeNzYqaqphX8J2pgEg==",
        "_mimeType": "application/json",
        "_name": "buz",
        "_org": "biz",
        "_pathname": "/ie11/index.js.map",
        "_size": 421,
        "_type": "pkg",
        "_version": "1.1.1",
      },
      Asset {
        "_integrity": "sha512-lq9ovpg4+LD6vF+yOFaZTnuT43fVPmCDg9FjFKl4TM3/UI8TrXeQa3WlpkoFB1WoucVwQcP9pFvZrBjtts4uHA==",
        "_mimeType": "text/javascript",
        "_name": "buz",
        "_org": "biz",
        "_pathname": "/main/index.js",
        "_size": 83,
        "_type": "pkg",
        "_version": "1.1.1",
      },
      Asset {
        "_integrity": "sha512-mqoo6LQtopSBDKC1DMHrilgoH+0SVdQhurrjP/MqISCxelr5PJZtT3ImEB2V7ww33ijj1NgKvdXOYnqDwFMwjw==",
        "_mimeType": "application/json",
        "_name": "buz",
        "_org": "biz",
        "_pathname": "/main/index.js.map",
        "_size": 425,
        "_type": "pkg",
        "_version": "1.1.1",
      },
      Asset {
        "_integrity": "sha512-sh4jQ4dz2PoNhndQlnC1XULBVkHYgjacQpnicDobIsolYbgKNybvlmZdA7oJ/66yecjAfv64i0ypAkL5nyUwbw==",
        "_mimeType": "application/json",
        "_name": "buz",
        "_org": "biz",
        "_pathname": "/main/index.css.map",
        "_size": 163,
        "_type": "pkg",
        "_version": "1.1.1",
      },
      Asset {
        "_integrity": "sha512-Qqu5xjdYNzRT24ox2eBngOcqmhd1dzkD21IVpBLqE/fF9uVPRHMBzqZ9lzBKosj5wE5ExOdTXSi8AWfbdAoIGA==",
        "_mimeType": "text/css",
        "_name": "buz",
        "_org": "biz",
        "_pathname": "/main/index.css",
        "_size": 65,
        "_type": "pkg",
        "_version": "1.1.1",
      },
    ],
  },
  FormField {
    "_name": "foo",
    "_value": "value-foo",
  },
  FormField {
    "_name": "bar",
    "_value": "value-bar",
  },
  FormFile {
    "_name": "tar",
    "_value": Array [
      Asset {
        "_integrity": "sha512-i1oU4MCMKNS1akPh2DGG4w4SKDxj0mg7XW7jvIGx+/6wRxWREm5CCLhugpsnzc8MvhBW1h/7AT3nINtGT++nTQ==",
        "_mimeType": "text/javascript",
        "_name": "buz",
        "_org": "biz",
        "_pathname": "/ie11/index.js",
        "_size": 111,
        "_type": "pkg",
        "_version": "1.1.1",
      },
      Asset {
        "_integrity": "sha512-aBcMYl0ZnkXf/9yCbnVXted2i0TcwBwNZZ9zdAip7iqSbhnRAHEn0Qgbo8VrhJs6o+iiWeNzYqaqphX8J2pgEg==",
        "_mimeType": "application/json",
        "_name": "buz",
        "_org": "biz",
        "_pathname": "/ie11/index.js.map",
        "_size": 421,
        "_type": "pkg",
        "_version": "1.1.1",
      },
      Asset {
        "_integrity": "sha512-lq9ovpg4+LD6vF+yOFaZTnuT43fVPmCDg9FjFKl4TM3/UI8TrXeQa3WlpkoFB1WoucVwQcP9pFvZrBjtts4uHA==",
        "_mimeType": "text/javascript",
        "_name": "buz",
        "_org": "biz",
        "_pathname": "/main/index.js",
        "_size": 83,
        "_type": "pkg",
        "_version": "1.1.1",
      },
      Asset {
        "_integrity": "sha512-mqoo6LQtopSBDKC1DMHrilgoH+0SVdQhurrjP/MqISCxelr5PJZtT3ImEB2V7ww33ijj1NgKvdXOYnqDwFMwjw==",
        "_mimeType": "application/json",
        "_name": "buz",
        "_org": "biz",
        "_pathname": "/main/index.js.map",
        "_size": 425,
        "_type": "pkg",
        "_version": "1.1.1",
      },
      Asset {
        "_integrity": "sha512-sh4jQ4dz2PoNhndQlnC1XULBVkHYgjacQpnicDobIsolYbgKNybvlmZdA7oJ/66yecjAfv64i0ypAkL5nyUwbw==",
        "_mimeType": "application/json",
        "_name": "buz",
        "_org": "biz",
        "_pathname": "/main/index.css.map",
        "_size": 163,
        "_type": "pkg",
        "_version": "1.1.1",
      },
      Asset {
        "_integrity": "sha512-Qqu5xjdYNzRT24ox2eBngOcqmhd1dzkD21IVpBLqE/fF9uVPRHMBzqZ9lzBKosj5wE5ExOdTXSi8AWfbdAoIGA==",
        "_mimeType": "text/css",
        "_name": "buz",
        "_org": "biz",
        "_pathname": "/main/index.css",
        "_size": 65,
        "_type": "pkg",
        "_version": "1.1.1",
      },
    ],
  },
]
`;

exports[
	`test/multipart/parser.js > TAP > Parser() - Request contains only fields > parsed request should match snapshot 1`
] = `
Array [
  FormField {
    "_name": "foo",
    "_value": "value-foo",
  },
  FormField {
    "_name": "bar",
    "_value": "value-bar",
  },
]
`;

exports[
	`test/multipart/parser.js > TAP > Parser() - Request contains only files > parsed request should match snapshot 1`
] = `
Array [
  FormFile {
    "_name": "tgz",
    "_value": Array [
      Asset {
        "_integrity": "sha512-i1oU4MCMKNS1akPh2DGG4w4SKDxj0mg7XW7jvIGx+/6wRxWREm5CCLhugpsnzc8MvhBW1h/7AT3nINtGT++nTQ==",
        "_mimeType": "text/javascript",
        "_name": "buz",
        "_org": "biz",
        "_pathname": "/ie11/index.js",
        "_size": 111,
        "_type": "pkg",
        "_version": "1.1.1",
      },
      Asset {
        "_integrity": "sha512-aBcMYl0ZnkXf/9yCbnVXted2i0TcwBwNZZ9zdAip7iqSbhnRAHEn0Qgbo8VrhJs6o+iiWeNzYqaqphX8J2pgEg==",
        "_mimeType": "application/json",
        "_name": "buz",
        "_org": "biz",
        "_pathname": "/ie11/index.js.map",
        "_size": 421,
        "_type": "pkg",
        "_version": "1.1.1",
      },
      Asset {
        "_integrity": "sha512-lq9ovpg4+LD6vF+yOFaZTnuT43fVPmCDg9FjFKl4TM3/UI8TrXeQa3WlpkoFB1WoucVwQcP9pFvZrBjtts4uHA==",
        "_mimeType": "text/javascript",
        "_name": "buz",
        "_org": "biz",
        "_pathname": "/main/index.js",
        "_size": 83,
        "_type": "pkg",
        "_version": "1.1.1",
      },
      Asset {
        "_integrity": "sha512-mqoo6LQtopSBDKC1DMHrilgoH+0SVdQhurrjP/MqISCxelr5PJZtT3ImEB2V7ww33ijj1NgKvdXOYnqDwFMwjw==",
        "_mimeType": "application/json",
        "_name": "buz",
        "_org": "biz",
        "_pathname": "/main/index.js.map",
        "_size": 425,
        "_type": "pkg",
        "_version": "1.1.1",
      },
      Asset {
        "_integrity": "sha512-sh4jQ4dz2PoNhndQlnC1XULBVkHYgjacQpnicDobIsolYbgKNybvlmZdA7oJ/66yecjAfv64i0ypAkL5nyUwbw==",
        "_mimeType": "application/json",
        "_name": "buz",
        "_org": "biz",
        "_pathname": "/main/index.css.map",
        "_size": 163,
        "_type": "pkg",
        "_version": "1.1.1",
      },
      Asset {
        "_integrity": "sha512-Qqu5xjdYNzRT24ox2eBngOcqmhd1dzkD21IVpBLqE/fF9uVPRHMBzqZ9lzBKosj5wE5ExOdTXSi8AWfbdAoIGA==",
        "_mimeType": "text/css",
        "_name": "buz",
        "_org": "biz",
        "_pathname": "/main/index.css",
        "_size": 65,
        "_type": "pkg",
        "_version": "1.1.1",
      },
    ],
  },
  FormFile {
    "_name": "tar",
    "_value": Array [
      Asset {
        "_integrity": "sha512-i1oU4MCMKNS1akPh2DGG4w4SKDxj0mg7XW7jvIGx+/6wRxWREm5CCLhugpsnzc8MvhBW1h/7AT3nINtGT++nTQ==",
        "_mimeType": "text/javascript",
        "_name": "buz",
        "_org": "biz",
        "_pathname": "/ie11/index.js",
        "_size": 111,
        "_type": "pkg",
        "_version": "1.1.1",
      },
      Asset {
        "_integrity": "sha512-aBcMYl0ZnkXf/9yCbnVXted2i0TcwBwNZZ9zdAip7iqSbhnRAHEn0Qgbo8VrhJs6o+iiWeNzYqaqphX8J2pgEg==",
        "_mimeType": "application/json",
        "_name": "buz",
        "_org": "biz",
        "_pathname": "/ie11/index.js.map",
        "_size": 421,
        "_type": "pkg",
        "_version": "1.1.1",
      },
      Asset {
        "_integrity": "sha512-lq9ovpg4+LD6vF+yOFaZTnuT43fVPmCDg9FjFKl4TM3/UI8TrXeQa3WlpkoFB1WoucVwQcP9pFvZrBjtts4uHA==",
        "_mimeType": "text/javascript",
        "_name": "buz",
        "_org": "biz",
        "_pathname": "/main/index.js",
        "_size": 83,
        "_type": "pkg",
        "_version": "1.1.1",
      },
      Asset {
        "_integrity": "sha512-mqoo6LQtopSBDKC1DMHrilgoH+0SVdQhurrjP/MqISCxelr5PJZtT3ImEB2V7ww33ijj1NgKvdXOYnqDwFMwjw==",
        "_mimeType": "application/json",
        "_name": "buz",
        "_org": "biz",
        "_pathname": "/main/index.js.map",
        "_size": 425,
        "_type": "pkg",
        "_version": "1.1.1",
      },
      Asset {
        "_integrity": "sha512-sh4jQ4dz2PoNhndQlnC1XULBVkHYgjacQpnicDobIsolYbgKNybvlmZdA7oJ/66yecjAfv64i0ypAkL5nyUwbw==",
        "_mimeType": "application/json",
        "_name": "buz",
        "_org": "biz",
        "_pathname": "/main/index.css.map",
        "_size": 163,
        "_type": "pkg",
        "_version": "1.1.1",
      },
      Asset {
        "_integrity": "sha512-Qqu5xjdYNzRT24ox2eBngOcqmhd1dzkD21IVpBLqE/fF9uVPRHMBzqZ9lzBKosj5wE5ExOdTXSi8AWfbdAoIGA==",
        "_mimeType": "text/css",
        "_name": "buz",
        "_org": "biz",
        "_pathname": "/main/index.css",
        "_size": 65,
        "_type": "pkg",
        "_version": "1.1.1",
      },
    ],
  },
]
`;
