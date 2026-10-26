# Nestora AI — API Documentation

## Overview

Nestora AI is an AI-powered furniture discovery assistant. Its backend currently provides a REST API for retrieving furniture products and filtering the catalogue using deterministic rules.

**Base URL (local):** `http://localhost:5000`

**Response format:** JSON

## 1. Health Check

**Endpoint:** `GET /api/health`

Checks whether the backend server is running.

**Successful response — `200 OK`:**

```json
{
  "success": true,
  "message": "Nestora API is running"
}
```

## 2. Get and Search Products

**Endpoint:** `GET /api/products`

Returns all products when no filters are provided, or returns products matching the supplied filters.

### Supported query parameters

| Parameter | Type | Description |
|---|---|---|
| `category` | String | Product category: `desk`, `chair`, or `shelf` |
| `minPrice` | Number | Minimum price, inclusive |
| `maxPrice` | Number | Maximum price, inclusive |
| `color` | String | Exact color match, case-insensitive |
| `material` | String | Partial material match, case-insensitive |
| `adjustableHeight` | Boolean string | `true` or `false` |

### Examples

Get all products:

`GET /api/products`

Filter by price:

`GET /api/products?minPrice=5000&maxPrice=10000`

Filter by category and price:

`GET /api/products?category=desk&maxPrice=8000`

Find adjustable desks:

`GET /api/products?category=desk&adjustableHeight=true`

Filter by multiple criteria:

`GET /api/products?category=desk&color=black&maxPrice=8000&adjustableHeight=true`

### Successful response — `200 OK`

```json
{
  "success": true,
  "count": 1,
  "filters": {
    "minPrice": null,
    "maxPrice": 8000,
    "category": "desk",
    "color": "black",
    "material": null,
    "adjustableHeight": true
  },
  "products": [
    {
      "id": "desk-003",
      "name": "Adjustable Work Desk",
      "category": "desk",
      "price": 7800,
      "currency": "INR"
    }
  ]
}
```

The product object above is abbreviated for documentation; the actual API returns the complete product object.

### Error responses

**`400 Bad Request`** is returned for invalid input, including:

- An unsupported category.
- A negative or malformed price.
- A minimum price greater than the maximum price.
- An `adjustableHeight` value other than `true` or `false`.

Example:

```json
{
  "success": false,
  "message": "minPrice cannot be greater than maxPrice."
}
```

## Filtering behavior

- Minimum and maximum prices are inclusive.
- Multiple filters are combined: a product must satisfy every supplied filter.
- Omitting a filter means no restriction on that property.
- A valid search with no matches returns `200 OK` and an empty `products` array.
- Product data currently comes from a local JSON catalogue of fictional sample products. These are development examples, not verified commercial listings.

## Testing

Run automated backend tests from the `server` directory:

`npm test`

The test suite uses Jest and Supertest to verify product retrieval, filtering, and invalid-input handling.

## 4. Generate AI Recommendations

**Endpoint:** `POST /api/recommendations`

Generates furniture recommendations using the user's request and products matching the supplied filters.

**Content-Type:** `application/json`

### Request body

```json
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

- `userRequest`: Required, non-empty string describing the user's furniture requirements.
- `filters`: Optional object containing product search filters. It defaults to an empty object.

### Successful response — `200 OK`

```json
{
  "success": true,
  "count": 1,
  "message": "This desk matches your requirements.",
  "recommendations": [
    {
      "productId": "desk-003",
      "name": "Adjustable Work Desk",
      "price": 7800,
      "currency": "INR",
      "reason": "It is adjustable and within your budget."
    }
  ]
}
```

The example above illustrates the response structure; the message and reason are illustrative.

### Error responses

| Status | Meaning |
|---|---|
| `400 Bad Request` | Missing or empty `userRequest`, or `filters` is not an object. |
| `502 Bad Gateway` | Recommendation generation fails, including an AI service error or invalid AI output. |

### Empty results

If the supplied filters match no catalogue products, the endpoint returns `200 OK` with an empty recommendations array. The recommendation service avoids calling Groq when it receives an empty product list.

## Architecture

The backend follows a routes → controllers → services structure:

- **Routes:** Map HTTP methods and paths to controller functions.
- **Controllers:** Validate incoming requests, coordinate services, and return HTTP responses.
- **Product service:** Reads and filters products from the local JSON catalogue.
- **Recommendation service:** Calls Groq, parses the response, and validates recommended product IDs against the supplied catalogue.
- **Prompt configuration:** Defines instructions and the expected AI response format.

## AI grounding and limitations

Recommendations are restricted to products supplied from the current catalogue. The service validates recommendation IDs and derives product details from catalogue data rather than trusting the model to supply those details.

The catalogue contains fictional sample products. It does not represent verified real-world inventory, prices, or availability.

## Test coverage

Run the automated tests from the `server` directory:

```bash
npm test
```

The test suites cover product endpoints, recommendation endpoint validation and error handling, and recommendation service behavior. Jest mocks the Groq SDK or recommendation service where appropriate, so these tests do not require live Groq API calls.
