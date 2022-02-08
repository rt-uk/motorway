# Motorway Microservice

## Requirements:
### (base, additional #1 and additional #2):

1. service for storing prices
2. retrieve the price from external 3rd party API (it should be simulated)
3. minimizing the requests to the 3rd party API by caching the results
4. handle concurrent requests for the same product and avoid calling the 3rd party API for it more than once
5. the solution satisfying all the requirements must be scalable


## Solution:

The solution has been implemented as a Node.js microservice for convenience and demo purposes.

Integration tests have been implemented as well to simulate all the possible scenarios.

All the requirements have been met by leveraging:

1. Express for the implementation of the REST API (meeting requirement #1)
2. Timeout in the Express route with customisable delay (meeting requirement #2)
3. Redis as external cache and pubsub (meeting requirement #3 and #5)
4. BullMQ as queueing system, with Redis as storage solution (meeting requirement #4 and #5)
5. Docker and docker-compose as containerised solution and orchestrator (meeting requirement #5)
6. Nginx as load balancer (meeting requirement #5)

### docker-compose launches:

- Nginx [8090]
- Redis [6379] (Redis Cluster could be used as alternative to make the demo more fault-tolerant)
- 3 Express micro-services [5001]

### Logic:

```
the price exists in the cache
└─ the price is returned to the consumer from the cache

the price does not exist in the cache
└─ a request for retrieving the price from the 3rd party API is added to the queue (uniqueness guaranteed), and the instance requesting the price subscribes to the target pubsub channel
    └─ the price is received from the 3rd party API
        └─ the price is stored in the cache and a message is sent over the target pubsub channel
            └─ the price is returned from to the consumer
```

## Environment Variables:

Before running the project, the .env file needs to be created from `.env.example` and the following variables customised:

- `PORT`: API port
- `REDIS_HOSTNAME`: Redis Server address
- `REDIS_PORT`: Redis Server port
- `EXTERNAL_CALL_DELAY`: 3rd party API delay
- `PROXY_URI`: Nginx URI

## Execution:

1. Clone the project:

```bash
  git clone git@github.com:robertot82/motorway.git
```

2. Install the dependencies:

```bash
  npm install
```

3. Run the cluster:

```bash
  docker-compose up -d
```

4. Run the integration tests:

```bash
  npm test
```

## Example output:

### Integration tests:

```
  API Integration Tests:
    ✔ should return 404 is the endpoint is not recognised.
    Endpoint recognised:
      /v1/prices/:
        ✔ should retrieve the price from the external service when the product is unknown. (5025ms)
        ✔ should retrieve the price from the cache when the product is known.
        ✔ should retrieve the price from the external service when the product is unknown only once, even if multiple parallel requests are sent. (5026ms)
        ✔ should retrieve the price from the cache when the product is known, even if multiple parallel requests are sent.


  5 passing (10s)
```

### Cluster:

```
Creating redis ... done     
Creating motorway_api_1 ... done
Creating motorway_api_2 ... done
Creating motorway_api_3 ... done
Creating nginx          ... done
Attaching to redis, motorway_api_1, motorway_api_3, motorway_api_2, nginx
api_1    |
api_1    | > motorway-microservice@1.0.0 start /app
api_1    | > node index.js
api_1    |
api_3    |
api_3    | > motorway-microservice@1.0.0 start /app
api_3    | > node index.js
api_3    |
api_2    |
api_2    | > motorway-microservice@1.0.0 start /app
api_2    | > node index.js
api_2    |
api_1    | Server listening on port 5001
api_2    | Server listening on port 5001
api_3    | Server listening on port 5001
api_3    | [07/Feb/2022:02:42:47 +0000] GET /foo HTTP/1.0 404 - - - - 0.610 ms
api_1    | External price request for product product-1 received...
api_1    | [07/Feb/2022:02:42:52 +0000] GET /v1/prices/product-1 HTTP/1.0 200 MISS 16 a56e3810-87bf-11ec-9b7a-9d6a41e03be0 - 5024.253 ms
api_2    | [07/Feb/2022:02:42:52 +0000] GET /v1/prices/product-1 HTTP/1.0 200 HIT 16 a56e3810-87bf-11ec-9b7a-9d6a41e03be0 - 4.303 ms
api_2    | External price request for product product-2 received...
api_2    | [07/Feb/2022:02:42:57 +0000] GET /v1/prices/product-2 HTTP/1.0 200 MISS 80 a8725050-87bf-11ec-95d6-7dc1ef778e7e - 5017.970 ms
api_1    | [07/Feb/2022:02:42:57 +0000] GET /v1/prices/product-2 HTTP/1.0 200 MISS 80 a8725050-87bf-11ec-95d6-7dc1ef778e7e - 5022.720 ms
api_1    | [07/Feb/2022:02:42:57 +0000] GET /v1/prices/product-2 HTTP/1.0 200 MISS 80 a8725050-87bf-11ec-95d6-7dc1ef778e7e - 5022.630 ms
api_3    | [07/Feb/2022:02:42:57 +0000] GET /v1/prices/product-2 HTTP/1.0 200 MISS 80 a8725050-87bf-11ec-95d6-7dc1ef778e7e - 5023.063 ms
api_3    | [07/Feb/2022:02:42:57 +0000] GET /v1/prices/product-2 HTTP/1.0 200 MISS 80 a8725050-87bf-11ec-95d6-7dc1ef778e7e - 5025.195 ms
api_3    | [07/Feb/2022:02:42:57 +0000] GET /v1/prices/product-2 HTTP/1.0 200 HIT 80 a8725050-87bf-11ec-95d6-7dc1ef778e7e - 0.764 ms
api_3    | [07/Feb/2022:02:42:57 +0000] GET /v1/prices/product-2 HTTP/1.0 200 HIT 80 a8725050-87bf-11ec-95d6-7dc1ef778e7e - 0.957 ms
api_1    | [07/Feb/2022:02:42:57 +0000] GET /v1/prices/product-2 HTTP/1.0 200 HIT 80 a8725050-87bf-11ec-95d6-7dc1ef778e7e - 0.956 ms
api_2    | [07/Feb/2022:02:42:57 +0000] GET /v1/prices/product-2 HTTP/1.0 200 HIT 80 a8725050-87bf-11ec-95d6-7dc1ef778e7e - 4.470 ms
api_2    | [07/Feb/2022:02:42:57 +0000] GET /v1/prices/product-2 HTTP/1.0 200 HIT 80 a8725050-87bf-11ec-95d6-7dc1ef778e7e - 3.951 ms
```

## API Reference:

### Get price:

```http
  GET /v1/prices/:product
```

| Request Body Data | Type     | Description                    |
| :---------------- | :------- | :----------------------------- |
| `:product`        | `string` | **Required**. The product name |

## Troubleshooting

1. If the demo is executed in WSL and Nginx fails to start up with `docker-compose up` (particulary if the volume fails to be mounted in its container), please refer to the guide: https://nickjanetakis.com/blog/setting-up-docker-for-windows-and-wsl-to-work-flawlessly
