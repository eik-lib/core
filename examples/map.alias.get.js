import fetch from "node-fetch";

fetch("http://localhost:4001/map/buzz/v4", {
	method: "GET",
})
	.then((res) => res.json())
	.then((json) => console.log(json));
