const authenticate = async (address) => {
	const formData = new FormData();
	formData.append("key", "change_me");

	const res = await fetch(`${address}/auth/login`, {
		method: "POST",
		body: formData,
	});

	const body = await res.json();

	console.log(body);
};

authenticate("http://localhost:4001");
