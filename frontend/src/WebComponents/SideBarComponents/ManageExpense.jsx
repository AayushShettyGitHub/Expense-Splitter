import React, { useState, useEffect } from "react";
import api from "@/lib/api";

const AddExpenseForm = () => {
  const [activeTab, setActiveTab] = useState("regular"); // "regular" or "recurring"
  const [form, setForm] = useState({
    amount: "",
    category: "",
    date: "",
    description: "",
    paymentMode: "Cash",
    recurrenceType: "monthly",
    endDate: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [recurringExpenses, setRecurringExpenses] = useState([]);

  // Fetch recurring expenses when the tab is active
  useEffect(() => {
    if (activeTab === "recurring") {
      fetchRecurringExpenses();
    }
  }, [activeTab]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const url =
        activeTab === "regular"
          ? "/expenses"
          : "/recurring";

      await api.post(url, { ...form });

      setMessage(
        activeTab === "regular"
          ? "Expense added successfully."
          : "Recurring expense added successfully."
      );

      setForm({
        amount: "",
        category: "",
        date: "",
        description: "",
        paymentMode: "Cash",
        recurrenceType: "monthly",
        endDate: "",
      });

      if (activeTab === "recurring") fetchRecurringExpenses();
    } catch (err) {
      setMessage(err.response?.data?.message || "Error adding expense");
    } finally {
      setLoading(false);
    }
  };

  // Fetch recurring expenses
  const fetchRecurringExpenses = async () => {
    try {
      const res = await api.get("/recurring");
      setRecurringExpenses(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle recurring expense
  const toggleRecurring = async (id) => {
    try {
      await api.patch(`/recurring/${id}/toggle`, {});
      fetchRecurringExpenses();
    } catch (err) {
      console.error(err);
    }
  };

  // Delete recurring expense
  const deleteRecurring = async (id) => {
    try {
      await api.delete(`/recurring/${id}`);
      fetchRecurringExpenses();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-gray-900 p-6 shadow-md rounded-md mt-8 text-gray-900 dark:text-gray-100">
      <h2 className="text-xl font-semibold mb-4 text-center">
        {activeTab === "regular" ? "Add Expense" : "Add Recurring Expense"}
      </h2>

      {/* Tabs */}
      <div className="flex mb-4 border-b dark:border-gray-700">
        <button
          type="button"
          onClick={() => setActiveTab("regular")}
          className={`flex-1 py-2 text-center font-medium ${activeTab === "regular"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500 dark:text-gray-400"
            }`}
        >
          Regular
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("recurring")}
          className={`flex-1 py-2 text-center font-medium ${activeTab === "recurring"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500 dark:text-gray-400"
            }`}
        >
          Recurring
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Common fields */}
        <div>
          <label className="block mb-1">Amount</label>
          <input
            type="number"
            name="amount"
            value={form.amount}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded bg-white dark:bg-gray-800 dark:border-gray-700"
            required
          />
        </div>

        <div>
          <label className="block mb-1">Category</label>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded bg-white dark:bg-gray-800 dark:border-gray-700"
            required
          >
            <option value="">Select</option>
            <option value="Food">Food</option>
            <option value="Travel">Travel</option>
            <option value="Shopping">Shopping</option>
            <option value="Bills">Bills</option>
            <option value="Health">Health</option>
            <option value="Settlement">Settlement</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label className="block mb-1">Date</label>
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded bg-white dark:bg-gray-800 dark:border-gray-700"
          />
        </div>

        <div>
          <label className="block mb-1">Description</label>
          <input
            type="text"
            name="description"
            value={form.description}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded bg-white dark:bg-gray-800 dark:border-gray-700"
          />
        </div>

        <div>
          <label className="block mb-1">Payment Mode</label>
          <select
            name="paymentMode"
            value={form.paymentMode}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded bg-white dark:bg-gray-800 dark:border-gray-700"
          >
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
            <option value="Card">Card</option>
            <option value="Netbanking">Netbanking</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Recurring-only fields */}
        {activeTab === "recurring" && (
          <>
            <div>
              <label className="block mb-1">Recurrence Type</label>
              <select
                name="recurrenceType"
                value={form.recurrenceType}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded bg-white dark:bg-gray-800 dark:border-gray-700"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            <div>
              <label className="block mb-1">End Date</label>
              <input
                type="date"
                name="endDate"
                value={form.endDate}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded bg-white dark:bg-gray-800 dark:border-gray-700"
              />
            </div>
          </>
        )}

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-70"
          disabled={loading}
        >
          {loading
            ? "Adding..."
            : activeTab === "regular"
              ? "Add Expense"
              : "Add Recurring Expense"}
        </button>

        {message && (
          <p className="text-sm mt-2 text-center text-gray-700 dark:text-gray-300">
            {message}
          </p>
        )}
      </form>

      {/* Recurring Expenses List */}
      {activeTab === "recurring" && recurringExpenses.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Recurring Expenses</h3>
          <ul className="space-y-2">
            {recurringExpenses.map((expense) => (
              <li
                key={expense._id}
                className="flex justify-between items-center border p-2 rounded"
              >
                <div>
                  {expense.description || expense.category} - ₹{expense.amount} ({expense.recurrenceType})
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleRecurring(expense._id)}
                    className="bg-yellow-500 text-white px-2 py-1 rounded"
                  >
                    {expense.isActive ? "Pause" : "Resume"}
                  </button>
                  <button
                    onClick={() => deleteRecurring(expense._id)}
                    className="bg-red-600 text-white px-2 py-1 rounded"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AddExpenseForm;
