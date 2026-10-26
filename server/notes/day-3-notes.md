# Nestora AI --- Day 3 Notes

## Goal

Build the AI recommendation backend and organize the code using a routes
→ controllers → services architecture.

## Architecture

-   `server.js`: Loads environment configuration and starts the Express
    server.
-   `app.js`: Configures Express and mounts API routes.
-   `routes/productRoutes.js`: Maps product endpoints to the product
    controller.
-   `routes/recommendationRoutes.js`: Maps the recommendation endpoint
    to the recommendation controller.
-   `controllers/productController.js`: Validates product query
    parameters, calls the product service, and returns HTTP responses.
-   `controllers/recommendationController.js`: Validates recommendation
    requests, coordinates product search and AI generation, and handles
    errors.
-   `services/productService.js`: Reads and filters the local product
    catalogue.
-   `services/recommendationService.js`: Calls Groq, parses the model
    response, and validates recommended product IDs against the supplied
    catalogue.
-   `prompts.js`: Contains the system instructions and expected response
    format for the AI assistant.
-   `data/products.json`: Contains fictional sample furniture products
    used for development.

## Product API

`GET /api/products`

Supported query parameters:

-   `category`
-   `minPrice`
-   `maxPrice`
-   `color`
-   `material`
-   `adjustableHeight`

The product controller validates the query parameters. The product
service applies deterministic filters to the catalogue. A valid search
with no matches returns a successful response with an empty products
array.

## AI Recommendation API

`POST /api/recommendations`

Example request:

``` json
{
  "userRequest": "Find an adjustable black desk under 8000 rupees.",
  "filters": {
    "category": "desk",
    "color": "black",
    "maxPrice": 8000,
    "adjustableHeight": true
  }
}
```

Flow:

1.  The recommendation route delegates the request to the recommendation
    controller.
2.  The controller validates `userRequest` and `filters`.
3.  The controller calls `searchProducts(filters)` to retrieve matching
    catalogue items.
4.  The controller passes the request and matching products to
    `generateRecommendations()`.
5.  The recommendation service uses `furnitureAssistantPrompt` from
    `prompts.js` and sends the request to Groq.
6.  The service parses the returned JSON and checks that recommendation
    product IDs exist in the supplied catalogue.
7.  Product details in the final recommendations are derived from
    catalogue data.
8.  The controller returns the result to the client.

If no products match, the recommendation service returns an empty result
without calling Groq. If recommendation generation fails, the controller
returns a generic `502` response.

## Testing

The backend test suites use Jest and Supertest.

-   Product endpoint tests cover filtering and invalid input.
-   Recommendation endpoint tests cover valid requests, request
    validation, empty results, and recommendation-service failures.
-   Recommendation service tests cover catalogue-based response mapping,
    unknown product IDs, invalid JSON, unexpected response structures,
    empty product lists, and simulated Groq failures.

The Groq SDK or recommendation service is mocked in the relevant tests,
so these tests do not make real Groq API calls.

Run tests from the `server` directory:

``` bash
npm test
```

All three test suites passed after correcting the Groq mock in
`recommendationService.test.js`. The test was updated to configure the
`create` mock belonging to the Groq instance created when the
recommendation service is imported.

## API documentation

The API documentation is maintained in `docs/api.md`. It describes the
health check, product filtering endpoint, recommendation endpoint, error
handling, architecture, and test coverage.

## Key lessons

-   Routes map endpoints to controllers; they should not contain the
    main business logic.
-   Controllers validate requests, coordinate services, and send HTTP
    responses.
-   Services contain product-search and AI-recommendation logic.
-   Deterministic filtering retrieves candidate products before AI
    recommendation generation.
-   Prompt instructions alone do not guarantee factual output; validate
    the model's response and verify product IDs against the catalogue.
-   Automated tests can check failure cases without calling a live AI
    API.
-   The catalogue currently contains fictional development examples, not
    verified commercial inventory or prices.

## Day 3 completion checklist

-   [x] Created the recommendation prompt and service.
-   [x] Added the recommendation controller and route.
-   [x] Mounted the recommendation route in the Express app.
-   [x] Tested the API behavior in Postman.
-   [x] Added tests for route validation and recommendation-service
    behavior.
-   [x] Refactored to routes → controllers → services.
-   [x] Ran the test suite successfully.
-   [x] Updated `docs/api.md`.
