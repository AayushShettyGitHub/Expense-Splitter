import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Assistant = () => {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); 

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
  let month = data?.month;
  const year = parseInt(data?.year) || new Date().getFullYear();
  let category = data?.category?.toLowerCase() || "all";

  const monthMap = {
    january: 1, february: 2, march: 3, april: 4,
    may: 5, june: 6, july: 7, august: 8,
    september: 9, october: 10, november: 11, december: 12,
  };

  if (typeof month === "string") {
    const lower = month.toLowerCase();
    month = monthMap[lower];
  }

  if (!month || isNaN(month) || month < 1 || month > 12) {
    setResponse("Month not recognized. Try something like 'Show expenses for July 2025'.");
    return;
  }

  navigate(
    `/view?intent=get_expenses&month=${month}&year=${year}&category=${category}`
  );
  return;
}


        case "get_budget":
          try {
            const res = await axios.get("http://localhost:3000/auth/get", {
              withCredentials: true,
            });
            setResponse(JSON.stringify(res.data, null, 2));
          } catch (err) {
            console.error("Error fetching budget:", err);
            setResponse("Error fetching budget.");
          }
          break;

        case "show_groups":
          try {
            const res = await axios.get("http://localhost:3000/auth/my-groups", {
              withCredentials: true,
            });
            setResponse(JSON.stringify(res.data, null, 2));
          } catch (err) {
            console.error("Error fetching groups:", err);
            setResponse("Error fetching groups.");
          }
          break;

        default:
          setResponse("Sorry, I couldn't understand your request.");
      }
    } catch (err) {
      console.error("Intent handling error:", err);
      setResponse("Error handling your request.");
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
