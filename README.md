# Nestora AI --- AI-Powered Furniture Discovery Assistant

Nestora AI is a full-stack furniture discovery application combining
deterministic catalogue search with AI-generated recommendations. Users
can browse and filter furniture, describe their needs in natural
language, and receive recommendations based on the available catalogue.

-   **Live frontend:** https://nestora-phi-six.vercel.app
-   **Backend API:** https://nestora-zf7b.onrender.com
-   **GitHub repository:** https://github.com/samithsidda/nestora

> **Catalogue note:** The current catalogue contains fictional sample
> products for development and demonstration. It is not live retail
> inventory.

## Features

-   Browse a structured furniture catalogue.
-   Filter products by supported attributes, including category, price,
    color, material, and height adjustability.
-   Request personalized recommendations in natural language.
-   Ground recommendations in matching catalogue products.
-   Validate model response structure, product IDs, and evidence strings
    against catalogue features.
-   Build displayed product details from trusted catalogue data.
-   Responsive React interface with loading, error, and empty-result
    states.
-   Frontend wishlist interaction.
-   Automated backend tests and GitHub Actions CI.

## Tech stack

  Layer          Technology
  -------------- -----------------------------------------------------
  Frontend       React, Vite, JavaScript, Axios, CSS
  Backend        Node.js, Express
  AI             Groq API / Groq SDK
  Product data   Local JSON catalogue
  Tests          Jest, Supertest; mocked Groq SDK in automated tests
  CI             GitHub Actions
  Hosting        Vercel frontend, Render backend

## Architecture

``` text
User
  |
  v
React + Vite frontend (Vercel)
  | Axios requests to VITE_API_BASE_URL
  v
Express REST API (Render)
  |
  +--> /api/products
  |      Product routes -> controller/service -> products.json
  |
  +--> /api/recommendations
         Recommendation controller
           -> filter catalogue products
           -> call Groq with catalogue context
           -> validate response, product IDs, and evidence
           -> return catalogue-backed product details
```

The backend is responsible for catalogue filtering and validation. The
language model helps personalize recommendations but is not treated as
the authoritative source for product details.

## Live API

  Purpose                         Method and path
  ------------------------------- -----------------------------
  Health check                    `GET /api/health`
  Product catalogue and filters   `GET /api/products`
  AI recommendations              `POST /api/recommendations`

Full URLs:

-   Health: https://nestora-zf7b.onrender.com/api/health
-   Products: https://nestora-zf7b.onrender.com/api/products

### Health response

``` json
{
  "success": true,
  "message": "Nestora API is running"
}
```

### Recommendation request example

``` http
POST /api/recommendations
Content-Type: application/json
```

``` json
{
  "userRequest": "I need a compact black study desk under ₹8000",
  "filters": {}
}
```

The controller validates the request, finds matching catalogue products,
and passes relevant product context to the recommendation service. The
service validates model output before returning recommendations. Refer
to the implementation for the exact response schema and accepted filter
parameter names.

## Run locally

### Prerequisites

-   Node.js (Node.js 22 was used in CI)
-   npm
-   A Groq API key for live AI recommendations

### 1. Clone the repository

``` bash
git clone https://github.com/samithsidda/nestora.git
cd nestora
```

### 2. Configure and start the backend

Create `server/.env`:

``` env
PORT=5000
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=your_groq_model_name
CLIENT_ORIGIN=http://localhost:5173
```

Replace the Groq placeholders with valid values for your account and
application. Keep the API key private.

Then run:

``` bash
cd server
npm install
npm run dev
```

The backend should run at `http://localhost:5000`. Check
`http://localhost:5000/api/health`.

### 3. Configure and start the frontend

In a second terminal, create `client/.env`:

``` env
VITE_API_BASE_URL=http://localhost:5000/api
```

Then run:

``` bash
cd client
npm install
npm run dev
```

Open the local URL printed by Vite, normally `http://localhost:5173`.

## Environment variables

  -----------------------------------------------------------------------
  Variable                Location                Purpose
  ----------------------- ----------------------- -----------------------
  `PORT`                  Backend                 Port for Express; the
                                                  hosting platform's
                                                  assigned port is used
                                                  when available

  `GROQ_API_KEY`          Backend only            Authenticates requests
                                                  to Groq

  `GROQ_MODEL`            Backend                 Selects the configured
                                                  Groq model

  `CLIENT_ORIGIN`         Backend                 Allowed frontend origin
                                                  for CORS

  `VITE_API_BASE_URL`     Frontend build          Base URL used for API
                                                  requests
  -----------------------------------------------------------------------

