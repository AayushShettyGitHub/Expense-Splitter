import { useEffect, useState } from "react";
import axios from "axios";
import { useSearchParams } from "react-router-dom";

const categories = ["Food", "Travel", "Shopping", "Bills", "Health", "Settlement", "Other"];

const ViewExpense = () => {
  const [expenses, setExpenses] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();

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
      if (filters.category && filters.category !== "all") {
        queryParams.append("category", filters.category);
      }

      const res = await axios.get(
        `https://split-backend-02lh.onrender.com/api/getExpenses?${queryParams.toString()}`,
        { withCredentials: true }
      );

      setExpenses(res.data);
      setFiltered(res.data);
    } catch (error) {
      console.error("Expense fetch error:", error);
    }
  };

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

  useEffect(() => {
    let filteredData = [...expenses];

    if (search.trim()) {
      filteredData = filteredData.filter((e) =>
        e.description?.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFiltered(filteredData);
  }, [search, expenses]);

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
    <div className="p-4 bg-gray-50 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100">
      <div className="mb-4 flex flex-wrap gap-4">
        <input
          type="text"
          placeholder="Search by description"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border px-2 py-1 rounded bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border px-2 py-1 rounded bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="border px-2 py-1 rounded bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
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
          className="border px-2 py-1 rounded bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
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
          <p className="text-gray-500 dark:text-gray-400">No expenses found.</p>
        ) : (
          <ul className="space-y-2">
            {filtered.map((expense) => (
              <li
                key={expense._id}
                className="border p-3 rounded shadow-sm bg-white dark:bg-gray-800 dark:border-gray-700"
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
