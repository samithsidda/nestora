# Nestora AI — Day 4 Development Notes
## React Frontend, API Integration, Product Filtering, and AI Recommendations

**Project:** Nestora AI  
**Day:** 4  
**Main focus:** Connect the React/Vite frontend to the Express backend, build the furniture discovery interface, integrate the recommendation endpoint, and manually test the end-to-end experience.

> These notes summarize the Day 4 work recorded in the project conversation. They describe the implementation and checks reported during development; they are not a substitute for inspecting the current repository.

---

## 1. Day 4 objectives

Day 4 moved Nestora AI from a working backend toward a usable full-stack application.

The main goals were to:

1. Set up the frontend-to-backend API connection.
2. Display catalogue products in React.
3. Add filters for furniture discovery.
4. Connect the natural-language recommendation form to the backend's Groq-powered service.
5. Display recommendations as product cards.
6. Handle loading, errors, empty results, and backend recovery.
7. Test the combined frontend/backend flow manually.

---

## 2. Application architecture and request flow

The frontend uses **React 19 with Vite**. It calls the Express backend through Axios.

The frontend API base URL is configured in `client/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

The frontend and backend run as separate development servers:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

The frontend API flow is:

```text
React component
    |
    v
API service (Axios)
    |
    v
Express API route
    |
    v
Controller
    |
    v
Service
    |
    +--> Product catalogue / filtering
    |
    +--> Groq recommendation service
```

This separation helps keep UI code focused on presentation and interaction while the backend owns product filtering, catalogue facts, and AI processing.

### Why use an API service layer?

Instead of putting raw Axios requests in every component, the client uses dedicated API service files. This centralizes endpoint configuration and makes components easier to read and maintain.

---

## 3. Axios configuration

### File: `client/src/services/api.js`

An Axios instance is configured to use the base URL from the Vite environment variable.

Conceptually:

```js
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000/api";
```

The Axios instance uses this base URL so endpoint calls can use paths such as `/products` and `/recommendations` rather than repeating the full backend URL.

**Important:** Vite exposes variables prefixed with `VITE_` to frontend code. They must not contain secrets. The Groq API key belongs on the backend, not in `client/.env`.

### File: `client/src/services/productApi.js`

This module provides the product API call used by the product-list UI. The frontend requests products from the backend and supplies filter parameters when searching.

### File: `client/src/services/recommendationApi.js`

This module sends the user's natural-language request and any supported filters to the recommendation endpoint.

The recorded request body is:

```json
{
  "userRequest": "Find an adjustable desk under 8000 rupees",
  "filters": {}
}
```

The service posts this data to:

```text
POST /api/recommendations
```

The exact filters object depends on the filters selected in the UI and the request contract implemented by the backend.

---

## 4. CORS debugging

### The issue

The React development server and Express backend run on different origins:

- `http://localhost:5173`
- `http://localhost:5000`

Browsers enforce cross-origin rules. Without appropriate CORS headers, frontend requests can fail even when the backend endpoint itself works.

### The fix recorded during Day 4

1. Install the `cors` package in the backend.
2. Configure CORS in `server/src/app.js`.
3. Allow the frontend development origin `http://localhost:5173`.
4. Apply the middleware before mounting the API routes.

Conceptually:

```js
const cors = require("cors");

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);
```

The actual app may include other middleware as well; the important ordering is that CORS middleware runs before route handling.

### What I learned

- CORS is a browser-enforced cross-origin policy, not a replacement for API authentication or authorization.
- A frontend network error does not always mean the route logic is wrong.
- Middleware order matters.
- Production deployment will need the deployed frontend origin configured rather than relying only on localhost.

---

## 5. Product listing interface

### File: `client/src/components/ProductList.jsx`

The product list component fetches products from the backend and renders the product catalogue.

The component handles key UI states:

- **Loading:** indicate that the request is in progress.
- **Success:** render the product cards.
- **Error:** show a useful error message if products cannot be loaded.
- **Empty result:** handle a successful request that returns no matching products.

The reported backend-down behavior showed a clear message:

> Unable to load products. Please try again.

When the backend was restarted and the request retried, the application recovered.

### Product card content

The cards use catalogue data such as:

- Product name
- Price and currency
- Material and color
- Dimensions
- Features
- Adjustable-height information, where relevant
- Product image

The frontend renders product images using the product ID:

```text
/products/{product.id}.png
```

For example:

```text
/products/desk-003.png
```

This keeps image selection tied to the catalogue's product identifiers. The image files were placed under:

```text
client/public/products/
```

The reported image files were:

- `desk-001.png`
- `desk-002.png`
- `desk-003.png`
- `chair-001.png`
- `shelf-001.png`
- `desk-004.png`

### Wishlist

A frontend-only wishlist interaction was added to product cards. It provides a UI interaction without requiring a backend persistence feature. Unless persistence was implemented separately, this should be described as frontend-only rather than as a saved account wishlist.

---

## 6. Product filtering

### File: `client/src/components/ProductFilters.jsx`

The product filter UI supports these dimensions:

