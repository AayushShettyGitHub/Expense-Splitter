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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useSelectedGroup } from "@/context/SelectedGroupContext";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const useCurrentUser = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    axios
      .get("http://localhost:3000/auth/getUser", {
        withCredentials: true, 
      })
      .then((res) => {
        setUser(res.data);
      })
      .catch((err) => {
        console.error("Error fetching current user", err);
      });
  }, []);

  return user;
}



const ViewGroup = () => {
  const user = useCurrentUser();
  console.log("Current user:", user);
  const { selectedGroup: initialGroup, setSelectedGroup } = useSelectedGroup();
  const [group, setGroup] = useState(null);
  const [balances, setBalances] = useState({});
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [splitWith, setSplitWith] = useState([]);
  const [inviteEmail, setInviteEmail] = useState("");

  const { toast } = useToast();
  const navigate = useNavigate();

useEffect(() => {
  if (!initialGroup?._id) {
    navigate("/viewgroup");
    return;
  }

  const fetchGroupDetails = async () => {
    try {
      const res = await axios.get(
        `http://localhost:3000/auth/groups/${initialGroup._id}`,
        { withCredentials: true }
      );

      const groupData = res.data;
      console.log("Fetched group data:", groupData);
      setGroup(groupData);
      setSelectedGroup(groupData); 
      calculateBalances(groupData.expenses || []);
      setPaidBy(groupData.admin._id);
      setSplitWith(groupData.members.map((m) => m._id));
    } catch (err) {
      toast({
        title: "Error loading group",
        description: err.response?.data?.message || err.message,
      });
    }
  };

  fetchGroupDetails();
}, []); 


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

  const handleCheckboxChange = (id) => {
    setSplitWith((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const addExpense = async () => {
    if (!description || !amount || !paidBy || splitWith.length === 0) {
      toast({ title: "Please fill all fields" });
      return;
    }

    try {
      await axios.post(
        `http://localhost:3000/auth/group/${group._id}/expense`,
        {
          amount: parseFloat(amount),
          description,
          paidBy,
          splitBetween: splitWith,
        },
        { withCredentials: true }
      );

      const updated = await axios.get(
        `http://localhost:3000/auth/groups/${group._id}`,
        { withCredentials: true }
      );

      setGroup(updated.data);
      setSelectedGroup(updated.data);
      calculateBalances(updated.data.expenses || []);
      setAmount("");
      setDescription("");
      setSplitWith(updated.data.members.map((m) => m._id));
      toast({ title: "Expense added" });
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
      `http://localhost:3000/auth/kick/${group._id}/${memberId}`,
      {},
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


  const handleInvite = async () => {
    if (!inviteEmail) return;
    try {
      await axios.post(
        `http://localhost:3000/auth/send-invite/${group._id}`,
        { email: inviteEmail },
        { withCredentials: true }
      );

      const updatedGroup = await axios.get(
        `http://localhost:3000/auth/groups/${group._id}`,
        { withCredentials: true }
      );

      setGroup(updatedGroup.data);
      setSelectedGroup(updatedGroup.data);
      setInviteEmail("");
      toast({ title: "Invitation sent" });
    } catch (err) {
      toast({
        title: "Invite failed",
        description: err.response?.data?.message || err.message,
      });
    }
  };

  if (!group) return <p className="p-4">Loading...</p>;

  return (
    <div className="flex h-screen">
      {/* Main Area */}
      <main className="flex-1 p-6 overflow-y-auto w-full">
        <Tabs defaultValue="overview">
          <TabsList className="mb-4 flex flex-wrap">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="add">Add Expense</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="invite">Invite</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Balances</CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(balances).length === 0 ? (
                  <p>No balances yet.</p>
                ) : (
                  Object.entries(balances).map(([id, bal]) => {
                    const member = group.members.find((m) => m._id === id);
                    return (
                      <div key={id} className="text-sm">
                        {member?.name}:{" "}
                        <span className={bal >= 0 ? "text-green-600" : "text-red-600"}>
                          ₹{bal.toFixed(2)}
                        </span>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expenses">
  <Card>
    <CardHeader>
      <CardTitle>All Expenses</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4 max-h-96 overflow-y-auto">
      {group.expenses?.length > 0 ? (
        group.expenses.map((expense, idx) => (
          <div
            key={idx}
            className="p-3 border rounded-md bg-gray-50 shadow-sm text-sm"
          >
            <div className="font-medium text-purple-700">
              💸 {expense.paidBy?.name} paid ₹{expense.amount}
            </div>
            <div className="text-gray-700">
              📄 Description: {expense.description}
            </div>
            <div className="text-gray-700">
              👥 Split between:{" "}
              {expense.splitBetween?.map((m) => m.name).join(", ")}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              🕒 {new Date(expense.createdAt).toLocaleString()}
            </div>
          </div>
        ))
      ) : (
        <p className="text-gray-500">No expenses yet.</p>
      )}
    </CardContent>
  </Card>
</TabsContent>



          {/* Add Expense Tab */}
          <TabsContent value="add">
            <Card>
              <CardHeader>
                <CardTitle>Add Expense</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label>Description</Label>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter description"
                  />
                </div>
                <div>
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                  />
                </div>
                <div>
                  <Label>Paid By</Label>
                  <Select value={paidBy} onValueChange={setPaidBy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payer" />
                    </SelectTrigger>
                    <SelectContent>
                      {group.members.map((m) => (
                        <SelectItem key={m._id} value={m._id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Split Between</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {group.members.map((m) => (
                      <div key={m._id} className="flex items-center gap-2">
                        <Checkbox
                          checked={splitWith.includes(m._id)}
                          onCheckedChange={() => handleCheckboxChange(m._id)}
                        />
                        <span>{m.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <Button onClick={addExpense}>Add Expense</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="members">
  <Card>
    <CardHeader>
      <CardTitle>Group Members</CardTitle>
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
            ) : member._id === user?._id ? (
              <span className="text-xs text-blue-600">You</span>
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
</TabsContent>

          {/* Invite Tab */}
          <TabsContent value="invite">
            <Card>
              <CardHeader>
                <CardTitle>Invite Member</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="Enter email"
                  />
                </div>
                <Button onClick={handleInvite}>Send Invite</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ViewGroup;
