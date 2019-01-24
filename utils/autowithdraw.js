const { parse } = require('node-html-parser');
var request = require('request');
const cheerio = require('cheerio');

const { sendMail } = require('./email.js');
var { accounts } = require('./db.js');

function autoWithDraw(hyip) {
	loginPage(hyip)
		.then(function (body) {
			let formData = getFormData(body);
			formData['username'] = hyip.username;
			formData['password'] = hyip.password;
			return doLogin(hyip, formData);
		}, errHandler)
		.then(function (cookie) {
			hyip.cookie = cookie;
			updateStatistics(hyip);
			return dashboard(hyip);
		}, errHandler)
		.then(function (body) {
			let formData = getFormData(body);
			let money = getAmountMoney(body);
			console.log("money", money);
			if (!money || money <= 0) {
				return Promise.reject("money == 0");
			}

			formData['amount'] = money > 2 ? 2 : money;
			formData['ec'] = '18';
			formData['comment'] = '1234';
			return performWithdraw(hyip, formData);
		}, errHandler)
		.then(function (body) {
			let formData = getFormData(body);
			return confirmWithdraw(hyip, formData);
		}, errHandler)
		.then(function (body) {
			if (hyip.email) {
				let title = '';
				let message = '';
				if (body.match("/Batch id: [0-9]+/g")) {
					title = `${hyip.hyipUrl} Withdraw successful`;
					message = `Withdraw ${money} successful from account ${hyip.username}`;
				} else {
					title = `${hyip.hyipUrl} Withdraw pending`;
					message = `Pending. Oh shit from account ${hyip.username}`;
				}
				sendMail(hyip.email, title, message);
			}
		}, errHandler)
		.catch(function (error) {
			console.log(error);
		});
}

var errHandler = function(error) {
	return Promise.reject(error);
}

function loginPage(hyip) {
	return new Promise(function (resolve, reject) {
		// Do async job
		request(hyip.hyipUrl + '/?a=login', function (error, response, body) {
			if (error) {
				reject(error);
			} else {
				resolve(body);
			}
		})
	})
}

function doLogin(hyip, formData) {
	return new Promise(function (resolve, reject) {
		// Do async job
		request.post({
			url: hyip.hyipUrl,
			formData: formData,
		}, function optionalCallback(error, httpResponse, body) {
			if (error) {
				reject(error);
			} else {
				resolve(getCookies(httpResponse.headers['set-cookie'] + ''));
			}
		});
	})

}

function dashboard(hyip) {
	return new Promise(function (resolve, reject) {
		// Do async job
		request({
			url: hyip.hyipUrl + '/?a=withdraw',
			headers: {
				Cookie: hyip.cookie,
			}
		}, function (error, response, body) {
			if (error) {
				reject(error);
			} else {
				resolve(body);
			}
		});
	})
}

function getCookies(setCookie) {
	let cookies = setCookie.split(";");
	return cookies.filter(cookie => cookie.includes('password') || cookie.includes('PHPSESSID')).map(cookie => cookie.substr(10)).join(";").substr(1);
}

function performWithdraw(hyip, formData) {
	return new Promise(function (resolve, reject) {
		// Do async job
		setTimeout(function () {
			request({
				url: hyip.hyipUrl + '/?a=withdraw',
				method: 'POST',
				headers: {
					Cookie: hyip.cookie,
				},
				form: formData,
				followAllRedirects: true,
			}, function (error, response, body) {
				if (error) {
					reject(error);
				} else {
					resolve(body);
				}
			});
		}, 1000);

	})
}

function confirmWithdraw(hyip, formData) {
	return new Promise(function (resolve, reject) {
		// Do async job
		setTimeout(function () {
			request({
				url: hyip.hyipUrl + '/?a=withdraw',
				method: 'POST',
				headers: {
					Cookie: hyip.cookie,
				},
				form: formData,
				followAllRedirects: true,
			}, function (error, response, body) {
				if (error) {
					reject(error);
				} else {
					resolve(body);
				}
			});
		}, 1000)

	})
}

function updateStatistics(hyip) {
	request({
		url: hyip.hyipUrl + '/?a=account',
		headers: {
			Cookie: hyip.cookie,
		}
	}, function (error, response, body) {
		if (error)
			return console.error('dashboard fail:', error);

		const $ = cheerio.load(body.toString());
		let totalWithdraw = 0;
		let pendingWithdraw = 0;

		let totalText = $("tr:contains(Withdrew Total), tr:contains(Withdraw Total), tr:contains(Total Withdraw)");
		if (!totalText.length) {
			let $total = $("div:contains(Withdrew Total), div:contains(Withdraw Total), div:contains(Total Withdraw)");
			totalText = $total.last();
			if (totalText && totalText.text().indexOf("$") < 0)
				totalText  = $($total.get($total.length - 2));
		}

		totalWithdraw = totalText ? totalText.text().replace(/[^0-9\.]+/g,'') : 0;
		
		let pendingText = $("tr:contains(Pending Withdraw)");
		if (!pendingText.length) {
			let $pending = $("div:contains(Pending Withdraw)");
			pendingText = $pending.last();
			if (pendingText && pendingText.text().indexOf("$") < 0)
				pendingText = $($pending.get($pending.length - 2));
		}

		console.log("totalWithdraw", totalWithdraw);

		pendingWithdraw = pendingText ? pendingText.text().replace(/[^0-9\.]+/g,'') : 0;

		let updatingHyip = accounts.find({ hyipUrl: hyip.hyipUrl, username: hyip.username });
		if (!updatingHyip || updatingHyip.length == 0)
			return;

		updatingHyip[0].statistics = {
			totalWithdraw,
			pendingWithdraw,
		};

		accounts.update(updatingHyip[0]);
	});
}

function getFormData(body) {
	let formData = {};
	const $ = cheerio.load(body.toString());
	let form = $("form");
	if (!form)
		return;
		
	form.first().children("input").each( (i, child) => {
		if (child.name !== 'input' || child.attribs.type !== 'hidden')
			return;
			

		if (!child.attribs || !child.attribs["name"])
			return;

		formData[child.attribs.name] = child.attribs.value;
	});

	return formData;
}

function getAmountMoney(body) {
	const $ = cheerio.load(body.toString());
	let moneyText = $('tr:contains("Account Balance")').html();
	
	if (moneyText == null)
		moneyText = $("tr:contains(PerfectMoney) > td:nth-child(3)").html();

	if (moneyText == null) {
		moneyText = $("form div:contains(Balance)").last().text();
	}
	return moneyText ? moneyText.replace(/[^0-9\.]+/g,'') : 0;
}

module.exports.autoWithDraw = autoWithDraw;