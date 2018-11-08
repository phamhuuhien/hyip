var express = require('express');
var cron = require('node-cron');
var loki = require('lokijs');
const { autoWithDraw } = require('./utils/autowithdraw.js');

var app = express()
app.use('/website', express.static('website'))

var db = new loki('loki.json')
var accounts = db.addCollection('accounts')

app.get('/', function (req, res) {
	res.send('Hello World')
})

app.get('/listaccount', function (req, res) {
	res.setHeader('Content-Type', 'application/json');
	res.send(JSON.stringify(accounts.find()));
})

app.get('/saveaccount', function (req, res) {
	var hyip = {};
	if (req.query.hyipurl) hyip.hyipUrl = req.query.hyipurl;
	else hyip.hyipUrl = '';
	if (req.query.username) hyip.username = req.query.username;
	else hyip.username = '';
	if (req.query.password) hyip.password = req.query.password;
	else hyip.password = '';
	if (req.query.email) hyip.email = req.query.email;
	else hyip.email = 0;
	if (req.query.time) hyip.time = req.query.time;
	else hyip.time = new Date().getMilliseconds() + 60 * 60 * 1000;
	if (req.query.loginurl) hyip.loginUrl = req.query.loginurl;
	else hyip.loginUrl = '';

	let editing = accounts.find({ 'hyipUrl': hyip.hyipUrl, 'username': hyip.username });
	if (editing.length > 0) {
		return;
	}

	accounts.insert(hyip);

	res.setHeader('Content-Type', 'application/json');
	res.send(JSON.stringify(hyip));
})

app.get('/deleteaccount', function (req, res) {
	if (!req.query.hyipurl)
		return;

	let hyip = accounts.find({ 'hyipUrl': req.query.hyipurl, 'username': req.query.username });
	accounts.remove(hyip);

	res.setHeader('Content-Type', 'application/json');
	res.send(JSON.stringify(hyip[0]));
})

app.listen(80);
console.log("Server start: port 80");

cron.schedule('*/5 * * * *', async () => {
	let accountsProcessing = accounts.find();
	console.log("account length", accountsProcessing.length);
	await accountsProcessing.forEach(account => {
		let currrentTime = new Date().getMilliseconds();
		//if (account.time < currrentTime) {
		console.log(`withdraw account ${account.username} from ${account.hyipUrl}`);
		try {
			autoWithDraw(account);
		} catch (error) {
			console.log("error", error);
		}
		//account.time = currrentTime + 60*60*1000;
		//}
	});
});
