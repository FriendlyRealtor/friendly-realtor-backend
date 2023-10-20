// Bring in our dependencies
require('dotenv').config()
const express = require('express');
const app = require('express')();
const routes = require('./routes');
const cors = require('cors');
const PORT = process.env.PORT || 5001;

const allowedOrigins = ['http://localhost:3000', 'https://friendlyrealtor.app'];
const corsOptions = {
  origin: function (origin, callback) {
    // Check if the requesting origin is in the allowedOrigins array
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
};

//  Connect all our routes to our application
app.use(express.json())
app.use(cors(corsOptions))
app.use('/', routes);

// Turn on that server!
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});
