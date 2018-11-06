const { parse } = require('node-html-parser');
var request = require('request');
const { sendMail } = require('./email.js');
const sleep = require('await-sleep');

function autoWithDraw(hyip) {
	request(hyip.hyipUrl + '/?a=login', function (error, response, body) {
		if (error)
			console.error('connect site fail:', error);

		let formData = getFormData(body);
		formData['username'] = hyip.username;
		formData['password'] = hyip.password;

		// login
		request.post({ url: hyip.hyipUrl, formData: formData }, function optionalCallback(err, httpResponse, body) {
			if (err)
				return console.error('login fail:', err);

			hyip.cookie = getCookies(httpResponse.headers['set-cookie'] + '');
			dashboard(hyip);
		});
	});
}

function dashboard(hyip) {
	request({
		url: hyip.hyipUrl + '/?a=withdraw',
		headers: {
			Cookie: hyip.cookie,
		}
	}, function (error, response, body) {
		if (error)
			return console.error('dashboard fail:', error);

		performWithdraw(hyip, body);
	});
}

function getCookies(setCookie) {
	let cookies = setCookie.split(";");
	return cookies.filter(cookie => cookie.includes('password') || cookie.includes('PHPSESSID')).map(cookie => cookie.substr(10)).join(";").substr(1);
}

async function performWithdraw(hyip, body) {
	await sleep(1000);
	let formData = getFormData(body);
	let money = getAmountMoney(body);
	if (!money || money <= 0)
		return;
		
	formData['amount'] = money;
	formData['ec'] = '18';
	formData['comment'] = '1234';

	request({
		url: hyip.hyipUrl + '/?a=withdraw',
		method: 'POST',
		headers: {
			Cookie: hyip.cookie,
		},
		form: formData,
		followAllRedirects: true,
	}, function (error, response, body) {
		if (error)
			return console.error('perform withdraw fail:', error);

		confirmWithdraw(hyip, body, money);
	});
}

async function confirmWithdraw(hyip, body, money) {
	await sleep(1000);
	let formData = getFormData(body);
	request.post({
		url: hyip.hyipUrl + '/?a=withdraw',
		method: 'POST',
		headers: {
			Cookie: hyip.cookie,
		},
		formData: formData,
		followAllRedirects: true,
	}, function (error, response, body) {
		if (error)
			return console.error('confirm withdraw fail:', error);

		let title = '';
		let message = '';
		if (body.indexOf("Withdrawal request saved.") >= 0) {
			title = "Withdraw pending";
			message = "Pending. Oh shit";
		} else {
			title = "Withdraw successful";
			message = `Withdraw ${money} successful`;
		}
		sendMail(title, message);
	});
}

function getFormData(body) {
	let formData = {};
	let root = parse(body.toString());
	let form = root.querySelector("form");
	if (!form)
		return;
		
	root.querySelector("form").childNodes.forEach(child => {
		if (child.tagName != 'input' || child.rawAttrs.indexOf('hidden') < 0)
			return;

		if (!child.attributes || !child.attributes["name"])
			return;

		formData[child.attributes["name"]] = child.attributes["value"];
	});

	return formData;
}

function getAmountMoney(body) {
	let root = parse(body.toString());
	let table = root.querySelector("table");
	return parseFloat(table.childNodes[1].childNodes[3].toString().replace(/[^0-9\.]+/g,''), 0);
}

module.exports.autoWithDraw = autoWithDraw;