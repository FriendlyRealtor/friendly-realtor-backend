require('dotenv').config();
const express = require('express');
const app = express();
const routes = require('./routes');
const cors = require('cors');
const PORT = process.env.PORT || 5001;

const corsOptions = {
  origin: [process.env.FrontEndURL],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use('/', routes);

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});
