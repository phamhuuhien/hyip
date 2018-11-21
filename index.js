var express = require('express');
var cron = require('node-cron');
const { autoWithDraw } = require('./utils/autowithdraw.js');
var { accounts } = require('./utils/db.js');

var app = express()
app.use('/website', express.static('website'))

app.get('/', function (req, res) {
	res.send('Hello World')
})

app.get('/listaccount', function (req, res) {
	res.setHeader('Content-Type', 'application/json');
	res.send(JSON.stringify(accounts.find()));
})

app.get('/saveaccount', function (req, res) {
	var hyip = {
		hyipUrl: req.query.hyipurl,
		username: req.query.username,
		password: req.query.password,
		email: req.query.email,
		time: new Date().getMilliseconds() + 60 * 60 * 1000,
	};

	let editing = accounts.find({ 'hyipUrl': hyip.hyipUrl, 'username': hyip.username });
	if (editing.length > 0) {
		return;
	}

	accounts.insert(hyip);
	console.log("add hyip", hyip);

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

cron.schedule('*/5 * * * *', () => {
	let accountsProcessing = accounts.find();
	console.log("account length", accountsProcessing.length);
	accountsProcessing.forEach(account => {
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

// let account = {
// 	hyipUrl: 'https://travelfina.com',
// 	username: 'heocon',
// 	password: 'thuoctay',
// 	email: 'h.studio87@gmail.com',
// 	statisticsClass: 'accountsection',
// }

// autoWithDraw(account);