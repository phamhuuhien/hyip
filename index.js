const { parse } = require('node-html-parser');
var request = require('request');
const { sendMail } = require('./utils/email.js');
const sleep = require('await-sleep');

let baseUrl = 'https://highroyals.com';
let username = 'daicaca';
let password = 'xxxxxxx';
let globalCookie = '';


var express = require('express')
var app = express()
app.use('/website', express.static('website'))

//hyipUrl, username , pass, hourly, time to withdraw, login url (option)
var accounts = []
app.get('/', function (req, res) {
  res.send('Hello World')
})

app.get('/listaccount', function (req, res) {
   res.setHeader('Content-Type', 'application/json');
   res.send(JSON.stringify(accounts));
})

app.get('/saveaccount', function (req, res) {
	var hyip = {};
	if(req.query.hyipurl) hyip.hyipUrl = req.query.hyipurl;
	else hyip.hyipUrl = '';
	if(req.query.username) hyip.username = req.query.username;
	else hyip.username = '';
	if(req.query.password) hyip.password = req.query.password;
	else hyip.password = '';
	if(req.query.hourly) hyip.hourly = req.query.hourly;
	else hyip.hourly = 0;
	if(req.query.time) hyip.time = req.query.time;
	else hyip.time = 0;
	if(req.query.loginurl) hyip.loginUrl = req.query.loginurl;
	else hyip.loginUrl = '';
	var count = 0;
	for(count = 0; count< accounts.length; count++)
	{
		if(accounts[count].hyipUrl == hyip.hyipUrl)
		{
			accounts[count] = hyip;
			break;
		}
	}
	
	if(accounts.length == count)
	{
		accounts.push(hyip);
	}
	
   res.setHeader('Content-Type', 'application/json');
   res.send(JSON.stringify(hyip));
})

app.get('/deleteaccount', function (req, res) {
	var hyip = {};
	if(req.query.hyipurl)
	{
		for(var count = 0; count< accounts.length; count++)
		{
			if(accounts[count].hyipUrl == req.query.hyipurl)
			{
				hyip = accounts[count];
				break;
			}
		}
	}
	if(accounts.length > count)
	{
		accounts.splice(count, 1);
	}
	
   res.setHeader('Content-Type', 'application/json');
   res.send(JSON.stringify(hyip));
})

app.listen(3000)


//main();

function main() {
	request(baseUrl + '/?a=login', function (error, response, body) {
		if (error)
			console.error('connect site fail:', err);

		let formData = getFormData(body);
		formData['username'] = username;
		formData['password'] = password;

		// login
		request.post({ url: baseUrl, formData: formData }, function optionalCallback(err, httpResponse, body) {
			if (err)
				return console.error('login fail:', err);

			globalCookie = getCookies(httpResponse.headers['set-cookie'] + '');
			dashboard();
		});
	});
}

function dashboard() {
	request({
		url: baseUrl + '/?a=withdraw',
		headers: {
			Cookie: globalCookie,
		}
	}, function (error, response, body) {
		if (err)
			return console.error('dashboard fail:', err);

		performWithdraw(body);
	});
}

function getCookies(setCookie) {
	let cookies = setCookie.split(";");
	return cookies.filter(cookie => cookie.includes('password') || cookie.includes('PHPSESSID')).map(cookie => cookie.substr(10)).join(";").substr(1);
}

async function performWithdraw(body) {
	await sleep(1000);
	let formData = getFormData(body);
	let money = getAmountMoney(body);
	formData['amount'] = money;
	formData['ec'] = '18';
	formData['comment'] = '1234';

	request({
		url: baseUrl + '/?a=withdraw',
		method: 'POST',
		headers: {
			Cookie: globalCookie,
		},
		form: formData,
		followAllRedirects: true,
	}, function (error, response, body) {
		if (err)
			return console.error('perform withdraw fail:', err);

		confirmWithdraw(body);
	});
}

async function confirmWithdraw(body) {
	await sleep(1000);
	let formData = getFormData(body);
	request.post({
		url: baseUrl + '/?a=withdraw',
		method: 'POST',
		headers: {
			Cookie: globalCookie,
		},
		formData: formData,
		followAllRedirects: true,
	}, function (error, response, body) {
		if (err)
			return console.error('confirm withdraw fail:', err);

		sendMail();
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
