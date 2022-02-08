module.exports = () => {
	['PORT', 'REDIS_HOSTNAME', 'REDIS_PORT', 'EXTERNAL_CALL_DELAY', 'PROXY_URI'].forEach((i) => {
		if (process.env[i] === undefined) {
			throw new Error(`${i} has not been provided or invalid - please check the environmental variables`);
		}
	});

	const port = process.env.PORT;
	const redisConfigs = {
		host: process.env.REDIS_HOSTNAME,
		port: process.env.REDIS_PORT
	};
	const delay = process.env.EXTERNAL_CALL_DELAY;
	const serverURI = process.env.PROXY_URI;

	return {
		port, redisConfigs, delay, serverURI
	};
};
