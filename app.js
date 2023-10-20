require('dotenv').config();
const express = require('express');
const app = express();
const routes = require('./routes');
const cors = require('cors');
const PORT = process.env.PORT || 5001;

const corsOptions = {
  origin: "*"
};

app.use(express.json());
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

app.use('/', routes);

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});
