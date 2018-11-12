var loki = require('lokijs');

var db = new loki('loki.json')
var accounts = db.addCollection('accounts')

module.exports.accounts = accounts;