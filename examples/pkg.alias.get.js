import fetch from "node-fetch";

fetch("http://localhost:4001/pkg/fuzz/v8/main/index.js", {
	method: "GET",
})
	.then((res) => res.text())
	.then((body) => console.log(body));
