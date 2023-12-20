const express = require('express');
const router = express.Router();
const axios = require("axios");
const OpenAI = require('openai');
const sgMail = require("@sendgrid/mail");
const { Configuration, PlaidApi, Products, PlaidEnvironments} = require('plaid');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

const openai = new OpenAI({
	apiKey: process.env.OpenApiKey,
});
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const PLAID_PRODUCTS = (Products.Transactions, Products.Auth, Products.Balance, Products.Transfer).split(
  ',',
);
const configuration = new Configuration({
  basePath: PlaidEnvironments[process.env.PlaidEnv],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PlaidClientID,
      'PLAID-SECRET': process.env.PlaidSecretKey,
      'Plaid-Version': '2020-09-14',
    },
  },
	products: PLAID_PRODUCTS,
});

const plaidClient = new PlaidApi(configuration);

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
		const response = await openai.images.generate({
			model: 'dall-e-3',
			prompt: `${inputMessage} make image look more realistic`,
			n: 1,
			size: '1024x1024',
		});
    res.send(response);
	} catch (error) {
    res.send(error);
	}
})

router.post('/create-facebook-post', async (req, res) => {
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

router.post('/grant-facebook-access', async (req, res) => {
  const { page_id, permitted_tasks, access_token } = req.body;

  const form = new FormData();
  form.append('page_id', page_id);
  form.append('permitted_tasks', JSON.stringify(permitted_tasks));
  form.append('access_token', access_token);

  try {
    const response = await axios.post('https://graph.facebook.com/v18.0/business_id/client_pages', form, {
      headers: {
        'Content-Type': `multipart/form-data; boundary=${form._boundary}`,
      },
    });

    res.send(response.data);
  } catch (error) {
    console.error('Error granting Facebook access:', error);
    res.status(500).send({ success: false, message: 'Error granting Facebook access.' });
  }
});

router.post('/create-link-token', async (req, res) => {
	try {
		const { userId } = req.body;

		if (!userId) {
			return res.status(400).json({
				error: 'Missing user ID',
			});
		}

		const configs = {
			user: {
				// This should correspond to a unique id for the current user.
				client_user_id: userId,
			},
			client_name: 'FriendlyRealtor',
			products: PLAID_PRODUCTS,
			country_codes: ['US'],
			language: 'en',
		};
		const createTokenResponse = await plaidClient.linkTokenCreate(configs);

    res.send(createTokenResponse.data);
  } catch (error) {
		res.status(500).send(error);
  }
})

router.post('/set-access-token', async (req, res) => {
  try {
    const { public_token } = req.body;

    if (!public_token) {
      return res.status(400).json({
        error: 'Missing public token',
      });
    }

    const tokenResponse = await plaidClient.itemPublicTokenExchange({
      public_token: public_token,
    });

    // Extract the access token from the response
    const access_token = tokenResponse.data.access_token;

    res.json({
      access_token: access_token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

router.post('/unlink-bank-account', async (req, res) => {
  try {
		const { plaidAccessToken } = req.body;
    if (!plaidAccessToken) {
      return res.status(400).json({
        error: 'User is not linked to a Plaid account',
      });
    }

    // Call Plaid API to remove the item (bank account) associated with the user
    const removeItemResponse = await plaidClient.itemRemove({
      access_token: plaidAccessToken,
    });

    res.json({ result: removeItemResponse.data });
  } catch (error) {
    console.error('Error unlinking bank account:', error);

    if (error.statusCode === 404) {
      // Handle case where the item (bank account) was not found
      return res.status(404).json({
        error: 'Bank account not found',
      });
    }

    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

router.get('/accounts', async (req, res) => {
  try {
    // You should handle authentication and authorization here, e.g., validate JWT

    // Get the access token from the request headers
    const access_token = req.headers.authorization.split(' ')[1];

    if (!access_token) {
      return res.status(401).json({
        error: 'Unauthorized: Missing access token',
      });
    }

    // Fetch accounts using the Plaid API
    const accountsResponse = await plaidClient.accountsGet({
      access_token: access_token,
    });

    // Extract relevant account information
    const accountsData = accountsResponse.data;

    res.json({
      accounts: accountsData.accounts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

router.post('/create-recurring-transfer', async (req, res) => {
  try {
    const { accessToken, fromAccountID, toAccountID, amount, frequency, name } = req.body;
    if (!accessToken || !fromAccountID || !toAccountID || !amount || !frequency) {
      return res.status(400).json({
        error: 'Missing required parameters',
      });
    }

		const formattedAmount = amount.toFixed(2);
		const fromIdempotencyKey = uuidv4();
		const toIdempotencyKey = uuidv4();
		const startDate = moment().format('YYYY-MM-DD');

		const frequencyMap = {
			weekly: { interval_unit: 'week', interval_count: 1, interval_execution_day: 1, start_date: startDate },
			'bi-weekly': { interval_unit: 'week', interval_count: 2, interval_execution_day: 1, start_date: startDate },
			monthly: { interval_unit: 'month', interval_count: 1, interval_execution_day: 1, start_date: startDate },
		};

		const schedule = frequencyMap[frequency];
	
	const fromAccountResponse = await plaidClient.transferRecurringCreate({
		idempotency_key: fromIdempotencyKey,
		access_token: accessToken,
		account_id: fromAccountID,
		type: 'credit',
		network: 'ach',
		amount: formattedAmount,
		ach_class: 'web',
		user: {
			legal_name: name,
		},
		description: 'from payment',
		schedule: schedule
	});

	const toAccountResponse = await plaidClient.transferRecurringCreate({
		idempotency_key: toIdempotencyKey,
		access_token: accessToken,
		account_id: toAccountID,
		type: 'debit',
		network: 'ach',
		amount: formattedAmount,
		ach_class: 'web',
		user: {
			legal_name: name,
		},
		description: 'to payment',
		schedule: schedule
	});

	const fromAccount = fromAccountResponse.data;
	const toAccount = toAccountResponse.data;

	const fromRetrieveTransfer = await plaidClient.transferRecurringGet({
		recurring_transfer_id: fromAccount.recurring_transfer.recurring_transfer_id
	})

	const toRetrieveTransfer = await plaidClient.transferRecurringGet({
		recurring_transfer_id: toAccount.recurring_transfer.recurring_transfer_id
	})

	res.json({
		success: true,
		fromAccount: fromAccount,
		toAccount: toAccount,
		fromRetrieveTransfer: fromRetrieveTransfer.data,
		toRetrieveTransfer: toRetrieveTransfer.data
	});
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

router.post('/get-balances', async (req, res) => {
  const { accessToken } = req.body;

  try {
    const balancesResponse = await plaidClient.accountsBalanceGet({
			access_token: accessToken
		})

    const balances = balancesResponse.data.accounts.map((account) => ({
      account_id: account.account_id,
      name: account.name,
      balances: account.balances,
    }));

    res.json({ balances });
  } catch (error) {
    console.error('Error fetching balances:', error);
    res.status(500).json({ error: 'Failed to fetch balances' });
  }
});

router.post('/send-event-email', async (req, res) => {
	const { virtual, link, location, date, name, email } = req.body;

	const message = `
			Thank you for your participation in Event ${name}!

			Please find additional details below.

			${virtual ? `Event Link: ${link}` : `Event Location: ${location}`} 
			Event Time: ${date}


			Best regards,
			Montrell Jubilee
	`;

	const msg = {
			to: email,
			from: 'jubileeinvestmentsdmv@gmail.com',
			subject: 'Thanks for your participation in Event ',
			text: message
	};

	try {
			await sgMail.send(msg);
			res.status(200).send('Email sent successfully!');
	} catch (error) {
			console.error(error);
			res.status(500).send('Error sending email!');
	}
});

module.exports = router;
