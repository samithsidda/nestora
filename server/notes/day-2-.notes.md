# Nestora AI — GenAI Engineering Workflow Log

## Purpose

This document records how Generative AI is used during Nestora AI development, including prompt design, implementation support, testing, debugging, and engineering decisions.

## 1. Problem Definition and Design

**Task:** Design a furniture discovery API.

**AI assistance:** Used AI to discuss API responsibilities, filtering behavior, validation rules, and possible edge cases.

**Engineering decision:** Keep product filtering deterministic. The backend applies explicit rules to structured catalogue data rather than asking an LLM to invent product matches.

**Verification:** Compared the implementation against the expected behavior of each supported query parameter.

## 2. Prompt Engineering Experiment

**Task:** Evaluate how prompt structure affects furniture recommendations.

**AI assistance:** Compared a broad furniture-assistant prompt with a more structured prompt that included user requirements and response constraints.

**Observation:** Structured instructions encouraged more relevant and organized responses, but did not eliminate unsupported claims.

**Engineering decision:** Prompt instructions alone are insufficient for guaranteeing factual product recommendations. Future recommendation responses must be grounded in retrieved catalogue records.

## 3. Model Temperature Experiment

**Task:** Compare model responses at lower and higher temperature settings.

**AI assistance:** Ran the same general task using temperature settings of 0.1 and 1.2.

**Observation:** The lower setting tended to produce more predictable responses, while the higher setting allowed more variation. Neither setting guaranteed factual accuracy.

**Engineering decision:** Use prompt constraints, structured product retrieval, and output validation together rather than relying on temperature alone.

## 4. API Implementation and Testing

**Task:** Implement product filtering and input validation.

**AI assistance:** Used AI to review filtering logic, suggest validation cases, and explain Jest and Supertest tests.

**Engineering work:** Implemented the Express route and product service, then added automated tests for product retrieval, price filtering, combined filters, invalid prices, invalid Boolean values, unsupported categories, and category case handling.

**Verification:** Ran the test suite and confirmed that all nine tests passed.

## 5. Reliability Principles

- Verify generated suggestions by running the code and automated tests.
- Never expose API keys in source control or logs.
- Keep catalogue retrieval separate from LLM-generated explanations.
- Do not treat plausible model output as verified product data.
- Document limitations and update tests when behavior changes.

## 6. Planned Next Steps

- Add grounded LLM recommendations using retrieved catalogue products.
- Test recommendation behavior with relevant and irrelevant catalogue results.
- Add tests for recommendation failures and malformed model output.
- Document AI-assisted code review and debugging decisions.
- Add continuous integration and deployment checks.

## Evidence Standard

Only mark a task as completed after implementing it and verifying the result. Planned work must remain labeled as planned work.