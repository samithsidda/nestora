# Nestora AI — Day 1 Notes

## 1. GenAI fundamentals
- An LLM generates text based on learned patterns and the context provided.
- The model's response depends on the prompt and generation settings.

## 2. Prompt engineering experiment
- A vague prompt can produce broad responses or clarifying questions.
- A structured prompt can guide the model toward a specific format and requirements.
- More detailed prompts do not guarantee factual accuracy.

## 3. Temperature experiment
- Temperature 0.1 produced one set of product recommendations.
- Temperature 1.2 produced different product names, prices, specifications and formatting.
- Temperature influences output variability; it does not guarantee correctness.

## 4. Hallucinations
- Models may generate plausible but unverified product listings or specifications.
- A confident response is not proof that its claims are true.
- Nestora must not present generated product details as verified catalogue data.

## 5. Application design principles
- Keep prompts separate from API request logic.
- Use a product catalogue as the source of product facts.
- Validate important fields in backend code.
- Allow the assistant to acknowledge missing information.

## 6. Day 1 implementation
- Initialized the Node.js backend.
- Created the Express application and server entry point.
- Implemented a health endpoint.
- Configured environment variables.
- Successfully tested a Groq API request.
- Experimented with prompt structure and temperature.
- Created a reusable furniture assistant prompt.

## 7. Remaining production considerations
- Keep API keys out of source control.
- Handle API errors and rate limits.
- Ground product recommendations in real catalogue data.
- Test responses for accuracy and instruction adherence.