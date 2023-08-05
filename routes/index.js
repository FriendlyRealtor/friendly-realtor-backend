var express = require('express');
var router = express.Router();
const axios = require("axios");

const requestBody = {
  "consumerPii": {
    "primaryApplicant": {
      "name": {
        "lastName": "CANN",
        "firstName": "JOHN",
        "middleName": "N"
      },
      "dob": {
        "dob": "1955"
      },
      "ssn": {
        "ssn": "111111111"
      },
      "currentAddress": {
        "line1": "510 MONDRE ST",
        "city": "MICHIGAN CITY",
        "state": "IN",
        "zipCode": "46360"
      }
    }
  },
  "requestor": {
    "subscriberCode": "2222222"
  },
  "permissiblePurpose": {
    "type": "08"
  },
  "resellerInfo": {
    "endUserName": "CPAPIV2TC21"
  },
  "vendorData": {
    "vendorNumber": "072",
    "vendorVersion": "V1.29"
  },
  "addOns": {
    "directCheck": "",
    "demographics": "Only Phone",
    "clarityEarlyRiskScore": "Y",
    "liftPremium": "Y",
    "clarityData": {
      "clarityAccountId": "0000000",
      "clarityLocationId": "000000",
      "clarityControlFileName": "test_file",
      "clarityControlFileVersion": "0000000"
    },
    "renterRiskScore": "N",
    "rentBureauData": {
      "primaryApplRentBureauFreezePin": "1234",
      "secondaryApplRentBureauFreezePin": "112233"
    },
    "riskModels": {
      "modelIndicator": [
        ""
      ],
      "scorePercentile": ""
    },
    "summaries": {
      "summaryType": [
        ""
      ]
    },
    "fraudShield": "Y",
    "mla": "",
    "ofacmsg": "",
    "consumerIdentCheck": {
      "getUniqueConsumerIdentifier": ""
    },
    "joint": "",
    "paymentHistory84": "",
    "syntheticId": "N",
    "taxRefundLoan": "Y",
    "sureProfile": "Y",
    "incomeAndEmploymentReport": "Y",
    "incomeAndEmploymentReportData": {
      "verifierName": "Experian",
      "reportType": "ExpVerify-Plus"
    }
  },
  "customOptions": {
    "optionId": [
      "COADEX"
    ]
  }
}

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

async function getAccessToken() {
	const requestBody = {
		grant_type: 'password',
		client_id: process.env.ExperianClientID,
		client_secret: process.env.ExperianClientSecret,
		username: process.env.ServerUsername,
		password: process.env.ServerPassword,
	};

	const config = {
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
	};

  try {
    const response = await axios.post(process.env.ExperianOAuthTokenURL, new URLSearchParams(requestBody).toString(), config);
    const accessToken = response.data.access_token;
    const refreshToken = response.data.refresh_token;

		return {
			accessToken, refreshToken
		}
  } catch (error) {
    console.error('Error getting access token:', error.response.data);
  }
}

router.post('/credit-report/:uid', async function(req, res, next) {
  try {
		const { accessToken } = await getAccessToken();
    const response = await axios.post(process.env.ExperianCreditReportURL, requestBody, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
				'Accept': 'application/json',
				'clientReferenceId': 'SBMYSQL'
      },
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: `An error occurred while making the API request, ${error.message}` });
  }
});

router.post('/new-subscriber', async (req, res) => {
  const { emailAddress, firstName, lastName } = req.query;

  const username = process.env.ServerUsername;
  const password = process.env.ServerPassword;

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

module.exports = router;
