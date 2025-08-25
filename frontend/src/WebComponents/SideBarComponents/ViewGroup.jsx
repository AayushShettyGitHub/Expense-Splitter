"use client";

import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useSelectedGroup } from "@/context/SelectedGroupContext";

const useCurrentUser = () => {
  const [user, setUser] = useState(null);
  useEffect(() => {
    axios
      .get("http://localhost:3000/auth/getUser", { withCredentials: true })
      .then((res) => setUser(res.data))
      .catch(console.error);
  }, []);
  return user;
};

// ---------------- SelectedTripView ----------------
const SelectedTripView = ({ trip, user, onBack, memberById }) => {
  const { toast } = useToast();
  const [tripExpenses, setTripExpenses] = useState([]);
  const [tripBalances, setTripBalances] = useState({});
  const [tripSettlements, setTripSettlements] = useState([]);
  const [tripSettled, setTripSettled] = useState(false);
  const [expenseDesc, setExpenseDesc] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expensePaidBy, setExpensePaidBy] = useState(trip.members[0]?._id || "");
  const [expenseSplitWith, setExpenseSplitWith] = useState(trip.members.map(m => m._id));
  const [loadingSettlement, setLoadingSettlement] = useState(false);

  const idOf = (userOrId) => (typeof userOrId === "string" ? userOrId : userOrId?._id);
  const nameOf = (idOrObj) =>
    typeof idOrObj === "string"
      ? trip.members.find((m) => m._id === idOrObj)?.name || memberById[idOrObj]?.name || "Unknown"
      : idOrObj?.name || "Unknown";

  const calculateTripBalances = (expenses) => {
    const bal = {};
    expenses.forEach((exp) => {
      const payerId = idOf(exp.paidBy);
      const split = Array.isArray(exp.splitBetween) ? exp.splitBetween : [];
      const splitIds = split.map(idOf);
      const share = exp.amount / (splitIds.length || 1);
      splitIds.forEach((memberId) => {
        if (memberId === payerId) return;
        bal[payerId] = (bal[payerId] || 0) + share;
        bal[memberId] = (bal[memberId] || 0) - share;
      });
    });
    setTripBalances(bal);
  };

  useEffect(() => {
    const fetchExpensesAndSettlements = async () => {
      try {
        const expRes = await axios.get(
          `http://localhost:3000/auth/event/${trip._id}/expenses`,
          { withCredentials: true }
        );
        setTripExpenses(expRes.data || []);
        calculateTripBalances(expRes.data || []);

        const setRes = await axios.get(
          `http://localhost:3000/auth/event/settlements/${trip._id}`,
          { withCredentials: true }
        );
        setTripSettlements(setRes.data?.settlements || []);
        setTripSettled(!!setRes.data?.settlementEnded);
      } catch {
        setTripExpenses([]);
        setTripBalances({});
        setTripSettlements([]);
        setTripSettled(false);
      }
    };
    fetchExpensesAndSettlements();
  }, [trip]);

  const handleTripCheckboxChange = (id) => {
    setExpenseSplitWith((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const addExpense = async () => {
    if (!expenseDesc || !expenseAmount || !expensePaidBy || expenseSplitWith.length === 0) {
      toast({ title: "All expense fields are required" });
      return;
    }
    try {
      await axios.post(
        `http://localhost:3000/auth/event/${trip._id}/expense`,
        {
          amount: parseFloat(expenseAmount),
          description: expenseDesc,
          paidBy: expensePaidBy,
          splitBetween: expenseSplitWith,
        },
        { withCredentials: true }
      );

      const updated = await axios.get(
        `http://localhost:3000/auth/event/${trip._id}/expenses`,
        { withCredentials: true }
      );
      setTripExpenses(updated.data || []);
      calculateTripBalances(updated.data || []);

      setExpenseDesc("");
      setExpenseAmount("");
      setExpensePaidBy(trip.members[0]?._id || "");
      setExpenseSplitWith(trip.members.map(m => m._id));
      toast({ title: "Expense added" });
    } catch (err) {
      toast({ title: "Failed to add expense", description: err.message });
    }
  };

  const settleTripExpenses = async () => {
    setLoadingSettlement(true);
    try {
      await axios.get(
        `http://localhost:3000/auth/event/${trip._id}/settlements`,
        { withCredentials: true }
      );
      const res = await axios.get(
        `http://localhost:3000/auth/event/settlements/${trip._id}`,
        { withCredentials: true }
      );
      setTripSettlements(res.data?.settlements || []);
      setTripSettled(!!res.data?.settlementEnded);
    } catch (err) {
      toast({ title: "Error settling expenses", description: err.message });
    } finally {
      setLoadingSettlement(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button onClick={onBack}>Back to Trips</Button>
      <h2 className="text-xl font-semibold">{trip.name}</h2>
      <Tabs defaultValue="members">
        <TabsList className="mb-4 flex gap-2">
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="addExpense">Add Expense</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="settlements">Settlements</TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>Members</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1 max-h-64 overflow-y-auto">
              {trip.members.map((m) => (
                <div key={m._id}>
                  {m.name} {m.email ? `(${m.email})` : ""}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="addExpense">
          <Card>
            <CardHeader>
              <CardTitle>Add Expense</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Input
                placeholder="Description"
                value={expenseDesc}
                onChange={(e) => setExpenseDesc(e.target.value)}
              />
              <Input
                placeholder="Amount"
                type="number"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
              />
              <Select value={expensePaidBy} onValueChange={setExpensePaidBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Paid By" />
                </SelectTrigger>
                <SelectContent>
                  {trip.members.map((m) => (
                    <SelectItem key={m._id} value={m._id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div>
                <Label>Split With</Label>
                <div className="flex flex-col max-h-32 overflow-y-auto">
                  {trip.members.map((m) => (
                    <div key={m._id} className="flex items-center gap-2">
                      <Checkbox
                        checked={expenseSplitWith.includes(m._id)}
                        onCheckedChange={() => handleTripCheckboxChange(m._id)}
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

        <TabsContent value="expenses">
          <Card className="max-h-64 overflow-y-auto">
            <CardHeader>
              <CardTitle>Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              {tripExpenses.length === 0 ? (
                <p className="text-sm text-muted-foreground">No expenses yet.</p>
              ) : (
                tripExpenses.map((exp) => (
                  <div key={exp._id} className="p-2 border rounded mb-2">
                    <div>
                      <strong>{nameOf(exp.paidBy)}</strong> paid ₹{exp.amount}
                    </div>
                    <div>{exp.description}</div>
                    <div>
                      Split: {(exp.splitBetween || []).map((m) => nameOf(m)).join(", ")}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settlements">
          <Card className="max-h-64 overflow-y-auto">
            <CardHeader>
              <CardTitle>Settlements</CardTitle>
            </CardHeader>
            <CardContent>
              {!tripSettled && tripSettlements.length === 0 && (
                <Button onClick={settleTripExpenses} disabled={loadingSettlement}>
                  {loadingSettlement ? "Processing..." : "Settle Expenses"}
                </Button>
              )}

              {tripSettlements.map((s) => (
                <div key={s._id} className="border p-2 mb-2 rounded flex justify-between items-center">
                  <div>
                    <span className="text-red-600">{s.fromName}</span> owes{" "}
                    <span className="text-green-600">{s.toName}</span> ₹{Number(s.amount).toFixed(2)}
                    <div className="text-xs text-gray-500">Status: {s.status || "pending"}</div>
                  </div>
                  {s.status !== "paid" && user?._id === s.to && (
                    <Button
                      size="sm"
                      onClick={async () => {
                        try {
                          const res = await axios.patch(
                            `http://localhost:3000/auth/mark-paid/${trip._id}/${s._id}`,
                            {},
                            { withCredentials: true }
                          );
                          toast({ title: res.data?.settlementEnded ? "All settled 🎉" : "Marked as paid ✅" });
                        } catch (err) {
                          toast({ title: "Failed to mark paid", description: err.message });
                        }
                      }}
                    >
                      Mark as Paid
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// ---------------- ViewGroup ----------------
const ViewGroup = () => {
  const user = useCurrentUser();
  const { selectedGroup, setSelectedGroup } = useSelectedGroup();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [group, setGroup] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [inviteEmail, setInviteEmail] = useState("");

  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [tripName, setTripName] = useState("");
  const [tripMembersForCreate, setTripMembersForCreate] = useState([]);

  const memberById = useMemo(
    () => Object.fromEntries((groupMembers || []).map((m) => [m._id, m])),
    [groupMembers]
  );

  const toMemberObj = (m) =>
    typeof m === "string" ? memberById[m] || { _id: m, name: "Unknown", email: "" } : m;

  const normalizeEvent = (evt) => ({
    ...evt,
    members: (evt.members || []).map(toMemberObj),
  });

  useEffect(() => {
    if (!selectedGroup?._id) {
      navigate("/viewgroup");
      return;
    }

    const fetchAll = async () => {
      try {
        const gRes = await axios.get(`http://localhost:3000/auth/groups/${selectedGroup._id}`, { withCredentials: true });
        setGroup(gRes.data);
        setSelectedGroup(gRes.data);
        setGroupMembers(gRes.data.members || []);

        const eRes = await axios.get(`http://localhost:3000/auth/group/${selectedGroup._id}/events`, { withCredentials: true });
        const events = Array.isArray(eRes.data?.events) ? eRes.data.events : [];
        setTrips(events.map(normalizeEvent));
      } catch (err) {
        toast({ title: "Error loading group data", description: err.message });
      }
    };

    fetchAll();
  }, []);

  const handleKickMember = async (memberId) => {
    try {
      await axios.post(`http://localhost:3000/auth/kick/${group._id}/${memberId}`, {}, { withCredentials: true });
      const updated = await axios.get(`http://localhost:3000/auth/groups/${group._id}`, { withCredentials: true });
      setGroup(updated.data);
      setGroupMembers(updated.data.members || []);
      toast({ title: "Member removed" });
    } catch (err) {
      toast({ title: "Failed to remove member", description: err.message });
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail) return;
    try {
      await axios.post(`http://localhost:3000/auth/send-invite/${group._id}`, { email: inviteEmail }, { withCredentials: true });
      const updated = await axios.get(`http://localhost:3000/auth/groups/${group._id}`, { withCredentials: true });
      setGroup(updated.data);
      setGroupMembers(updated.data.members || []);
      setInviteEmail("");
      toast({ title: "Invitation sent" });
    } catch (err) {
      toast({ title: "Invite failed", description: err.message });
    }
  };

  const toggleTripMemberForCreate = (memberId) => {
    setTripMembersForCreate((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  const createTrip = async () => {
    if (!tripName || tripMembersForCreate.length === 0) {
      toast({ title: "Trip name and members required" });
      return;
    }
    try {
      const res = await axios.post(
        `http://localhost:3000/auth/group/${group._id}/event`,
        { name: tripName, members: tripMembersForCreate },
        { withCredentials: true }
      );
      const createdRaw = res.data?.event;
      if (createdRaw) setTrips((prev) => [...prev, normalizeEvent(createdRaw)]);
      setTripName("");
      setTripMembersForCreate([]);
      toast({ title: "Trip created" });
    } catch (err) {
      toast({ title: "Error creating trip", description: err.message });
    }
  };

  const selectTrip = (trip) => {
    setSelectedTrip(trip);
  };

  if (!group) return <p className="p-4">Loading...</p>;

  return (
    <div className="flex h-screen">
      <main className="flex-1 p-6 overflow-y-auto w-full">
        <Tabs defaultValue="groupMembers">
          <TabsList className="mb-4 flex gap-2">
            <TabsTrigger value="groupMembers">Group Members</TabsTrigger>
            <TabsTrigger value="trips">Trips</TabsTrigger>
          </TabsList>

          {/* Group Members Tab */}
          <TabsContent value="groupMembers">
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Invite Member</CardTitle>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="Enter email" />
                <Button onClick={handleInviteMember}>Send Invite</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Members</CardTitle>
              </CardHeader>
              <CardContent>
                {groupMembers.map((m) => (
                  <div key={m._id} className="flex justify-between items-center mb-2">
                    <span>{m.name}</span>
                    {m._id === group.admin?._id ? (
                      <span className="text-green-600 text-xs">Admin</span>
                    ) : m._id === user?._id ? (
                      <span className="text-blue-600 text-xs">You</span>
                    ) : (
                      <Button size="sm" variant="destructive" onClick={() => handleKickMember(m._id)}>Kick</Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trips Tab */}
         <TabsContent value="trips">
  {selectedTrip ? (
    <SelectedTripView
      trip={selectedTrip}
      user={user}
      onBack={() => setSelectedTrip(null)}
      memberById={memberById}
    />
  ) : (
    <Tabs defaultValue="createTrip" className="space-y-4">
      <TabsList className="mb-2">
        <TabsTrigger value="createTrip">Create Trip</TabsTrigger>
        <TabsTrigger value="tripList">Trip List</TabsTrigger>
      </TabsList>

      {/* --- Create Trip --- */}
      <TabsContent value="createTrip">
        <Card>
          <CardHeader>
            <CardTitle>Create Trip</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Input
              placeholder="Trip Name"
              value={tripName}
              onChange={(e) => setTripName(e.target.value)}
            />
            <div>
              <Label>Select Members</Label>
              <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
                {groupMembers.map((m) => (
                  <div key={m._id} className="flex items-center gap-2">
                    <Checkbox
                      checked={tripMembersForCreate.includes(m._id)}
                      onCheckedChange={() => toggleTripMemberForCreate(m._id)}
                    />
                    <span>{m.name}</span>
                  </div>
                ))}
              </div>
            </div>
            <Button onClick={createTrip}>Create Trip</Button>
          </CardContent>
        </Card>
      </TabsContent>

      {/* --- Trip List --- */}
      <TabsContent value="tripList">
        {trips.length === 0 ? (
          <p className="text-sm text-muted-foreground">No trips yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trips.map((trip) => (
              <Card
                key={trip._id}
                className="cursor-pointer"
                onClick={() => selectTrip(trip)}
              >
                <CardHeader>
                  <CardTitle>{trip.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  Members: {trip.members.map((m) => m.name).join(", ")}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  )}
</TabsContent>

        </Tabs>
      </main>
    </div>
  );
};

export default ViewGroup;
