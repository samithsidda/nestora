
require("dotenv").config();

const Groq = require("groq-sdk");

const {
  furnitureAssistantPrompt,
} = require("./prompts");
async function main() {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is missing from .env");
  }

  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });

  const response = await groq.chat.completions.create({
    model: process.env.GROQ_MODEL,
    temperature: 1.2,
        messages: [
    {
        role: "system",
        content: furnitureAssistantPrompt,
    },
    {
        role: "user",
        content: `I need a study`,
    },
    ],
  });

  console.log("Groq API request successful!");
  console.log(response.choices[0].message.content);
}

main().catch((error) => {
  console.error("Groq API request failed.");
  console.error("Error:", error.status || error.message);
  process.exitCode = 1;
});
