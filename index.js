var express = require('express');
var cron = require('node-cron');
const { autoWithDraw } = require('./utils/autowithdraw.js');

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
	if(req.query.email) hyip.email = req.query.email;
	else hyip.email = 0;
	if(req.query.time) hyip.time = req.query.time;
	else hyip.time = new Date().getMilliseconds() + 60*60*1000;
	if(req.query.loginurl) hyip.loginUrl = req.query.loginurl;
	else hyip.loginUrl = '';
	var count = 0;
	for(count = 0; count< accounts.length; count++)
	{
		if(accounts[count].hyipUrl == hyip.hyipUrl && accounts[count].username == hyip.username)
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
			if(accounts[count].hyipUrl == req.query.hyipurl && accounts[count].username == hyip.usernam)
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

app.listen(80);
console.log("Server start: port 80");

cron.schedule('*/5 * * * *', async () => {
	let accountsProcessing = accounts.slice(0);
	console.log("account length", accountsProcessing.length);
	await accountsProcessing.forEach(account => {
		let currrentTime = new Date().getMilliseconds();
		//if (account.time < currrentTime) {
			console.log(`withdraw account ${account.username} from ${account.hyipUrl}`);
			autoWithDraw(account);
			//account.time = currrentTime + 60*60*1000;
		//}
	});
});
