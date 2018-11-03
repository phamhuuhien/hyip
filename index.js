const { parse } = require('node-html-parser');
var request = require('request');

let baseUrl = 'https://goldinvesto.com';

main();

function main() {
	request(baseUrl, function (error, response, body) {
		if (error)
			console.error('connect site fail:', err);

		let root = parse(body.toString());
		let form = root.querySelector("form");
		if (!form)
			return;

		var formData = {
			'username': 'lamgiahien',
			'password': 'thuoctay',
		};

		root.querySelector("form").childNodes.forEach(child => {
			if (child.tagName != 'input' || child.rawAttrs.indexOf('hidden') < 0)
				return;

			if (!child.attributes || !child.attributes["name"])
				return;

			formData[child.attributes["name"]] = child.attributes["value"];
		});

		// login
		request.post({ url: baseUrl, formData: formData }, function optionalCallback(err, httpResponse, body) {
			if (err)
				return console.error('upload failed:', err);

			dashboard(getCookies(httpResponse.headers['set-cookie'] + ''));
		});
	});
}

function dashboard(cookies) {
	request({
		url: baseUrl + '/?a=account',
		headers: {
			Cookie: cookies.join(";"),
		}
	}, function (error, response, body) {
		console.log('error:', error); // Print the error if one occurred
		console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
		console.log('body:', body); // Print the HTML for the Google homepage.
	});
}

function getCookies(setCookie) {
	let cookies = setCookie.split(";");
	return cookies.filter(cookie => cookie.includes('password') || cookie.includes('PHPSESSID')).map(cookie => cookie.substr(10));
}
