var express = require('express');
var router = express.Router();
const axios = require("axios");
const OpenAi = require("openai");

router.get('/crm', function(req, res, next) {
	const { location } = req.query
	const options = {
		method: 'GET',
		url: process.env.RapidApiBaseURL,
		params: {address: location},
		headers: {
			'X-RapidAPI-Key': process.env.RapidApiKey,
			'X-RapidAPI-Host': process.env.RapidApiHost
		}
	};
	axios.request(options).then(function (response) {
		res.send({ value: response.data })
	}).catch(function (error) {
		res.send(error)
	});
});

router.get('/local-restaurants', function (req, res) {
	const { location } = req.query;

	// Radius here is in meters 8046.42 meters = 5 miles
  const options = {
		method: 'GET',
		url: process.env.GoogleSearchBaseURL,
		params: {location, radius: 8047, key: process.env.GoogleApiKey, business_status: 'OPERATIONAL', types: 'restaurant'},
	};
	axios.request(options).then(function (response) {
		const { data } = response;
		const { results } = data;
		res.send(results)
	}).catch(function (error) {
		res.send(error)
	});
})

router.post('/new-subscriber', async (req, res) => {
  const { emailAddress, firstName, lastName } = req.query;

  const username = process.env.HomeFinderUsername;
  const password = process.env.HomeFinderPassword;

  // Combine username and password in the format "username:password"
  const credentials = username + ':' + password;

  // Encode the credentials to base64 using Buffer
  const authHeader = 'Basic ' + Buffer.from(credentials).toString('base64');

  const options = {
    method: 'POST',
    url: `${process.env.IDXHome}/subscribers.json`,
    params: { emailAddress, firstName, lastName },
    headers: {
      Authorization: authHeader,
    },
  };

  try {
    const response = await axios.request(options);
    const { data } = response;
    res.send(data);
  } catch (error) {
    res.send(error.response.data);
  }
});

router.post('/prompt', async (req, res) => {
  const openai = new OpenAI({
		apiKey: process.env.OpenApiKey,
	});
	
	const chatOptions = {
		model: "gpt-3.5-turbo",
		messages: [
			{
				"role": "system",
				"content": "You will be provided with some realtor messages, and your task is to convert which client should I reach out to first."
			},
			{
				"role": "user",
				"content": JSON.stringify([
					{
						"name": "trell",
						"content": "I want to buy a house on 9/13/2023."
					},
					{
						"name": "ABc",
						"content": "I want to buy a house on 5/13/2022."
					},
					{
						"name": "fred",
						"content": "I want to buy a house on 5/13/2023."
					}
				])
			}
		],
		temperature: 0,
		max_tokens: 256,
		top_p: 1,
		frequency_penalty: 0,
		presence_penalty: 0,
	};
	
	try {
		const response = await openai.chat.completions.create(chatOptions);
		const { data } = response;
    res.send(data);
	} catch (error) {
		res.send(error.response.data);
	}
});

module.exports = router;
