const PricesController = require('../controllers/prices');

module.exports = (app, configs) => {
	const controller = new PricesController(configs);

	app.get('/v1/prices/:product', async (req, res) => {
		const { product } = req.params;

		const { status, data } = await controller.find(product);

		res.header('cache', status);
		res.header('price', data.price);
		res.header('request-id', data.requestId);
		res.status(200).json({ price: data.price });
	});

	return app;
};
