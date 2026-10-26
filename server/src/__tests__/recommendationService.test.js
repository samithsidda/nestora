
jest.mock("groq-sdk", () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  }));
});

const Groq = require("groq-sdk");

const {
  generateRecommendations,
} = require("../services/recommendationService");

// Use the mock belonging to the Groq instance created by the service.
const mockCreate =
  Groq.mock.results[0].value.chat.completions.create;

const sampleProducts = [
  {
    id: "desk-003",
    name: "Adjustable Work Desk",
    category: "desk",
    price: 7800,
    currency: "INR",
    material: "engineered wood",
    color: "black",
    dimensions: {
      width: 100,
      depth: 60,
      height: 72,
      unit: "cm",
    },
    adjustableHeight: true,
    features: ["height adjustable", "cable management"],
    availability: "in_stock",
  },
];

describe("Nestora Recommendation Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("does not call Groq when no products match", async () => {
    const result = await generateRecommendations(
      "Find a desk under 1000 rupees.",
      []
    );

    expect(result.recommendations).toEqual([]);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  test("returns recommendations using catalogue product details", async () => {
    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              message: "This desk matches your requirements.",
              recommendations: [
                {
                  productId: "desk-003",
                  reason: "It is adjustable and within your budget.",
                  evidence: ["height adjustable", "cable management"],
                },
              ],
            }),
          },
        },
      ],
    });

    const result = await generateRecommendations(
      "Find an adjustable black desk under 8000 rupees.",
      sampleProducts
    );

    expect(result.recommendations).toHaveLength(1);
    expect(result.recommendations[0]).toEqual({
      productId: "desk-003",
      name: "Adjustable Work Desk",
      price: 7800,
      currency: "INR",
      reason: "It is adjustable and within your budget.",
    });

    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  test("rejects a recommendation containing an unknown product ID", async () => {
    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              message: "Here is a recommendation.",
              recommendations: [
                {
                  productId: "invented-desk-999",
                  reason: "It looks suitable.",
                  evidence: ["height adjustable"],
                },
              ],
            }),
          },
        },
      ],
    });

    await expect(
      generateRecommendations("Recommend a desk.", sampleProducts)
    ).rejects.toThrow(
      "The AI model returned an invalid product recommendation."
    );
  });

  test("rejects a recommendation with missing evidence", async () => {
    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              message: "Here is a recommendation.",
              recommendations: [
                {
                  productId: "desk-003",
                  reason: "This desk may suit your workspace.",
                },
              ],
            }),
          },
        },
      ],
    });

    await expect(
      generateRecommendations("Recommend a desk.", sampleProducts)
    ).rejects.toThrow(
      "The AI model returned an invalid product recommendation."
    );
  });

  test("rejects a recommendation with empty evidence", async () => {
    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              message: "Here is a recommendation.",
              recommendations: [
                {
                  productId: "desk-003",
                  reason: "This desk may suit your workspace.",
                  evidence: [],
                },
              ],
            }),
          },
        },
      ],
    });

    await expect(
      generateRecommendations("Recommend a desk.", sampleProducts)
    ).rejects.toThrow(
      "The AI model returned an invalid product recommendation."
    );
  });

  test("rejects fabricated product evidence", async () => {
    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              message: "Here is a recommendation.",
              recommendations: [
                {
                  productId: "desk-003",
                  reason: "This desk has a built-in swimming pool.",
                  evidence: ["built-in swimming pool"],
                },
              ],
            }),
          },
        },
      ],
    });

    await expect(
      generateRecommendations("Recommend a desk.", sampleProducts)
    ).rejects.toThrow(
      "The AI model returned unsupported product evidence."
    );
  });

  test("rejects invalid JSON from the model", async () => {
    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: "This is not valid JSON",
          },
        },
      ],
    });

    await expect(
      generateRecommendations("Recommend a desk.", sampleProducts)
    ).rejects.toThrow("The AI model returned invalid JSON.");
  });

  test("rejects an unexpected response structure", async () => {
    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              message: "Here is a recommendation.",
              recommendations: "not-an-array",
            }),
          },
        },
      ],
    });

    await expect(
      generateRecommendations("Recommend a desk.", sampleProducts)
    ).rejects.toThrow(
      "The AI model returned an unexpected response structure."
    );
  });

  test("propagates Groq API failures", async () => {
    mockCreate.mockRejectedValue(new Error("Simulated Groq failure"));

    await expect(
      generateRecommendations("Recommend a desk.", sampleProducts)
    ).rejects.toThrow("Simulated Groq failure");
  });
});
