var express = require('express');
var router = express.Router();
const axios = require("axios");

router.get('/crm', function(req, res, next) {
	const { location } = req.query

	const options = {
		method: 'GET',
		url: 'https://zillow56.p.rapidapi.com/search',
		params: {location: location},
		headers: {
			'X-RapidAPI-Key': '983ea19bf5msh0178fe7715948dcp11b14ajsnadb182e8da0a',
			'X-RapidAPI-Host': 'zillow56.p.rapidapi.com'
		}
	};
	axios.request(options).then(function (response) {
		const { zestimate } = response.data;
		res.send({ value: zestimate })
	}).catch(function (error) {
		res.send(error)
	});
});

router.get('/local-restaurants', function (req, res) {
	const { location } = req.query;

	// Radius here is in meters 8046.42 meters = 5 miles
  const options = {
		method: 'GET',
		url: 'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
		params: {location, radius: 8047, key: 'AIzaSyCGKfspL5CDIHVlz5C1iYiUWJcSiKWPUeM', business_status: 'OPERATIONAL', types: 'restaurant'},
	};
	axios.request(options).then(function (response) {
		const { data } = response;
		res.send(data)
	}).catch(function (error) {
		res.send(error)
	});
})

module.exports = router;
