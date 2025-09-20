
import { useEffect, useState } from "react";
import axios from "axios";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
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
import { Progress } from "@/components/ui/progress";

const months = ["",
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const Budget = () => {
  const currentYear = new Date().getFullYear();
  const currentMonth = (new Date().getMonth() + 1).toString();
; 
 

  const [month, setMonth] = useState(currentMonth.toString());
  const [year, setYear] = useState(currentYear.toString());
  const [budget, setBudget] = useState(null);
  const [amount, setAmount] = useState("");
  const [expenses, setExpenses] = useState(0);

  const fetchBudget = async () => {
    try {
      const res = await axios.get(
        `https://split-backend-02lh.onrender.com/api/get?month=${month}&year=${year}`,
        { withCredentials: true }
      );
      setBudget(res.data);
      setAmount(res.data.amount);
    } catch (err) {
      setBudget(null);
      setAmount("");
    }
  };

  const fetchExpenses = async () => {
    try {
      const res = await axios.get(
        `https://split-backend-02lh.onrender.com/api/getExpenses?month=${month}&year=${year}`,
        { withCredentials: true }
      );
      const total = res.data.reduce((acc, e) => acc + e.amount, 0);
      setExpenses(total);
    } catch (err) {
      setExpenses(0);
    }
  };

  useEffect(() => {
    fetchBudget();
    fetchExpenses();
  }, [month, year]);

  const handleSubmit = async () => {
    try {
      if (budget) {
        await axios.put(
          `https://split-backend-02lh.onrender.com/api/update/${budget._id}`,
          { amount },
          { withCredentials: true }
        );
      } else {
        await axios.post(
          "https://split-backend-02lh.onrender.com/api/add",
          { amount, month, year },
          { withCredentials: true }
        );
      }
      fetchBudget();
    } catch (err) {
      console.error("Error saving budget:", err);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(
        `https://split-backend-02lh.onrender.com/api/delete/${budget._id}`,
        { withCredentials: true }
      );
      setBudget(null);
      setAmount("");
      setExpenses(0);
    } catch (err) {
      console.error("Error deleting budget:", err);
    }
  };

  const progress = budget ? Math.min((expenses / budget.amount) * 100, 100) : 0;
  const remaining = budget ? budget.amount - expenses : 0;
  const overBudget = budget && expenses > budget.amount;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Monthly Budget</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex gap-4 items-center flex-wrap">
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select Month" />
              </SelectTrigger>
              <SelectContent>
                {months.map((m, idx) => (
                  <SelectItem key={idx} value={idx.toString()}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Select Year" />
              </SelectTrigger>
              <SelectContent>
                {[currentYear, currentYear - 1].map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setMonth(currentMonth.toString());
                setYear(currentYear.toString());
              }}
            >
              Reset
            </Button>
          </div>

          {budget ? (
            <div className="space-y-4">
              <div className="text-lg">
                <span className="font-semibold">Budget:</span> ₹{budget.amount}
              </div>
              <div className="text-lg">
                <span className="font-semibold">Spent:</span> ₹{expenses}
              </div>
              <div className={`text-lg ${overBudget ? "text-red-600" : "text-green-600"}`}>
                <span className="font-semibold">
                  {overBudget ? "Over Budget by" : "Remaining"}:
                </span>{" "}
                ₹{Math.abs(remaining)}
              </div>

              <Progress value={progress} />

              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Update budget amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <Button onClick={handleSubmit}>Update</Button>
                <Button variant="destructive" onClick={handleDelete}>
                  Delete
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600">No budget set for this period.</p>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Set budget amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <Button onClick={handleSubmit}>Add Budget</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Budget;
