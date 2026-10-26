# Nestora AI — Day 5 Learning Log
## Testing, Debugging, and Recommendation Reliability

**Project:** Nestora AI  
**Day:** 5  
**Focus:** Automated testing, structured evidence validation, integration testing, and responsible use of GenAI during software development.

---

## 1. Day 5 goals

Day 5 focused on making the existing Nestora AI recommendation flow more reliable, verifying it through automated and manual tests, and documenting how GenAI tools were used during development.

By the end of this work, the recommendation service test suite passed and the planned manual integration scenarios were reported as passing.

## 2. What I learned

### 2.1 Unit testing versus integration testing

**Unit tests** exercise a small unit of code in isolation. In the recommendation service tests, the Groq SDK is mocked so the tests can control the model response without making real API calls.

This lets the tests check how `generateRecommendations()` handles valid and invalid responses deterministically.

**Integration testing** checks whether components work together. The manual checks exercised the frontend, backend, and recommendation flow as a connected application.

Key lesson: passing unit tests is important, but it does not by itself prove that the entire application works correctly in a browser.

### 2.2 Mocking an external AI service

The tests mock `groq-sdk` and its `chat.completions.create` method. A test can supply a predictable response or simulate a failure.

Benefits:
- Tests do not depend on network availability or the live model.
- Tests do not need to spend API credits.
- Invalid or unusual model outputs can be tested repeatably.
- Groq failures can be simulated without actually taking the service offline.

The mock validates our backend's handling of model responses; it does not evaluate the quality of a live Groq response.

### 2.3 Validating structured model output

The recommendation service expects the model to return JSON with a message and a recommendations array. Each recommendation includes a product ID, a personalized reason, and an evidence array.

The backend validates the response structure, checks that each product ID belongs to the supplied catalogue, and verifies that each evidence item is an exact feature string from the selected product's `features` array.

The backend then builds the response's product name, price, and currency from the catalogue rather than trusting the model to provide those details.

**Why this matters:** prompts guide model behavior but do not guarantee that the model will follow the requested format or use valid data. Server-side validation provides a deterministic check for the fields we validate.

### 2.4 Evidence validation is not complete truth verification

The new `evidence` field links a recommendation to catalogue feature strings. For example, the test product `desk-003` has these features:
- `height adjustable`
- `cable management`

Those exact strings are accepted as evidence. A fabricated feature such as `built-in swimming pool` is rejected because it is not in the product's catalogue features.

However, this does **not** prove every sentence in the free-form `reason` is factual. A model could include valid evidence but still write a misleading explanation. Evidence validation is a useful safeguard, not a guarantee that the whole explanation is hallucination-free.

### 2.5 Keeping internal verification details out of the response

During testing, the expected recommendation object failed deep equality because the service returned an additional `verifiedDetails` property. The project decision was to keep verification internal and return only the fields the UI needs:
- `productId`
- `name`
- `price`
- `currency`
- `reason`

The backend still validates evidence before constructing this response. The frontend does not need to render the internal evidence field.

### 2.6 Reading test failures precisely

Two failures helped reinforce the difference between implementation behavior and test expectations.

**Failure A — Missing evidence**

After evidence validation was added, the success test failed because its mocked Groq response still used the old structure with only `productId` and `reason`.

Resolution: update successful test mocks to include non-empty evidence strings that exactly match the product's catalogue features. Keep tests for missing or invalid evidence intentionally invalid.

**Failure B — Unexpected `verifiedDetails` property**

The success test expected the original response shape, but the actual object contained `verifiedDetails`. Jest's `toEqual()` reported the extra fields.

Resolution: remove `verifiedDetails` from the public recommendation object because the chosen design keeps verification metadata internal. Do not remove the evidence validation itself.

The broader lesson is to identify whether a test failure comes from a regression, a stale test fixture, or a deliberate API contract change before changing code.

---

## 3. Automated test coverage

The updated `server/src/__tests__/recommendationService.test.js` covers these scenarios:

1. **Empty catalogue:** returns no recommendations and does not call Groq.
2. **Successful recommendation:** accepts valid product ID, reason, and evidence, then uses catalogue-derived product details.
3. **Unknown product ID:** rejects a recommendation that refers to a product not supplied in the catalogue.
4. **Missing evidence:** rejects a recommendation with no evidence field.
5. **Empty evidence:** rejects a recommendation with an empty evidence array.
6. **Fabricated evidence:** rejects evidence that does not exactly match a feature on the selected product.
7. **Invalid JSON:** rejects a model response that cannot be parsed as JSON.
8. **Unexpected response structure:** rejects a response whose `recommendations` field is not an array.
9. **Groq API failure:** propagates the simulated API error for the calling layer to handle.

**Observed result:** The user reported that all test suites passed after the updated test file was added.

### Why the Groq mock matters

These tests use a mock instead of a real Groq call. This makes them fast and repeatable, and allows deliberately malformed responses to be tested. A passing mocked test suite demonstrates backend behavior for the supplied cases; it does not prove the live model will always return the expected structure.

---

## 4. Manual integration checks

The following scenarios were run manually through the application. The user reported that all scenarios passed.

| Scenario | Expected/observed behavior |
|---|---|
| Normal request: “Find an adjustable desk under ₹8,000” | Suitable product cards and personalized explanations appeared. |
| Vague request: “I need furniture for my room” | Sensible recommendations appeared from the available catalogue. |
| Impossible request: “Find a solid wood desk under ₹1,000” | No matching products were returned in the tested UI flow. |
| Backend unavailable | The frontend showed a clear error rather than a broken page. |
| Backend restored and retried | The application recovered and worked again. |