**Never commit real `.env` files or API keys.** Keep `GROQ_API_KEY` on
the backend. Do not put it in Vercel or expose it through a `VITE_*`
variable.

For local development, use `CLIENT_ORIGIN=http://localhost:5173`. In
Render, set `CLIENT_ORIGIN` to the production Vercel origin exactly,
without a trailing slash. In Vercel, set `VITE_API_BASE_URL` to the
Render backend URL ending in `/api`, for example:

``` text
https://nestora-zf7b.onrender.com/api
```

Vite embeds environment values at build time, so redeploy the frontend
after changing a Vercel environment variable.

## Tests and build

### Backend tests

``` bash
cd server
npm test
```

The backend tests use a mocked Groq SDK to make model responses
predictable and to exercise validation and failure cases without
depending on live API calls.

### Frontend production build

``` bash
cd client
npm run build
```

### Continuous integration

The workflow is located at `.github/workflows/ci.yml`. It runs separate
jobs for backend tests and the frontend production build on configured
pushes and pull requests. Both jobs were previously observed passing;
check the latest GitHub Actions run to confirm the status of the current
commit.

## Deployment

### Backend --- Render

1.  Connect the GitHub repository to a Render Web Service.
2.  Set the root directory to `server`.
3.  Use `npm install` as the build command and `npm start` as the start
    command.
4.  Set `GROQ_API_KEY`, `GROQ_MODEL`, and `CLIENT_ORIGIN` in Render's
    environment settings.
5.  Confirm `/api/health` returns a successful response.

### Frontend --- Vercel

1.  Import the repository into Vercel.
2.  Set the root directory to `client` and select Vite as the framework.
3.  Set `VITE_API_BASE_URL` to the Render backend URL ending in `/api`.
4.  Deploy or redeploy the frontend.
5.  Test catalogue loading, filters, and AI recommendations.

The backend CORS configuration allows `http://localhost:5173` and the
origin configured in `CLIENT_ORIGIN`. If you use a separate Vercel
preview URL, that origin must also be allowed for preview requests.

## GenAI workflow and reliability

Nestora uses a controlled flow:

1.  Search/filter the catalogue using backend logic.
2.  Provide matching product data as context to the Groq recommendation
    service.
3.  Request structured recommendation output.
4.  Validate the response structure and ensure product IDs belong to the
    supplied catalogue.
5.  Validate each evidence item against the selected product's catalogue
    features.
6.  Build displayed product details from catalogue data.

Automated tests mock Groq to make response handling repeatable and to
avoid live API calls in every test.

### Limitation

Evidence validation is a safeguard, not proof that every sentence in a
free-form recommendation reason is factual. If strict requirements such
as budget or dimensions must always be enforced, parse them into
structured constraints and enforce them deterministically. The sample
catalogue is fictional.

## Security notes

-   Keep API keys in backend environment variables; never commit
    secrets.
-   Keep local `.env` files excluded from Git.
-   Restrict CORS to intended frontend origins.
-   The backend limits JSON request size and validates incoming
    requests.
-   Treat model output as untrusted and validate it before returning
    data to the frontend.
-   Mocked tests do not replace controlled testing against the live Groq
    service.

## Future improvements

-   Replace fictional sample data with a verified inventory source if
    real products are needed.
-   Improve deterministic parsing and enforcement of natural-language
    constraints.
-   Add timeouts, retry/rate-limit handling, and operational monitoring
    for external model calls.
-   Expand frontend automated tests and add end-to-end browser tests.
-   Build a repeatable evaluation set for recommendation quality.
-   Add wishlist persistence if cross-session storage is required.

## Project structure

``` text
nestora/
├── .github/workflows/ci.yml
├── client/
│   ├── public/products/
│   ├── src/api/
│   └── package.json
├── server/
│   ├── src/controllers/
│   ├── src/data/products.json
│   ├── src/routes/
│   ├── src/services/
│   └── package.json
└── README.md
```

Local `.env` files are shown in setup instructions only and must not be
committed.

## Author

**Samith Sidda** --- [GitHub](https://github.com/samithsidda)

------------------------------------------------------------------------

Built as a full-stack AI engineering project exploring
catalogue-grounded recommendations, backend validation, automated
testing, CI, and deployment.
