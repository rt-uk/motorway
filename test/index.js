const dotenv = require("dotenv");
const axios = require("axios");
const IORedis = require("ioredis");
const assert = require("assert");
const configs = require("../app/configs");

dotenv.config();

const { redisConfigs, serverURI } = configs();

describe("API Integration Tests:", () => {
	let endpoint;
	let getURL;

	it("should return 404 is the endpoint is not recognised.", async () => {
		try {
			await axios.get(`${serverURI}/foo`);

			return Promise.reject();
		} catch (e) {
			assert.equal(e.response.status, 404);

			return Promise.resolve();
		}
	});

	describe("Endpoint recognised:", () => {
		describe("/v1/prices/:", () => {
			const isPriceValid = (price) =>
				(typeof price === "string" || typeof price === "number") &&
				Number(price) >= 0;

			endpoint = "/v1/prices/";
			getURL = (product) => `${serverURI}${endpoint}${product}`;

			before((done) => {
				const cache = new IORedis(redisConfigs);
				cache.flushall(done);
			});

			it("should retrieve the price from the external service when the product is unknown.", async () => {
				const response = await axios.get(getURL("product-1"));

				assert.equal(response.status, 200);
				assert.equal(response.headers.cache, "MISS");
				assert.equal(typeof response.headers["request-id"], "string");
				assert.equal(isPriceValid(response.headers.price), true);
				assert.equal(isPriceValid(response.data.price), true);
				assert.equal(response.headers.price, response.data.price);

				return true;
			});

			it("should retrieve the price from the cache when the product is known.", async () => {
				const response = await axios.get(getURL("product-1"));

				assert.equal(response.status, 200);
				assert.equal(response.headers.cache, "HIT");
				assert.equal(typeof response.headers["request-id"], "string");
				assert.equal(isPriceValid(response.headers.price), true);
				assert.equal(isPriceValid(response.data.price), true);
				assert.equal(response.headers.price, response.data.price);

				return true;
			});

			it(
				"should retrieve the price from the external service when the product is unknown only once, " +
					"even if multiple parallel requests are sent.",
				async () => {
					const responses = await Promise.all([
						axios.get(getURL("product-2")),
						axios.get(getURL("product-2")),
						axios.get(getURL("product-2")),
						axios.get(getURL("product-2")),
						axios.get(getURL("product-2"))
					]);

					responses.forEach((response) => {
						assert.equal(response.status, 200);
						assert.equal(response.headers.cache, "MISS");
						assert.equal(
							typeof response.headers["request-id"],
							"string"
						);
						assert.equal(
							isPriceValid(response.headers.price),
							true
						);
						assert.equal(isPriceValid(response.data.price), true);
						assert.equal(
							response.headers.price,
							response.data.price
						);

						// Ensure the responses are identical to the first one,
						// particularly the external request's request-id
						assert.equal(response.status, responses[0].status);
						assert.equal(
							response.headers.cache,
							responses[0].headers.cache
						);
						assert.equal(
							response.headers["request-id"],
							responses[0].headers["request-id"]
						);
						assert.equal(
							response.headers.price,
							responses[0].headers.price
						);
						assert.equal(
							response.data.price,
							responses[0].data.price
						);
					});

					return true;
				}
			);

			it(
				"should retrieve the price from the cache when the product is known, " +
					"even if multiple parallel requests are sent.",
				async () => {
					const responses = await Promise.all([
						axios.get(getURL("product-2")),
						axios.get(getURL("product-2")),
						axios.get(getURL("product-2")),
						axios.get(getURL("product-2")),
						axios.get(getURL("product-2"))
					]);

					responses.forEach((response) => {
						assert.equal(response.status, 200);
						assert.equal(response.headers.cache, "HIT");
						assert.equal(
							typeof response.headers["request-id"],
							"string"
						);
						assert.equal(
							isPriceValid(response.headers.price),
							true
						);
						assert.equal(isPriceValid(response.data.price), true);
						assert.equal(
							response.headers.price,
							response.data.price
						);

						// Ensure the responses are identical to the first one,
						// particularly the external request's request-id
						assert.equal(response.status, responses[0].status);
						assert.equal(
							response.headers.cache,
							responses[0].headers.cache
						);
						assert.equal(
							response.headers["request-id"],
							responses[0].headers["request-id"]
						);
						assert.equal(
							response.headers.price,
							responses[0].headers.price
						);
						assert.equal(
							response.data.price,
							responses[0].data.price
						);
					});

					return true;
				}
			);
		});
	});
});
