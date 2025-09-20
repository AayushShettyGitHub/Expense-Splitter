import React, { useState } from "react";
import axios from "axios";

const AddExpenseForm = () => {
  const [form, setForm] = useState({
    amount: "",
    category: "",
    date: "",
    description: "",
    paymentMode: "Cash",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await axios.post(
        "https://split-backend-drcy.onrender.com/api/expenses",
        { ...form },
        { withCredentials: true }
      );
      setMessage("Expense added successfully.");
      setForm({
        amount: "",
        category: "",
        date: "",
        description: "",
        paymentMode: "Cash",
      });
    } catch (err) {
      setMessage(err.response?.data?.message || "Error adding expense");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-gray-900 p-6 shadow-md rounded-md mt-8 text-gray-900 dark:text-gray-100">
      <h2 className="text-xl font-semibold mb-4">Add Expense</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">Amount</label>
          <input
            type="number"
            name="amount"
            value={form.amount}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
            required
          />
        </div>

        <div>
          <label className="block mb-1">Category</label>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
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
            className="w-full border px-3 py-2 rounded bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
          />
        </div>

        <div>
          <label className="block mb-1">Description</label>
          <input
            type="text"
            name="description"
            value={form.description}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
          />
        </div>

        <div>
          <label className="block mb-1">Payment Mode</label>
          <select
            name="paymentMode"
            value={form.paymentMode}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
          >
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
            <option value="Card">Card</option>
            <option value="Netbanking">Netbanking</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-70"
          disabled={loading}
        >
          {loading ? "Adding..." : "Add Expense"}
        </button>

        {message && (
          <p className="text-sm mt-2 text-center text-gray-700 dark:text-gray-300">
            {message}
          </p>
        )}
      </form>
    </div>
  );
};

export default AddExpenseForm;
