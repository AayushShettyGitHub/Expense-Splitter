import { useState, useEffect } from "react";
import api from "@/lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Bar, Pie } from "recharts";
import { BarChart, XAxis, YAxis, Tooltip, Legend, PieChart, Cell } from "recharts";

const months = ["",
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7f50", "#00c49f", "#ffbb28", "#ff8042"];

const PersonalDashboard = () => {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const [month, setMonth] = useState(currentMonth.toString());
  const [year, setYear] = useState(currentYear.toString());
  const [budget, setBudget] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [budgetRes, expenseRes] = await Promise.all([
        api.get(`/get?month=${month}&year=${year}`),
        api.get(`/getExpenses?month=${month}&year=${year}`),
      ]);

      setBudget(budgetRes.data);
      setExpenses(expenseRes.data);
    } catch (err) {
      setBudget(null);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [month, year]);

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const progress = budget ? Math.min((totalSpent / budget.amount) * 100, 100) : 0;
  const overBudget = budget && totalSpent > budget.amount;

  const categoryTotals = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});

  const pieData = Object.entries(categoryTotals).map(([cat, amt]) => ({
    name: cat,
    value: amt,
  }));

  const dailyTotals = expenses.reduce((acc, e) => {
    const day = new Date(e.date).getDate();
    acc[day] = (acc[day] || 0) + e.amount;
    return acc;
  }, {});

  const barData = Object.entries(dailyTotals)
    .map(([date, amount]) => ({
      date: parseInt(date),
      amount: amount,
    }))
    .sort((a, b) => a.date - b.date);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Personal Dashboard</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex gap-4 items-center flex-wrap">
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select Month" />
              </SelectTrigger>
              <SelectContent>
                {months.map((m, idx) => (
                  <SelectItem key={idx} value={idx.toString()}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Select Year" />
              </SelectTrigger>
              <SelectContent>
                {[currentYear, currentYear - 1].map((y) => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={() => {
              setMonth(currentMonth.toString());
              setYear(currentYear.toString());
            }}>
              Reset
            </Button>
          </div>

          {loading ? (
            <p>Loading...</p>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4">
                  <CardTitle>Budget</CardTitle>
                  <CardContent className="text-xl">₹{budget?.amount || 0}</CardContent>
                </Card>
                <Card className="p-4">
                  <CardTitle>Spent</CardTitle>
                  <CardContent className="text-xl">₹{totalSpent}</CardContent>
                </Card>
                <Card className="p-4">
                  <CardTitle>{overBudget ? "Over Budget" : "Remaining"}</CardTitle>
                  <CardContent className={`text-xl ${overBudget ? "text-red-600" : "text-green-600"}`}>
                    ₹{Math.abs((budget?.amount || 0) - totalSpent)}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-2">
                <div className="text-md font-semibold">Budget Used</div>
                <Progress value={progress} />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <Card className="p-4">
                  <CardTitle className="mb-2">Category Breakdown</CardTitle>
                  <PieChart width={300} height={300}>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      dataKey="value"
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </Card>

                <Card className="p-4">
                  <CardTitle className="mb-2">Daily Spending</CardTitle>
                  <BarChart width={350} height={300} data={barData}>
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="amount" fill="#8884d8" />
                  </BarChart>
                </Card>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PersonalDashboard;
