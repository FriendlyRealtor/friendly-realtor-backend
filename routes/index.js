var express = require('express');
var router = express.Router();
const axios = require("axios");

router.get('/crm', function(req, res, next) {
	const options = {
		method: 'GET',
		url: 'https://zillow56.p.rapidapi.com/property',
		params: {zpid: req.body.id},
		headers: {
			'X-RapidAPI-Key': '983ea19bf5msh0178fe7715948dcp11b14ajsnadb182e8da0a',
			'X-RapidAPI-Host': 'zillow56.p.rapidapi.com'
		}
	};

	axios.request(options).then(function (response) {
		res.send(response.data)
	}).catch(function (error) {
		res.send(error)
	});
});

module.exports = router;
