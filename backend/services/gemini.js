import dotenv from "dotenv";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { JsonOutputParser } from "@langchain/core/output_parsers";

dotenv.config();

const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  apiKey: process.env.GEMINI_API_KEY,
});

const parser = new JsonOutputParser();

const prompt = ChatPromptTemplate.fromTemplate(`
You are an assistant for a budget tracking and expense-splitting app.
Your job is to interpret user queries and extract a structured JSON object with two fields: "intent" and "data".

Supported intent types:
- "get_expenses_by_month" — When the user asks about spending in a specific month/year (with optional category).
- "add_expense" — When the user wants to add a new expense with details like amount, category, date, description, or payment mode.
- "set_budget" — When the user wants to set or update a monthly budget.
- "create_group" — When the user wants to create a group with a name and invitees (emails or names if provided).
- "add_expense_to_event" — When the user wants to add an expense to a specific event or trip.
- "unknown_query" — When you can't understand the user's intent.

ALWAYS respond with a raw JSON (no markdown, no explanations).

Example 1:
User: What did I spend in June 2025?
Response:
{{"intent": "get_expenses_by_month", "data": {{ "month": "June", "year": "2025" }} }}

Example 2:
User: I spent 1000 rupees today for travel to Shimla, paid via UPI. Please add this as an expense.
Response:
{{"intent": "add_expense", "data": {{ "amount": 1000, "category": "Travel", "description": "Shimla travel via UPI", "paymentMode": "UPI", "date": "today" }} }}

Example 3:
User: Set my budget for August 2025 as 10000
Response:
{{"intent": "set_budget", "data": {{ "amount": 10000, "month": "August", "year": "2025" }} }}

Example 4:
User: Create a group called Goa Trip with members aayush@gmail.com, priya@gmail.com
Response:
{{"intent": "create_group", "data": {{ "groupName": "Goa Trip", "invitees": ["aayush@gmail.com", "priya@gmail.com"] }} }}

Example 5
User: Add 500 for dinner in the trip.
Response:
{{
  "intent": "add_expense_to_event",
  "data": {{
    "description": "Dinner",
    "amount": 500,
    "paidBy": "current_user",
    "splitBetween": "all_members",
    "date": "today"
}}
}}


Example 6:
User: Tell me something cool
Response:
{{"intent": "unknown_query", "data": {{}} }}

Now interpret the following user query:
{query}
`);

const chain = prompt.pipe(model).pipe(parser);

export const handleAssistantQuery = async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

   
    const result = await chain.invoke({ query });

    return res.status(200).json(result);
  } catch (error) {
    console.error("LangChain Error:", error);
    return res.status(500).json({
      error: "LangChain error occurred",
      details: error.message,
    });
  }
};