- Category: desk, chair, or shelf
- Minimum price
- Maximum price
- Color
- Adjustable height

The filter component collects the selected values and calls its `onSearch(filters)` callback when the user applies the filters.

The product list combines the selected filters with its API-fetching behavior.

### Filter request flow

```text
User selects filters
       |
       v
ProductFilters
       |
       | onSearch(filters)
       v
ProductList
       |
       v
productApi / Axios
       |
       v
GET /api/products with query parameters
       |
       v
Backend product filtering
       |
       v
Updated product cards
```

### What was verified

The user confirmed that combined filters worked successfully.

This matters because individual filters may work separately while combinations can fail due to incorrect query construction, omitted values, or inconsistent parameter names. Testing combinations verifies more of the real user flow.

### Design lesson

Keep filter state and UI interaction in React, but use the backend's deterministic catalogue filtering as the source of matching products. The UI should not invent product facts or treat a model-generated response as the catalogue.

---

## 7. AI recommendation form

### File: `client/src/components/RecommendationForm.jsx`

The recommendation form allows the user to describe what they need in natural language.

Example request:

> Find an adjustable black desk under 8000 rupees.

The component:

1. Collects the user's request.
2. Trims whitespace before submitting.
3. Calls the recommendation API service.
4. Shows a loading state while waiting.
5. Displays an error if the request fails.
6. Handles the case where there are no recommendations.
7. Renders recommendation cards when a response is received.

The response cards display the personalized `reason` returned by the backend under a “Why this matches” heading.

### Recommendation flow

```text
User enters a natural-language request
       |
       v
RecommendationForm.jsx
       |
       v
recommendationApi.js
       |
       | POST /api/recommendations
       v
Express recommendation route
       |
       v
Recommendation controller
       |
       v
Product filtering + recommendation service
       |
       v
Groq generates recommendation JSON
       |
       v
Backend validates and builds response
       |
       v
React renders recommendation cards
```

### Important distinction: filtering versus natural-language interpretation

Structured filters can be applied deterministically when the request contains actual filter values. A natural-language sentence is not automatically equivalent to structured constraints unless the application explicitly parses it.

For example, a sentence containing “under ₹1,000” only becomes a reliable price filter if the application converts it into a structured minimum/maximum price value or otherwise enforces that constraint. Do not claim that every free-text constraint is guaranteed to be enforced just because the recommendation model received the sentence.

---

## 8. Recommendation UI and data presentation

The recommendation cards display the selected product's identifying details and Groq's personalized explanation.

The user explicitly decided not to display a separate **“Verified product details”** section in the UI. Verification should remain a backend responsibility, while the frontend presents the personalized reason and product information needed by the user.

This is a useful separation:

- **Backend:** validate response structure, verify product IDs, and check structured evidence against catalogue data.
- **Frontend:** show the product card and personalized reason in a simple, readable layout.

Internal verification metadata should not be exposed in the UI merely because it is useful during development.

---

## 9. Styling and responsive layout

### File: `client/src/App.css`

The styling work included:

- A responsive product grid
- Product card layout
- Product images
- Recommendation cards
- Spacing and visual hierarchy
- Wishlist styling
- Responsive behavior for smaller screens

The goal was to keep the product catalogue and AI recommendations readable and visually consistent.

The recorded project uses CSS rather than requiring a separate UI framework for this layout.

### What I learned

- Component structure and CSS responsibilities should stay reasonably separate.
- Product grids need to adapt to different viewport widths.
- Loading, error, and empty states are part of the UI, not afterthoughts.
- A working API is not enough if the result is hard to scan or the user cannot tell what happened.

---

## 10. Catalogue used by the UI

The development catalogue contains six fictional furniture records. It is sample data for this project, not real commercial inventory.

| ID | Product | Price | Notable catalogue details |
|---|---|---:|---|
| `desk-001` | Minimalist Study Desk | ₹6,500 | Engineered wood, black, minimalist design, laptop-friendly |
| `desk-002` | Compact Oak Study Desk | ₹7,200 | Oak veneer, brown, compact design, storage shelf |
| `desk-003` | Adjustable Work Desk | ₹7,800 | Engineered wood, black, height adjustable, cable management |
| `chair-001` | Ergonomic Office Chair | ₹4,500 | Mesh and metal, black, lumbar support, adjustable seat |
| `shelf-001` | Minimalist Bookshelf | ₹5,500 | Engineered wood, black, open shelves, minimalist design |
| `desk-004` | Premium Executive Desk | ₹12,500 | Solid wood, brown, large work surface, drawer storage |

The UI uses product IDs to connect catalogue records to their corresponding local images.

---

## 11. Manual integration and edge-case testing

The following scenarios were reported as tested during Day 4.

### Scenario 1 — Vague request

**Input:**

> I need some furniture for my room.

**Observed result:** The app returned sensible suggestions such as a desk, chair, and bookshelf. The displayed attributes were supported by the development catalogue.

**Lesson:** A vague request can still produce useful suggestions, but the reason should be grounded in the available product information and should not invent features.

