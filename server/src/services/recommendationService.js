
const Groq = require("groq-sdk");

const { furnitureAssistantPrompt } = require("../prompts");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function generateRecommendations(userRequest, products) {
  // Do not call the LLM when no products match.
  if (!products || products.length === 0) {
    return {
      message:
        "I couldn't find products matching your requirements. Try adjusting your filters.",
      recommendations: [],
    };
  }

  const catalogue = products.map((product) => ({
    id: product.id,
    name: product.name,
    category: product.category,
    price: product.price,
    currency: product.currency,
    material: product.material,
    color: product.color,
    dimensions: product.dimensions,
    adjustableHeight: product.adjustableHeight,
    features: product.features,
    availability: product.availability,
  }));

  const completion = await groq.chat.completions.create({
    model: process.env.GROQ_MODEL,
    temperature: 0.1,
    messages: [
      {
        role: "system",
        content: furnitureAssistantPrompt,
      },
      {
        role: "user",
        content: JSON.stringify({
          userRequest,
          catalogue,
        }),
      },
    ],
  });

  const content = completion.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("The AI model returned an empty response.");
  }

  let result;

  try {
    result = JSON.parse(content);
  } catch {
    throw new Error("The AI model returned invalid JSON.");
  }

  if (
    !result ||
    typeof result.message !== "string" ||
    !Array.isArray(result.recommendations)
  ) {
    throw new Error("The AI model returned an unexpected response structure.");
  }

  // Validate that every recommendation references a supplied product.
  // Validate recommendation IDs, reasons, and evidence.
  const allowedProductIds = new Set(products.map((product) => product.id));

  for (const recommendation of result.recommendations) {
    if (
      !recommendation ||
      typeof recommendation.productId !== "string" ||
      !allowedProductIds.has(recommendation.productId) ||
      typeof recommendation.reason !== "string" ||
      !Array.isArray(recommendation.evidence) ||
      recommendation.evidence.length === 0
    ) {
      throw new Error(
        "The AI model returned an invalid product recommendation."
      );
    }

    const product = products.find(
      (item) => item.id === recommendation.productId
    );

    const allowedEvidence = Array.isArray(product.features)
      ? product.features
      : [];

    const evidenceIsValid = recommendation.evidence.every(
      (item) =>
        typeof item === "string" &&
        allowedEvidence.includes(item)
    );

    if (!evidenceIsValid) {
      throw new Error(
        "The AI model returned unsupported product evidence."
      );
    }
  }

  return {
    message: result.message,
    recommendations: result.recommendations.map((recommendation) => {
      const product = products.find(
        (item) => item.id === recommendation.productId
      );

      return {
        productId: product.id,
        name: product.name,
        price: product.price,
        currency: product.currency,
        reason: recommendation.reason,
      };
    }),
  };
}

module.exports = { generateRecommendations };
