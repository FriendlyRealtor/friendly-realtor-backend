const express = require('express');
const router = express.Router();
const axios = require("axios");
const OpenAI = require('openai');
const bizSdk = require('facebook-nodejs-business-sdk');

const AdAccount = bizSdk.AdAccount;
const AdCreative = bizSdk.AdCreative;

const access_token = '<ACCESS_TOKEN>';
const app_secret = '<APP_SECRET>';
const app_id = '<APP_ID>';
const id = '<AD_ACCOUNT_ID>';
const api = bizSdk.FacebookAdsApi.init(access_token);
const showDebugingInfo = true;

const openai = new OpenAI({
	apiKey: process.env.OpenApiKey,
});

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

	const { prompt } = req.body

  const chatOptions = {
    model: "gpt-3.5-turbo",
    messages: [
      {
        "role": "system",
        "content": `Write in bullet point format ${prompt}`
      }
    ],
    temperature: 0,
    max_tokens: 120,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  };

  try {
    const response = await openai.chat.completions.create(chatOptions);
    const { choices } = response;
    res.send(choices[0]);
  } catch (error) {
    res.send(error);
  }
});

router.post('/mobile-prompt', async (req, res) => {
	const { inputMessage } = req.body;

  const chatOptions = {
    model: "gpt-3.5-turbo",
    messages: [
      {
        "role": "system",
        "content": inputMessage || ''
      }
    ]
  };

	try {
		const response = await openai.chat.completions.create(chatOptions)
    res.send(response);
	} catch (error) {
    res.send(error);
	}
})

router.post('/prompt-images', async (req, res) => {
	const { inputMessage } = req.body;
	
	try {
		const response = await openai.images.create({
			prompt: inputMessage,
			n: 1,
			size: '1024x1024',
		});
    res.send(response);
	} catch (error) {
    res.send(error);
	}
})

router.post('/create-facebook-ad', async (req, res) => {
  const { objectStoryId } = req.body; // You might want to adjust this based on your requirements

	if (showDebugingInfo) {
		api.setDebug(true);
	}
	
  const fields = [];
  const params = {
    name: 'Sample Promoted Post',
    object_story_id: objectStoryId,
  };

  try {
    const adCreative = await (new AdAccount(id)).createAdCreative(fields, params);
    logApiCallResult('adcreatives api call complete.', adCreative);
    res.send({ success: true, message: 'Facebook Ad created successfully.' });
  } catch (error) {
    console.error('Error creating Facebook Ad:', error);
    res.status(500).send({ success: false, message: 'Error creating Facebook Ad.' });
  }
});

module.exports = router;
