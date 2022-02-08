const uuid = require('uuid');

class ExternalPriceService {
	constructor(configs) {
		this.configs = configs;
	}

	find(product) {
		return new Promise((resolve) => {
			// eslint-disable-next-line no-console
			console.log(`External price request for product ${product} received...`);

			setTimeout(() => {
				resolve({
					requestId: uuid.v1(),
					price: Math.round(Math.random() * 100)
				});
			}, this.configs.delay);
		});
	}
}

module.exports = ExternalPriceService;
