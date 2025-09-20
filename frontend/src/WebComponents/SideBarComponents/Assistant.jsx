import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

const Assistant = () => {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello! How can I help you?" },
  ]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const chatRef = useRef(null);


  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const capitalize = (word) =>
    word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : "";

  const monthMap = {
    january: "January",
    february: "February",
    march: "March",
    april: "April",
    may: "May",
    june: "June",
    july: "July",
    august: "August",
    september: "September",
    october: "October",
    november: "November",
    december: "December",
  };

  const normalizeMonth = (month) => {
    if (!month) return null;
    const lower = month.toLowerCase();
    return monthMap[lower] || capitalize(month);
  };

  const getMonthNumber = (monthName) => {
    if (!monthName) return null;
    const lower = monthName.toLowerCase();
    const months = Object.keys(monthMap);
    return months.indexOf(lower) + 1;
  };

  const handleQuerySubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMessage = { role: "user", content: query };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const { data: intentResponse } = await axios.post(
        "https://split-backend-02lh.onrender.com/api/ask",
        { query },
        { withCredentials: true }
      );

      await handleIntent(intentResponse);
    } catch (error) {
      console.error("Error while fetching intent:", error);
      addAssistantMessage("Something went wrong. Please try again.");
    }

    setLoading(false);
    setQuery("");
  };

  const addAssistantMessage = (text) => {
    setMessages((prev) => [...prev, { role: "assistant", content: text }]);
  };

  const handleIntent = async ({ intent, data }) => {
    try {
      switch (intent) {
        case "get_expenses_by_month": {
          const month = normalizeMonth(data?.month);
          const year = parseInt(data?.year) || new Date().getFullYear();
          const category = data?.category?.toLowerCase() || "all";
          const monthNumber = getMonthNumber(month);

          if (!monthNumber || monthNumber < 1 || monthNumber > 12) {
            addAssistantMessage(
              "Month not recognized. Try something like 'Show expenses for July 2025'."
            );
            return;
          }

          navigate(
            `/view?intent=get_expenses&month=${monthNumber}&year=${year}&category=${category}`
          );
          return;
        }

        case "add_expense": {
          const { amount, category, description, paymentMode, date } = data;
          if (!amount || !category || !description) {
            toast({
              title: "Missing required fields like amount, category, or description.",
            });
            return;
          }

          const formattedDate =
            date === "today"
              ? new Date().toISOString().slice(0, 10)
              : date || new Date().toISOString().slice(0, 10);

          const expensePayload = {
            amount: parseFloat(amount),
            category: capitalize(category),
            description,
            paymentMode: paymentMode || "Cash",
            date: formattedDate,
          };

          try {
            await axios.post("https://split-backend-02lh.onrender.com/api/expenses", expensePayload, {
              withCredentials: true,
            });
            toast({ title: "Expense added successfully." });
            addAssistantMessage("Expense added successfully.");
          } catch (err) {
            console.error("Error adding expense:", err);
            toast({ title: "Failed to add expense.", variant: "destructive" });
            addAssistantMessage("Failed to add expense.");
          }
          return;
        }

        case "set_budget": {
          const { amount, month, year } = data;
          const normalizedMonth = normalizeMonth(month);
          const numericYear = parseInt(year);

          if (!normalizedMonth || !amount || !numericYear) {
            addAssistantMessage("Missing or invalid budget details.");
            toast({
              title: "Missing or invalid budget details.",
              variant: "destructive",
            });
            return;
          }

          try {
            let budgetExists = false;
            let budgetId = null;

            try {
              const res = await axios.get(
                `https://split-backend-02lh.onrender.com/api/get?month=${
                  new Date(`${normalizedMonth} 1`).getMonth() + 1
                }&year=${numericYear}`,
                { withCredentials: true }
              );
              budgetExists = true;
              budgetId = res.data._id;
            } catch (err) {
              if (err.response?.status !== 404) throw err;
            }

            if (budgetExists && budgetId) {
              await axios.put(
                `https://split-backend-02lh.onrender.com/api/update/${budgetId}`,
                { amount },
                { withCredentials: true }
              );
              addAssistantMessage(
                `Budget updated to ₹${amount} for ${normalizedMonth} ${numericYear}.`
              );
            } else {
              await axios.post(
                `https://split-backend-02lh.onrender.com/api/add`,
                {
                  amount,
                  month: new Date(`${normalizedMonth} 1`).getMonth() + 1,
                  year: numericYear,
                },
                { withCredentials: true }
              );
              addAssistantMessage(
                `Budget set to ₹${amount} for ${normalizedMonth} ${numericYear}.`
              );
            }
          } catch (err) {
            console.error("Error setting budget:", err);
            addAssistantMessage("Failed to set budget.");
            toast({ title: "Failed to set budget.", variant: "destructive" });
          }
          return;
        }

        case "create_group": {
          const { groupName, invitees } = data;
          if (!groupName || !invitees || invitees.length === 0) {
            addAssistantMessage(
              "Missing group details. Provide a group name and at least one member email."
            );
            toast({
              title: "Missing group details.",
              variant: "destructive",
            });
            return;
          }

          try {
            await axios.post(
              "https://split-backend-02lh.onrender.com/api/create",
              { name: groupName, invitees },
              { withCredentials: true }
            );
            addAssistantMessage(`Group "${groupName}" created with ${invitees.length} member(s).`);
            toast({ title: `Group "${groupName}" created successfully!` });
          } catch (err) {
            console.error("Error creating group:", err);
            addAssistantMessage("Failed to create group.");
            toast({ title: "Failed to create group.", variant: "destructive" });
          }
          return;
        }

        case "add_expense_to_event": {
          const { amount, description, date, paidBy: dataPaidBy, splitBetween: dataSplit } = data;
          if (!amount || !description) {
            toast({ title: "Missing fields: need amount and description." });
            return;
          }

          try {
            const { data: userRes } = await axios.get("https://split-backend-02lh.onrender.com/api/getUser", {
              withCredentials: true,
            });

            const eventId = userRes?.targetEvent;
            if (!eventId) {
              addAssistantMessage("No active trip/event set. Please set a target event first.");
              toast({ title: "No active trip set.", variant: "destructive" });
              return;
            }

            let paidBy = dataPaidBy;
            if (dataPaidBy === "current_user" || !dataPaidBy) {
              paidBy = userRes._id;
            }

            let splitBetween = dataSplit;
            if (dataSplit === "all_members" || !dataSplit) {
              const { data: eventRes } = await axios.get(
                `https://split-backend-02lh.onrender.com/api/event/${eventId}`,
                { withCredentials: true }
              );
              splitBetween = eventRes?.members || [];
            }

            if (!splitBetween || splitBetween.length === 0) {
              addAssistantMessage("No members found in this event to split the expense.");
              toast({ title: "No members in event.", variant: "destructive" });
              return;
            }

            const formattedDate =
              date === "today"
                ? new Date().toISOString().slice(0, 10)
                : date || new Date().toISOString().slice(0, 10);

            await axios.post(
              `https://split-backend-02lh.onrender.com/api/event/${eventId}/expense`,
              {
                description,
                amount: parseFloat(amount),
                paidBy,
                splitBetween,
                date: formattedDate,
              },
              { withCredentials: true }
            );

            addAssistantMessage(
              `Expense of ₹${amount} added and split among ${splitBetween.length} member(s).`
            );
            toast({ title: "Expense added to event." });
          } catch (err) {
            console.error("Error adding event expense:", err);
            addAssistantMessage("Failed to add expense to event.");
            toast({
              title: "Failed to add expense to event.",
              variant: "destructive",
            });
          }
          return;
        }

        default:
          addAssistantMessage("Sorry, I couldn't understand your request.");
          toast({ title: "Unknown command received.", variant: "destructive" });
          return;
      }
    } catch (err) {
      console.error("Intent handling error:", err);
      addAssistantMessage("Error handling your request.");
      toast({ title: "Unexpected error occurred.", variant: "destructive" });
    }
  };

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto h-[80vh] border rounded-xl shadow bg-background">
      <ScrollArea ref={chatRef} className="flex-1 p-4 space-y-3 overflow-y-auto">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`px-3 py-2 rounded-xl text-sm max-w-[75%] ${
                msg.role === "user"
                  ? "bg-blue-600 text-white rounded-br-none"
                  : "bg-muted text-foreground rounded-bl-none"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
      </ScrollArea>

      <form onSubmit={handleQuerySubmit} className="border-t p-3 flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask me something..."
          disabled={loading}
        />
        <Button type="submit" disabled={loading}>
          {loading ? "..." : "Send"}
        </Button>
      </form>
    </div>
  );
};

export default Assistant;
