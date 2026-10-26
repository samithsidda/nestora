
const { searchProducts } = require("../services/productService");

const {
  generateRecommendations,
} = require("../services/recommendationService");

async function createRecommendations(req, res) {
  try {
    const { userRequest, filters = {} } = req.body;

    if (
      typeof userRequest !== "string" ||
      userRequest.trim().length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "userRequest must be a non-empty string.",
      });
    }

    if (
      typeof filters !== "object" ||
      filters === null ||
      Array.isArray(filters)
    ) {
      return res.status(400).json({
        success: false,
        message: "filters must be an object.",
      });
    }

    const products = searchProducts(filters);

    const result = await generateRecommendations(
      userRequest.trim(),
      products
    );

    return res.status(200).json({
      success: true,
      count: result.recommendations.length,
      ...result,
    });
  } catch (error) {
    console.error("Recommendation API error:", error.message);

    return res.status(502).json({
      success: false,
      message: "Unable to generate recommendations right now.",
    });
  }
}

module.exports = { createRecommendations };
