"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useSelectedGroup } from "@/context/SelectedGroupContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ViewGroup = () => {
  const { selectedGroup: initialGroup, setSelectedGroup } = useSelectedGroup();
  const [group, setGroup] = useState(null);
  const [balances, setBalances] = useState({});
  const [amount, setAmount] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch full group details
  useEffect(() => {
    const fetchGroupDetails = async () => {
      try {
        if (!initialGroup?._id) {
          navigate("/viewgroup");
          return;
        }

        const res = await axios.get(
          `http://localhost:3000/auth/groups/${initialGroup._id}`,
          { withCredentials: true }
        );

        const groupData = res.data;
        setGroup(groupData);
        setSelectedGroup(groupData);
        calculateBalances(groupData.expenses || []);
      } catch (err) {
        console.error("Failed to fetch group", err);
        toast({
          title: "Error loading group",
          description: err.response?.data?.message || err.message,
        });
      }
    };

    fetchGroupDetails();
  }, [initialGroup]);

  const calculateBalances = (expenses) => {
    const bal = {};

    expenses.forEach((expense) => {
      const payerId = expense.paidBy?._id;
      const totalAmount = expense.amount;
      const share = totalAmount / (expense.sharedWith?.length || 1);

      expense.sharedWith?.forEach((member) => {
        const memberId = member._id;

        if (memberId === payerId) return;

        bal[payerId] = (bal[payerId] || 0) + share;
        bal[memberId] = (bal[memberId] || 0) - share;
      });
    });

    setBalances(bal);
  };

  const addExpense = async () => {
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      toast({ title: "Invalid amount" });
      return;
    }

    try {
      const res = await axios.post(
        `http://localhost:3000/auth/group/${group._id}/expense`,
        { amount: parseFloat(amount), description: "Manual expense", splitBetween: group.members.map(m => m._id), paidBy: group.admin._id },
        { withCredentials: true }
      );

      const updatedGroup = await axios.get(
        `http://localhost:3000/auth/groups/${group._id}`,
        { withCredentials: true }
      );

      setGroup(updatedGroup.data);
      setSelectedGroup(updatedGroup.data);
      calculateBalances(updatedGroup.data.expenses || []);
      setAmount("");
      toast({ title: "Expense added successfully" });
    } catch (err) {
      toast({
        title: "Failed to add expense",
        description: err.response?.data?.message || err.message,
      });
    }
  };

  const handleKick = async (memberId) => {
    try {
      await axios.post(
        `http://localhost:3000/auth/group/${group._id}/kick`,
        { memberId },
        { withCredentials: true }
      );

      const updatedGroup = await axios.get(
        `http://localhost:3000/auth/groups/${group._id}`,
        { withCredentials: true }
      );

      setGroup(updatedGroup.data);
      setSelectedGroup(updatedGroup.data);
      calculateBalances(updatedGroup.data.expenses || []);
      toast({ title: "Member removed" });
    } catch (err) {
      toast({
        title: "Failed to remove member",
        description: err.response?.data?.message || err.message,
      });
    }
  };

  if (!group) {
    return <p>Loading group data...</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{group.name}</h1>

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {group.members.map((member) => (
              <li
                key={member._id}
                className="flex items-center justify-between text-sm"
              >
                <span>{member.name}</span>
                {group.admin._id === member._id ? (
                  <span className="text-xs text-green-600">Admin</span>
                ) : (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleKick(member._id)}
                  >
                    Kick
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Add Expense */}
      <Card>
        <CardHeader>
          <CardTitle>Add Expense</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label>Amount</Label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
          />
          <Button onClick={addExpense}>Add Expense</Button>
        </CardContent>
      </Card>

      {/* Expenses List */}
      <Card>
        <CardHeader>
          <CardTitle>Expenses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {group.expenses?.length > 0 ? (
            group.expenses.map((expense, idx) => (
              <div key={idx} className="text-sm">
                {expense.paidBy?.name || "Someone"} paid ₹
                {expense.amount} shared with{" "}
                {expense.sharedWith?.map((m) => m.name).join(", ")}
              </div>
            ))
          ) : (
            <p className="text-muted-foreground">No expenses yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Balances */}
      <Card>
        <CardHeader>
          <CardTitle>Balances</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {Object.keys(balances).length === 0 ? (
            <p className="text-muted-foreground">No balances yet.</p>
          ) : (
            Object.entries(balances).map(([id, bal]) => {
              const member = group.members.find((m) => m._id === id);
              return (
                <div key={id} className="text-sm">
                  {member?.name}:{" "}
                  <span
                    className={bal >= 0 ? "text-green-600" : "text-red-600"}
                  >
                    ₹{bal.toFixed(2)}
                  </span>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ViewGroup;
