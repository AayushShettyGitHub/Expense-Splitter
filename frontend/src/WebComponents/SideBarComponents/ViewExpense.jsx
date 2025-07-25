import { useEffect, useState } from "react";
import axios from "axios";
import { useSearchParams, useNavigate } from "react-router-dom";

const ViewExpense = () => {
  const [expenses, setExpenses] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Filter state synced with searchParams
  const [category, setCategory] = useState(searchParams.get("category") || "all");
  const [month, setMonth] = useState(searchParams.get("month") || "");
  const [year, setYear] = useState(searchParams.get("year") || "");

  const fetchExpenses = async (filters = {}) => {
    try {
      const userId = localStorage.getItem("userId");
      const queryParams = new URLSearchParams();

      queryParams.append("userId", userId);
      if (filters.month) queryParams.append("month", filters.month);
      if (filters.year) queryParams.append("year", filters.year);
      if (filters.category && filters.category !== "all")
        queryParams.append("category", filters.category);

      const res = await axios.get(
        `http://localhost:3000/auth/getExpenses?${queryParams.toString()}`,
        { withCredentials: true }
      );

      setExpenses(res.data);
      setFiltered(res.data);
    } catch (error) {
      console.error("Expense fetch error:", error);
    }
  };

  // Initial + searchParams-based fetch
  useEffect(() => {
    const monthParam = searchParams.get("month");
    const yearParam = searchParams.get("year");
    const categoryParam = searchParams.get("category");

    setMonth(monthParam || "");
    setYear(yearParam || "");
    setCategory(categoryParam || "all");

    fetchExpenses({
      month: monthParam,
      year: yearParam,
      category: categoryParam,
    });
  }, [searchParams]);

  // Filter by search input + category on frontend
  useEffect(() => {
    let filteredData = [...expenses];

    if (search.trim()) {
      filteredData = filteredData.filter((e) =>
        e.description?.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (category && category !== "all") {
      filteredData = filteredData.filter((e) => e.category === category);
    }

    setFiltered(filteredData);
  }, [search, category, expenses]);

  const handleApplyFilters = () => {
    const params = {};
    if (month) params.month = month;
    if (year) params.year = year;
    if (category && category !== "all") params.category = category;

    setSearchParams({ intent: "get_expenses", ...params });
  };

  const handleResetFilters = () => {
    setSearch("");
    setMonth("");
    setYear("");
    setCategory("all");
    setSearchParams({});
  };

  return (
    <div className="p-4">
      <div className="mb-4 flex flex-wrap gap-4">
        <input
          type="text"
          placeholder="Search by description"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border px-2 py-1 rounded"
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border px-2 py-1 rounded"
        >
          <option value="all">All Categories</option>
          <option value="food">Food</option>
          <option value="travel">Travel</option>
          <option value="shopping">Shopping</option>
          <option value="other">Other</option>
        </select>

        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="border px-2 py-1 rounded"
        >
          <option value="">Month</option>
          {Array.from({ length: 12 }, (_, i) => {
            const m = (i + 1).toString().padStart(2, "0");
            return (
              <option key={m} value={m}>
                {m}
              </option>
            );
          })}
        </select>

        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="border px-2 py-1 rounded"
        >
          <option value="">Year</option>
          {["2023", "2024", "2025"].map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>

        <button
          onClick={handleApplyFilters}
          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
        >
          Apply Filters
        </button>

        <button
          onClick={handleResetFilters}
          className="bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500"
        >
          Reset
        </button>
      </div>

      <div>
        {filtered.length === 0 ? (
          <p className="text-gray-500">No expenses found.</p>
        ) : (
          <ul className="space-y-2">
            {filtered.map((expense) => (
              <li
                key={expense._id}
                className="border p-3 rounded shadow-sm bg-white"
              >
                <p><strong>{expense.description}</strong></p>
                <p>Category: {expense.category}</p>
                <p>Amount: ₹{expense.amount}</p>
                <p>Date: {expense.date?.slice(0, 10)}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ViewExpense;
