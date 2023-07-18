// Bring in our dependencies
require('dotenv').config()
const app = require('express')();
const routes = require('./routes');
const cors = require('cors');
const PORT = process.env.PORT || 5001;

//  Connect all our routes to our application
app.use(cors())
app.use('/', routes);

// Turn on that server!
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});
