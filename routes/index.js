var express = require('express');
var router = express.Router();
var mongodb = require('../database');

/* GET home page. */
router.get('/', function(req, res, next) {
    console.log('/ get 패스 요청됨.');
    res.redirect('/petition');
});

module.exports = router;
