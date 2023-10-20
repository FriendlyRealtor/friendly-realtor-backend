require('dotenv').config();
const express = require('express');
const app = express();
const routes = require('./routes');
const cors = require('cors');
const PORT = process.env.PORT || 5001;

const allowedOrigins = ['http://localhost:3000', 'https://friendlyrealtor.app'];

const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
};

app.use(express.json());
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

app.use('/', routes);

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});
