const prices = require('./prices');
const any = require('./any');

module.exports = (app, configs) => {
	prices(app, configs);
	any(app);

	return app;
};
