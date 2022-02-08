const IORedis = require('ioredis');

class InternalPriceService {
	constructor(configs) {
		this.configs = configs;
		this.cache = new IORedis(configs.redisConfigs);
	}

	find(product) {
		// eslint-disable-next-line no-return-await
		return this.cache.get(product);
	}

	set(product, value) {
		// eslint-disable-next-line no-return-await
		return this.cache.set(product, value);
	}
}

module.exports = InternalPriceService;
