const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); 
exports.handleAssistantQuery = async (req, res) => {
  try {
    const { query } = req.body;

const systemPrompt = `
You are an assistant for a budget tracking app.
Your job is to interpret user queries and extract a structured JSON object with two fields: "intent" and "data".

Supported intent types:
- "get_expenses_by_month" — When the user asks about spending in a specific month/year.
- "unknown_query" — When you can't understand the user's intent.

🧠 ALWAYS respond with a raw JSON (no markdown, no explanations). Follow this exact format:

Example 1:
User: What did I spend in June 2025?
Response:
{
  "intent": "get_expenses_by_month",
  "data": {
    "month": "June",
    "year": "2025"
  }
}

Example 2:
User: Can you show me my February expenses from last year?
Response:
{
  "intent": "get_expenses_by_month",
  "data": {
    "month": "February",
    "year": "2024"
  }
}

Example 3:
User: Tell me something cool
Response:
{
  "intent": "unknown_query",
  "data": {}
}

Now interpret the following user query:
`;


   const finalPrompt = `${systemPrompt}User: ${query}`;
   console.log("Final Prompt:", finalPrompt);
const result = await model.generateContent(finalPrompt);

    
    if (!result || typeof result !== 'object' || !('response' in result)) {
      console.error("Unexpected Gemini result:", result);
      return res.status(500).json({
        error: "Invalid Gemini response structure",
        result,
      });
    }

    const text = result.response.text().trim().replace(/```json|```/g, "");

    let jsonResult;
    try {
      jsonResult = JSON.parse(text);
    } catch (err) {
      console.error("Failed to parse Gemini output:", text);
      return res.status(400).json({
        error: "Invalid JSON returned by Gemini",
        raw: text,
      });
    }

    return res.status(200).json(jsonResult);
  } catch (error) {
    console.error("Gemini Error:", error);
    return res.status(500).json({
      error: "Gemini error occurred",
      details: error.message,
    });
  }
};
