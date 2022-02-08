const bullmq = require('bullmq');
const IORedis = require('ioredis');
const InternalPriceService = require('../services/prices/internal');
const ExternalPriceService = require('../services/prices/external');

const queueName = 'prices';

class PricesController {
	constructor(configs) {
		this.configs = configs;
		this.services = {
			// Service responsible for retrieving and storing the price in the cache
			internal: new InternalPriceService(this.configs),
			// Service responsible for retrieving the price from the external service (simulation)
			external: new ExternalPriceService(this.configs)
		};

		// Pub/Sub for notifying the successful retrieval of the price from the external service
		this.pub = new IORedis(this.configs.redisConfigs);
		this.sub = new IORedis(this.configs.redisConfigs);
		// Queue responsible for handling the requests towards the external service
		this.queue = new bullmq.Queue(queueName, { connection: this.configs.redisConfigs });
		this.queueWorker = new bullmq.Worker(queueName, async () => {}, {
			connection: this.configs.redisConfigs
		});

		// The request for retrieving the price from the external service
		// has been picked up from the queue
		this.queueWorker.on('completed', async (request) => {
			const product = request.id;

			// Retrieving the price from the external service
			const response = await this.services.external.find(product);

			// Storing the price in the cache
			await this.services.internal.set(product, JSON.stringify(response));

			// Notifying the subscribers the price for the product has been retrieved
			// from the external service
			this.pub.publish(product, { response });
		});

		// The request failed to be picked up from the queue
		this.queueWorker.on('failed', (request, err) => {
			throw new Error(`${request.id} has failed with ${err.message}`);
		});
	}

	async find(product) {
		// Attempting to retrieve the price for the product from the cache
		let data = JSON.parse(await this.services.internal.find(product));
		let status;

		// The price for the product has not been cached yet
		if (data == null) {
			data = JSON.parse(
				// Adding the request for retrieving the price from the external service
				// into the queue
				// eslint-disable-next-line no-use-before-define
				await addRequestInQueue(this.queue, this.services.internal, this.sub, product)
			);
			status = 'MISS';
		// The price for the product has been cached already
		} else {
			status = 'HIT';
		}

		return { data, status };
	}
}

async function addRequestInQueue(queue, internal, sub, product) {
	await queue.add(queueName, null, { jobId: product });

	// eslint-disable-next-line no-return-await
	return await new Promise((resolve) => {
		const callback = async () => {
			const data = await internal.find(product);

			// The notification of the successful retrieval of the price
			// from the external service has been processed,
			// the subscription can be safely revoked.
			sub.off('message', callback);
			sub.unsubscribe(product);

			resolve(data);
		};

		// Subscribing for the notification of the successful retrieval of the price
		// from the external service
		sub.on('message', callback);
		sub.subscribe(product);
	});
}

module.exports = PricesController;
