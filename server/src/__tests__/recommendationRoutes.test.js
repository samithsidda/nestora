
const request = require("supertest");

jest.mock("../services/recommendationService", () => ({
  generateRecommendations: jest.fn(),
}));

const app = require("../app");
const {
  generateRecommendations,
} = require("../services/recommendationService");

describe("Nestora Recommendation API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("generates recommendations for a valid request", async () => {
    generateRecommendations.mockResolvedValue({
      message: "This desk matches your requirements.",
      recommendations: [
        {
          productId: "desk-003",
          name: "Adjustable Work Desk",
          price: 7800,
          currency: "INR",
          reason: "It is adjustable and within your budget.",
        },
      ],
    });

    const response = await request(app)
      .post("/api/recommendations")
      .send({
        userRequest: "Find an adjustable black desk under 8000 rupees.",
        filters: {
          category: "desk",
          color: "black",
          maxPrice: 8000,
          adjustableHeight: true,
        },
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.count).toBe(1);
    expect(response.body.recommendations[0].productId).toBe("desk-003");

    expect(generateRecommendations).toHaveBeenCalledTimes(1);
    expect(generateRecommendations.mock.calls[0][1]).toHaveLength(1);
    expect(generateRecommendations.mock.calls[0][1][0].id).toBe("desk-003");
  });

  test("rejects a missing user request", async () => {
    const response = await request(app)
      .post("/api/recommendations")
      .send({
        filters: { category: "desk" },
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(generateRecommendations).not.toHaveBeenCalled();
  });

  test("rejects an empty user request", async () => {
    const response = await request(app)
      .post("/api/recommendations")
      .send({
        userRequest: "   ",
      });

    expect(response.status).toBe(400);
    expect(generateRecommendations).not.toHaveBeenCalled();
  });

  test("rejects filters that are not an object", async () => {
    const response = await request(app)
      .post("/api/recommendations")
      .send({
        userRequest: "Find me a desk.",
        filters: ["desk"],
      });

    expect(response.status).toBe(400);
    expect(generateRecommendations).not.toHaveBeenCalled();
  });

  test("returns an empty recommendation list when nothing matches", async () => {
    generateRecommendations.mockResolvedValue({
      message:
        "I couldn't find products matching your requirements. Try adjusting your filters.",
      recommendations: [],
    });

    const response = await request(app)
      .post("/api/recommendations")
      .send({
        userRequest: "Find a desk costing at least 20000 rupees.",
        filters: {
          category: "desk",
          minPrice: 20000,
        },
      });

    expect(response.status).toBe(200);
    expect(response.body.count).toBe(0);
    expect(response.body.recommendations).toEqual([]);

    expect(generateRecommendations).toHaveBeenCalledWith(
      "Find a desk costing at least 20000 rupees.",
      []
    );
  });

  test("handles recommendation service failures", async () => {
    generateRecommendations.mockRejectedValue(
      new Error("Groq API unavailable")
    );

    const response = await request(app)
      .post("/api/recommendations")
      .send({
        userRequest: "Recommend a desk.",
        filters: { category: "desk" },
      });

    expect(response.status).toBe(502);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(
      "Unable to generate recommendations right now."
    );
  });
});
