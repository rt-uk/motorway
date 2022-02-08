const morgan = require('morgan');

module.exports = (app) => {
	app.use(morgan('[:date[clf]] :method :url HTTP/:http-version :status :res[cache] :res[price] :res[request-id] - :response-time ms'));

	return app;
};
