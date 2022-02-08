module.exports = (app) => {
	app.use((req, res) => {
		res.status(404).end();
	});

	return app;
};