### Scenario 2 — Impossible request

**Input:**

> Recommend a solid wood desk under ₹1,000 with a built-in swimming pool.

**Observed result:** No suitable recommendation was returned in the tested flow because the catalogue did not contain a product matching the request.

**Lesson:** Empty results are a valid outcome. The application should not invent an item just to satisfy the request.

**Important limitation:** This observed result does not prove that every hard constraint in arbitrary natural language is always enforced. That depends on how the request is parsed and how filters are applied.

### Scenario 3 — Backend unavailable

**Test:** Stop or make the backend unavailable while using the frontend.

**Observed result:** The frontend displayed a clear product-loading error rather than leaving the user with a broken page.

**Lesson:** Frontend code should handle network and server failures explicitly.

### Scenario 4 — Recovery after restarting the backend

**Test:** Restart the backend and retry the operation.

**Observed result:** The application recovered and worked again.

**Lesson:** Error handling should allow a user to recover by retrying, rather than permanently trapping the UI in an error state.

### Scenario 5 — Combined filters

**Test:** Apply more than one product filter together.

**Observed result:** Combined filtering worked successfully.

**Lesson:** Test combinations, not just individual controls.

### Scenario 6 — AI recommendations

**Test:** Submit a natural-language request through the recommendation form.

**Observed result:** Recommendations appeared in the UI with personalized explanations.

**Lesson:** Verify the whole path from form submission to backend processing to rendered results.

---

## 12. Common issues and how they were resolved

### CORS blocking frontend requests

**Cause:** The frontend and backend used different origins during local development.

**Resolution:** Configured the `cors` middleware in the backend to allow `http://localhost:5173` and placed it before API routes.

### Product images not matching cards

**Implementation approach:** Images are stored under `client/public/products/` and named using the corresponding product ID plus `.png`.

**Lesson:** A consistent identifier convention reduces the need for fragile image lookup logic.

### API and UI responsibilities

The API calls were moved into service modules rather than duplicating URL construction in components.

**Lesson:** A dedicated API layer helps maintain consistency and simplifies testing and debugging.

---

## 13. Day 4 skills learned

By completing the Day 4 implementation and manual checks, I practiced:

- Building React components that call a REST API
- Configuring Axios using a Vite environment variable
- Separating API logic into service modules
- Handling asynchronous loading and errors in the UI
- Passing filter state through component callbacks
- Applying multiple catalogue filters
- Posting natural-language requests to an AI recommendation endpoint
- Rendering API results as reusable product cards
- Using product IDs to map records to local assets
- Configuring CORS for local development
- Testing frontend/backend behavior end to end
- Handling empty results and service recovery
- Distinguishing structured constraints from unparsed natural-language requests

---

## 14. Day 4 file map

The following files and folders were part of the recorded implementation:

```text
Nestora/
├── client/
│   ├── .env
│   ├── public/
│   │   └── products/
│   │       ├── desk-001.png
│   │       ├── desk-002.png
│   │       ├── desk-003.png
│   │       ├── chair-001.png
│   │       ├── shelf-001.png
│   │       └── desk-004.png
│   └── src/
│       ├── components/
│       │   ├── ProductFilters.jsx
│       │   ├── ProductList.jsx
│       │   └── RecommendationForm.jsx
│       ├── services/
│       │   ├── api.js
│       │   ├── productApi.js
│       │   └── recommendationApi.js
│       ├── App.jsx
│       └── App.css
└── server/
    └── src/
        └── app.js
```

This is a summary of the recorded file map; verify exact filenames and current contents in the repository before treating it as a complete directory listing.

---

## 15. Interview-ready explanation

> “On Day 4, I integrated the React/Vite frontend with the Express backend using Axios and a dedicated API service layer. I built a product listing interface with loading, error, and empty states, then added filters for category, price range, color, and adjustable height. I also connected a natural-language recommendation form to the backend recommendation endpoint and displayed the resulting products with personalized explanations. During integration, I configured CORS for the local frontend origin, mapped catalogue product IDs to local product images, and tested combined filters, vague requests, impossible requests, backend failure, and recovery. One important design distinction is that structured filters can be enforced deterministically, while free-text constraints need explicit parsing or validation before they can be guaranteed.”

---

## 16. Day 4 completion checklist

- [x] Configured the frontend API base URL.
- [x] Created an Axios API layer.
- [x] Connected the product listing to the backend.
- [x] Implemented product filters for category, price, color, and adjustable height.
- [x] Connected the recommendation form to the recommendation endpoint.
- [x] Rendered product and recommendation cards.
- [x] Added loading, error, and empty-result handling.
- [x] Configured CORS for local development.
- [x] Mapped product IDs to local images.
- [x] Verified combined filtering.
- [x] Manually tested vague and impossible requests.
- [x] Tested backend-down behavior and recovery.
- [x] Confirmed the frontend recommendation flow worked.

**Day 4 takeaway:** A full-stack AI feature is more than a model call. It requires a reliable API layer, a usable frontend, predictable loading and error states, consistent catalogue data, and end-to-end checks.
