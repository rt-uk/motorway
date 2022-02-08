const dotenv = require('dotenv');
const express = require('express');
const configs = require('./app/configs');
const middlewares = require('./app/middlewares');
const routes = require('./app/routes');

dotenv.config();
const { port } = configs();

routes(
	middlewares(
		express()
	),
	configs()
).listen(port, () => {
	// eslint-disable-next-line no-console
	console.log(`Server listening on port ${port}`);
});
