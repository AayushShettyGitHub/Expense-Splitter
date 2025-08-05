import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Assistant = () => {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const capitalize = (word) =>
    word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : "";

  const monthMap = {
    january: "January", february: "February", march: "March", april: "April",
    may: "May", june: "June", july: "July", august: "August",
    september: "September", october: "October", november: "November", december: "December",
  };

  const normalizeMonth = (month) => {
    if (!month) return null;
    const lower = month.toLowerCase();
    return monthMap[lower] || capitalize(month);
  };

  const getMonthNumber = (monthName) => {
    if (!monthName) return null;
    const lower = monthName.toLowerCase();
    const months = Object.keys(monthMap);
    return months.indexOf(lower) + 1;
  };

  const handleQuerySubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setResponse("");

    try {
      const { data: intentResponse } = await axios.post(
        "http://localhost:3000/auth/ask",
        { query },
        { withCredentials: true }
      );
      await handleIntent(intentResponse);
    } catch (error) {
      console.error("Error while fetching intent:", error);
      setResponse("Something went wrong. Please try again.");
    }

    setLoading(false);
  };

  const handleIntent = async ({ intent, data }) => {
    try {
      switch (intent) {
        case "get_expenses_by_month": {
          const month = normalizeMonth(data?.month);
          const year = parseInt(data?.year) || new Date().getFullYear();
          const category = data?.category?.toLowerCase() || "all";

          const monthNumber = getMonthNumber(month);

          if (!monthNumber || monthNumber < 1 || monthNumber > 12) {
            setResponse("Month not recognized. Try something like 'Show expenses for July 2025'.");
            return;
          }

          navigate(`/view?intent=get_expenses&month=${monthNumber}&year=${year}&category=${category}`);
          return;
        }

        case "add_expense": {
          const { amount, category, description, paymentMode, date } = data;

          if (!amount || !category || !description) {
            toast({ title: "Missing required fields like amount, category, or description." });
            return;
          }

          const formattedDate =
            date === "today"
              ? new Date().toISOString().slice(0, 10)
              : date || new Date().toISOString().slice(0, 10);

          const expensePayload = {
            amount: parseFloat(amount),
            category: capitalize(category),
            description,
            paymentMode: paymentMode || "Cash",
            date: formattedDate,
          };

          try {
            await axios.post("http://localhost:3000/auth/expenses", expensePayload, {
              withCredentials: true,
            });
            toast({ title: "Expense added successfully." });
          } catch (err) {
            console.error("Error adding expense:", err);
            toast({ title: "Failed to add expense.", variant: "destructive" });
          }
          return;
        }

        case "set_budget": {
  const { amount, month, year } = data;

  const normalizedMonth = normalizeMonth(month);
  const numericYear = parseInt(year);

  if (!normalizedMonth || !amount || !numericYear) {
    setResponse("Missing or invalid budget details.");
    toast({ title: "Missing or invalid budget details.", variant: "destructive" });
    return;
  }

  try {
    let budgetExists = false;
    let budgetId = null;

    try {
      const res = await axios.get(
        `http://localhost:3000/auth/get?month=${new Date(`${normalizedMonth} 1`).getMonth() + 1}&year=${numericYear}`,
        { withCredentials: true }
      );
      budgetExists = true;
      budgetId = res.data._id;
    } catch (err) {
      if (err.response?.status !== 404) {
        throw err; // true error
      }
      // If 404, we simply proceed to create
    }

    if (budgetExists && budgetId) {
      await axios.put(
        `http://localhost:3000/auth/update/${budgetId}`,
        { amount },
        { withCredentials: true }
      );
      setResponse(`Budget updated to ₹${amount} for ${normalizedMonth} ${numericYear}.`);
      toast({ title: `Budget updated to ₹${amount} for ${normalizedMonth} ${numericYear}.` });
    } else {
      await axios.post(
        `http://localhost:3000/auth/add`,
        {
          amount,
          month: new Date(`${normalizedMonth} 1`).getMonth() + 1, // numeric month
          year: numericYear,
        },
        { withCredentials: true }
      );
      setResponse(`Budget set to ₹${amount} for ${normalizedMonth} ${numericYear}.`);
      toast({ title: `Budget set to ₹${amount} for ${normalizedMonth} ${numericYear}.` });
    }
  } catch (err) {
    console.error("Error setting budget:", err);
    setResponse("Failed to set budget.");
    toast({ title: "Failed to set budget.", variant: "destructive" });
  }

  return;
}


        default:
          setResponse("Sorry, I couldn't understand your request.");
          toast({ title: "Unknown command received.", variant: "destructive" });
          return;
      }
    } catch (err) {
      console.error("Intent handling error:", err);
      setResponse("Error handling your request.");
      toast({ title: "Unexpected error occurred.", variant: "destructive" });
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <form onSubmit={handleQuerySubmit} className="flex gap-2">
        <input
          type="text"
          placeholder="Ask me something like 'Show my expenses for March'"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 border border-gray-300 p-2 rounded"
        />
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          {loading ? "Processing..." : "Ask"}
        </button>
      </form>

      {response && (
        <div className="mt-4 whitespace-pre-wrap bg-gray-100 p-4 rounded text-sm">
          <strong className="block mb-2 text-gray-700">Response:</strong>
          <pre>{response}</pre>
        </div>
      )}
    </div>
  );
};

export default Assistant;
