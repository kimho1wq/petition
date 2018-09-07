//var mongojs = require("mongojs")
var mysql = require('mysql');
var config = require("../config/db.json")

var connection = mysql.createConnection(config.mysql);
global.pool  = mysql.createPool(config.mysql);


module.exports = connection;