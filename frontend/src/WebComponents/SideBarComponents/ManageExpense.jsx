import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PlusCircle, Calendar, CreditCard, Tag, FileText, Trash2, PauseCircle, PlayCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AddExpenseForm = () => {
  const [activeTab, setActiveTab] = useState("regular");
  const { toast } = useToast();
  const [form, setForm] = useState({
    amount: "",
    category: "",
    date: new Date().toISOString().split('T')[0],
    description: "",
    paymentMode: "Cash",
    recurrenceType: "monthly",
    endDate: "",
  });

  const [loading, setLoading] = useState(false);
  const [recurringExpenses, setRecurringExpenses] = useState([]);

  useEffect(() => {
    if (activeTab === "recurring") {
      fetchRecurringExpenses();
    }
  }, [activeTab]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name, value) => {
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = activeTab === "regular" ? "/expenses" : "/recurring";
      await api.post(url, { ...form });

      toast({
        title: activeTab === "regular" ? "Expense recorded" : "Recurring cycle started",
        description: "Your financial data has been updated.",
      });

      setForm({
        amount: "",
        category: "",
        date: new Date().toISOString().split('T')[0],
        description: "",
        paymentMode: "Cash",
        recurrenceType: "monthly",
        endDate: "",
      });

      if (activeTab === "recurring") fetchRecurringExpenses();
    } catch (err) {
      toast({
        title: "Submission failed",
        description: "Could not record the expense. Please verify the details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRecurringExpenses = async () => {
    try {
      const res = await api.get("/recurring");
      setRecurringExpenses(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleRecurring = async (id, isActive) => {
    try {
      await api.patch(`/recurring/${id}/toggle`, {});
      fetchRecurringExpenses();
      toast({
        title: isActive ? "Cycle paused" : "Cycle resumed",
      });
    } catch (err) {
      toast({ title: "Update failed", variant: "destructive" });
    }
  };

  const deleteRecurring = async (id) => {
    try {
      await api.delete(`/recurring/${id}`);
      fetchRecurringExpenses();
      toast({
        title: "Record removed",
        variant: "destructive",
      });
    } catch (err) {
      toast({ title: "Deletion failed", variant: "destructive" });
    }
  };

  const processDueExpenses = async () => {
    try {
      await api.post("/recurring/process");
      fetchRecurringExpenses();
      toast({ title: "Synchronized", description: "All due entries have been generated." });
    } catch (err) {
      toast({ title: "Processing error", variant: "destructive" });
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl animate-in slide-in-from-bottom-4 duration-500">
      <Card className="shadow-lg border-none bg-card/50 backdrop-blur-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
            <PlusCircle className="text-primary w-6 h-6" />
            {activeTab === "regular" ? "Add New Expense" : "Setup Recurring Bill"}
          </CardTitle>
          <CardDescription>
            Keep track of your spending by logging details below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="regular" className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> Regular
              </TabsTrigger>
              <TabsTrigger value="recurring" className="flex items-center gap-2">
                <Clock className="w-4 h-4" /> Recurring
              </TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="amount" className="flex items-center gap-2">
                    <Tag className="w-4 h-4" /> Amount
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground font-semibold">₹</span>
                    <Input
                      id="amount"
                      name="amount"
                      type="number"
                      placeholder="0.00"
                      value={form.amount}
                      onChange={handleChange}
                      className="pl-8 text-lg font-medium"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Tag className="w-4 h-4" /> Category
                  </Label>
                  <Select value={form.category} onValueChange={(v) => handleSelectChange("category", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {["Food", "Travel", "Shopping", "Bills", "Health", "Other"].map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Date
                  </Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    value={form.date}
                    onChange={handleChange}
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" /> Payment Mode
                  </Label>
                  <Select value={form.paymentMode} onValueChange={(v) => handleSelectChange("paymentMode", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select mode" />
                    </SelectTrigger>
                    <SelectContent>
                      {["Cash", "UPI", "Card", "Netbanking", "Other"].map(mode => (
                        <SelectItem key={mode} value={mode}>{mode}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Description
                </Label>
                <Input
                  id="description"
                  name="description"
                  placeholder="What was this for?"
                  value={form.description}
                  onChange={handleChange}
                />
              </div>

              {activeTab === "recurring" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-muted/30 rounded-lg border border-dashed animate-in fade-in duration-300">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Clock className="w-4 h-4" /> Recurrence
                    </Label>
                    <Select value={form.recurrenceType} onValueChange={(v) => handleSelectChange("recurrenceType", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Recurrence" />
                      </SelectTrigger>
                      <SelectContent>
                        {["daily", "weekly", "monthly", "yearly"].map(type => (
                          <SelectItem key={type} value={type} className="capitalize">{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate" className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> End Date (Optional)
                    </Label>
                    <Input
                      id="endDate"
                      name="endDate"
                      type="date"
                      value={form.endDate}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full text-lg h-12 shadow-md hover:shadow-lg transition-all" disabled={loading}>
                {loading ? "Processing..." : activeTab === "regular" ? "Add Expense" : "Enable Recurring Payment"}
              </Button>
            </form>
          </Tabs>
        </CardContent>
      </Card>

      {activeTab === "recurring" && recurringExpenses.length > 0 && (
        <div className="mt-8 space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Clock className="text-primary w-5 h-5" /> Your Recurring Expenses
            </h3>
            <Button variant="outline" size="sm" onClick={processDueExpenses} className="gap-2">
              <PlayCircle className="w-4 h-4" /> Process Due
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {recurringExpenses.map((expense) => (
              <Card key={expense._id} className={`overflow-hidden border-l-4 group ${expense.isActive ? 'border-l-primary' : 'border-l-muted-foreground/30 opacity-60'}`}>
                <CardContent className="p-4 flex justify-between items-center bg-card hover:bg-muted/50 transition-colors">
                  <div className="space-y-1">
                    <p className="font-semibold text-lg">{expense.description || expense.category}</p>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1 font-bold text-primary">₹{expense.amount}</span>
                      <span className="px-2 py-0.5 rounded-full bg-secondary text-xs capitalize">{expense.recurrenceType}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${expense.isActive ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-500'}`}>
                        {expense.isActive ? "Active" : "Paused"}
                      </span>
                    </div>
                    {expense.nextOccurrence && expense.isActive && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Next: {new Date(expense.nextOccurrence).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => toggleRecurring(expense._id, expense.isActive)}
                      className={expense.isActive ? "text-yellow-600 border-yellow-200" : "text-green-600 border-green-200"}
                    >
                      {expense.isActive ? <PauseCircle className="w-5 h-5" /> : <PlayCircle className="w-5 h-5" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => deleteRecurring(expense._id)}
                      className="text-destructive border-destructive/20 hover:bg-destructive/10"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AddExpenseForm;