Important nuance: a free-text request does not automatically become a structured filter unless the application implements that parsing. The observed impossible-request result describes the tested flow; it should not be taken as proof that every natural-language hard constraint is always enforced deterministically.

---

## 5. What I learned about responsible GenAI development

### Prompts are guidance, not enforcement

The prompt tells Groq to use the supplied catalogue, avoid inventing details, and return a specific JSON structure. These instructions improve the likelihood of useful output but are not a security or correctness boundary.

### The backend must own trusted product facts

The service checks product IDs against the catalogue and uses catalogue records for returned product names, prices, and currency. This reduces the chance of displaying model-invented product identity or price.

### Validate every important structured field

A response can be valid JSON but still contain an unknown product ID, missing evidence, empty evidence, or fabricated feature strings. Each requires its own validation and test.

### Be precise about guarantees

Evidence validation proves only that the evidence strings match listed features. It does not prove the entire natural-language reason is true or that all user constraints have been satisfied.

### Use tests to protect design decisions

When the public API response shape changed to remove `verifiedDetails`, the test expectation needed to match the intended API contract. The evidence-validation checks remained in place.

---

## 6. GenAI-assisted SDLC workflow log

This section records the development workflow based on the work completed during Day 5.

| SDLC stage | How GenAI was used | Human verification |
|---|---|---|
| Design | Discussed keeping personalized model reasoning while validating structured evidence on the backend. | Chose to keep verification metadata internal and preserve the frontend's existing display. |
| Implementation | Used AI assistance to propose evidence-field validation and updates to Jest mocks and tests. | Reviewed and applied changes in the project. |
| Testing | Used AI assistance to identify missing-evidence, empty-evidence, and fabricated-evidence test cases. | Ran `npm test` and confirmed that all test suites passed. |
| Debugging | Investigated failures caused by a missing evidence field in an old mock and an extra `verifiedDetails` field in the result. | Updated the mock and aligned the returned object with the intended response contract. |
| Integration | Used a manual checklist for normal, vague, impossible, backend-down, and recovery scenarios. | Ran the scenarios in the application and reported that they passed. |
| Review | Discussed the limitations of evidence validation and the risks of trusting free-form model explanations. | Retained backend validation and documented that it does not guarantee complete factuality of the reason. |

### Example debugging record

**Issue:** The recommendation service test failed with `The AI model returned an invalid product recommendation.`

**Cause:** The test's mocked model response did not include the newly required evidence array.

**Fix:** Added evidence strings that exactly matched the selected product's catalogue features, while keeping negative tests intentionally invalid.

**Verification:** The user reported that all test suites passed.

### Example API-contract record

**Issue:** Jest reported an unexpected `verifiedDetails` property in a deep-equality assertion.

**Cause:** The implementation returned extra metadata not included in the intended public response.

**Fix:** Removed `verifiedDetails` from the returned recommendation object, while retaining evidence validation before the response is constructed.

**Verification:** The user reported that all test suites passed afterward.

---

## 7. Limitations and next improvements

These are known limitations or potential improvements, not claims that they have already been implemented.

- **Free-form reason validation:** The service validates evidence but does not fully verify every factual claim in `reason`.
- **Hard constraints:** If strict budget, dimensions, material, or other requirements must always be enforced, parse them into structured constraints and filter products deterministically before asking Groq to explain matches.
- **Live model behavior:** Mocked tests do not replace a small number of controlled tests against the real Groq API.
- **Operational resilience:** Production readiness may require timeouts, retry policy, rate-limit handling, logging, and monitoring.
- **Test coverage:** Consider adding explicit tests for an empty model response, malformed evidence types, and any other response-shape edge cases not yet covered.
- **Security and deployment:** Continue reviewing environment variables, CORS, dependency health, CI, and production configuration in the later project phases.

---

## 8. Day 5 completion checklist

- [x] Recommendation service test suite updated for evidence validation.
- [x] Unknown-product test fixture includes valid evidence to isolate the ID check.
- [x] Missing evidence test added.
- [x] Empty evidence test added.
- [x] Fabricated evidence test added.
- [x] All test suites reported passing.
- [x] Manual integration scenarios reported passing.
- [ ] Save this learning log into the repository as `docs/genai-workflow.md`.
- [ ] Confirm that the repository documentation matches the final implementation.

## 9. Interview-ready summary

> “In Nestora AI, I used Groq to generate personalized furniture recommendations grounded in a local product catalogue. During reliability testing, I added structured evidence to each model recommendation and validated that every evidence string exactly matched a feature of the selected catalogue product. I also validated product IDs and constructed displayed product details from trusted catalogue data instead of trusting the model to generate them. I used Jest with a mocked Groq SDK to test successful responses, unknown IDs, missing and fabricated evidence, malformed JSON, unexpected response structures, empty catalogues, and API failures. I then manually checked the frontend/backend flow, including empty results and backend recovery. One limitation is that evidence validation does not prove every claim in a free-form explanation is true, so I documented that limitation rather than claiming the system is completely hallucination-proof.”

---

**Day 5 takeaway:** Reliable GenAI software requires more than a good prompt. It needs explicit response contracts, deterministic backend validation, targeted negative tests, integration checks, and honest documentation of what the safeguards do—and do not—guarantee.
