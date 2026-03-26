import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useSearchParams } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Calendar, Tag, RotateCcw, Filter } from "lucide-react";

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

      const res = await api.get(`/getExpenses?${queryParams.toString()}`);
      setExpenses(res.data);
      setFiltered(res.data);
    } catch (error) {
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
    <div className="container mx-auto p-6 max-w-5xl space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expense History</h1>
          <p className="text-muted-foreground">Monitor and manage your personal spending across all categories.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleResetFilters} className="flex gap-2">
            <RotateCcw className="w-4 h-4" /> Reset
          </Button>
          <Button size="sm" onClick={handleApplyFilters} className="flex gap-2">
            <Filter className="w-4 h-4" /> Apply Filters
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search description..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-10">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-muted-foreground" />
                    <SelectValue placeholder="Category" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="h-10">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <SelectValue placeholder="Month" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Any Month</SelectItem>
                  {Array.from({ length: 12 }, (_, i) => {
                    const m = (i + 1).toString().padStart(2, "0");
                    const monthName = new Date(2000, i).toLocaleString('default', { month: 'long' });
                    return <SelectItem key={m} value={m}>{monthName}</SelectItem>;
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="h-10">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <SelectValue placeholder="Year" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Any Year</SelectItem>
                  {["2023", "2024", "2025", "2026", "2027", "2028", "2029", "2030"].map((y) => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {filtered.length === 0 ? (
          <Card className="border-dashed h-64 flex flex-col items-center justify-center text-center p-8">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <Filter className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">No expenses found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters to find what you're looking for.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((expense) => {
              const isSettlement = expense.category === "Settlement";
              const isReceived = isSettlement && expense.description?.startsWith("Received");
              const isAuto = expense.description?.startsWith("[Auto]");
              
              let borderClass = "border-l-primary";
              if (isSettlement && isReceived) borderClass = "border-l-green-500";
              else if (isSettlement) borderClass = "border-l-amber-500";
              else if (isAuto) borderClass = "border-l-blue-400";

              return (
                <Card key={expense._id} className={`hover:shadow-md transition-all duration-300 border-l-4 ${borderClass} group`}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{expense.description}</h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-secondary text-secondary-foreground">
                            {expense.category}
                          </span>
                          {isSettlement && (
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${isReceived ? 'bg-green-500/10 text-green-600' : 'bg-amber-500/10 text-amber-600'}`}>
                              {isReceived ? "Received" : "Paid"}
                            </span>
                          )}
                          {isAuto && (
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-blue-500/10 text-blue-500">
                              Recurring
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-xl font-bold ${isSettlement && isReceived ? 'text-green-500' : isSettlement ? 'text-amber-500' : 'text-primary'}`}>
                          {isSettlement && isReceived ? '+' : '-'}{"\u20b9"}{Number(expense.amount).toLocaleString('en-IN')}
                        </p>
                        <p className="text-xs text-muted-foreground">{new Date(expense.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewExpense;
