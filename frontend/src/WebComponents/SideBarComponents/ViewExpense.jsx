"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { format } from "date-fns";

const ViewExpense = () => {
  const [expenses, setExpenses] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchExpenses = async (params = {}) => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:3000/auth/getExpenses", {
        params,
        withCredentials: true,
      });
      setExpenses(res.data);
      setFiltered(res.data);
    } catch (err) {
      console.error("Error fetching expenses:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses({ days: 30 });
  }, []);

  useEffect(() => {
    let filteredData = [...expenses];
    if (search) {
      filteredData = filteredData.filter((e) =>
        e.description?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (category) {
      filteredData = filteredData.filter((e) => e.category === category);
    }
    setFiltered(filteredData);
  }, [search, category, expenses]);

  const handleFilterByMonthYear = () => {
    if (month && year) {
      fetchExpenses({ month, year });
    }
  };

  const handleResetFilters = () => {
    setSearch("");
    setCategory("");
    setMonth("");
    setYear("");
    fetchExpenses({ days: 30 });
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:3000/deleteExpense/${id}`, {
        withCredentials: true,
      });
      fetchExpenses({ days: 30 });
    } catch (err) {
      console.error("Failed to delete expense:", err);
    }
  };

  const totalSpent = filtered.reduce((sum, e) => sum + e.amount, 0);

  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    label: new Date(0, i).toLocaleString("default", { month: "long" }),
    value: String(i + 1),
  }));

  const yearOptions = [];
  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y >= currentYear - 10; y--) {
    yearOptions.push({ label: String(y), value: String(y) });
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Your Expenses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center flex-wrap">
            <Input
              placeholder="Search by description"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="md:w-1/3"
            />

            <Select onValueChange={setCategory} value={category}>
              <SelectTrigger className="md:w-40">
                <SelectValue placeholder="Filter by Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Food">Food</SelectItem>
                <SelectItem value="Travel">Travel</SelectItem>
                <SelectItem value="Shopping">Shopping</SelectItem>
                <SelectItem value="Bills">Bills</SelectItem>
                <SelectItem value="Health">Health</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>

            <Select onValueChange={setMonth} value={month}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select onValueChange={setYear} value={year}>
              <SelectTrigger className="w-28">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((y) => (
                  <SelectItem key={y.value} value={y.value}>
                    {y.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={handleFilterByMonthYear}>Apply Month & Year</Button>
            <Button variant="outline" onClick={handleResetFilters}>
              Reset Filters
            </Button>
          </div>

          {/* Table */}
          <div className="overflow-auto">
            <table className="w-full text-left border-collapse mt-4">
              <thead>
                <tr className="border-b">
                  <th className="p-2">Amount</th>
                  <th className="p-2">Category</th>
                  <th className="p-2">Date</th>
                  <th className="p-2">Description</th>
                  <th className="p-2">Mode</th>
                  <th className="p-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" className="text-center py-4">Loading...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-4">No expenses found.</td></tr>
                ) : (
                  filtered.map((exp) => (
                    <tr key={exp._id} className="border-b hover:bg-muted/30">
                      <td className="p-2">₹{exp.amount}</td>
                      <td className="p-2">{exp.category}</td>
                      <td className="p-2">
                        {format(new Date(exp.date), "dd MMM yyyy")}
                      </td>
                      <td className="p-2">{exp.description || "-"}</td>
                      <td className="p-2">{exp.paymentMode}</td>
                      <td className="p-2 text-center">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(exp._id)}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Total */}
          <div className="text-right font-semibold text-lg">
            Total: ₹{totalSpent}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ViewExpense;
