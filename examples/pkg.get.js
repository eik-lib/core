import fetch from "node-fetch";

fetch("http://localhost:4001/pkg/fuzz/8.4.1/main/index.js", {
	method: "GET",
})
	.then((res) => res.text())
	.then((body) => console.log(body));

fetch("http://localhost:4001/pkg/@cuz/fuzz/8.4.1/main/index.js", {
	method: "GET",
})
	.then((res) => res.text())
	.then((body) => console.log(body));
