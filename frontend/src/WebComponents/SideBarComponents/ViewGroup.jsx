import { useEffect, useState, useMemo } from "react";
import api from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useSelectedGroup } from "@/context/SelectedGroupContext";
import { 
  ArrowLeft, Users, Plus, List, CreditCard, CheckCircle2, 
  Trash2, UserPlus, Shield, Wallet, History, Send 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const useCurrentUser = () => {
  const [user, setUser] = useState(null);
  useEffect(() => {
    api
      .get("/getUser")
      .then((res) => setUser(res.data))
      .catch(console.error);
  }, []);
  return user;
};

const SelectedTripView = ({ trip, user, group, onBack, memberById }) => {
  const { toast } = useToast();
  const [tripExpenses, setTripExpenses] = useState([]);
  const [tripBalances, setTripBalances] = useState({});
  const [settlementCycles, setSettlementCycles] = useState([]);
  const [expenseDesc, setExpenseDesc] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expensePaidBy, setExpensePaidBy] = useState("");
  const [expenseSplitWith, setExpenseSplitWith] = useState([]);
  const [loadingSettlement, setLoadingSettlement] = useState(false);
  const [historyFilter, setHistoryFilter] = useState("");

  const idOf = (v) => {
    if (!v) return null;
    if (typeof v === "object") return String(v._id || v);
    return String(v);
  };

  const filteredExpenses = (tripExpenses || [])
    .filter(exp => exp.description.toLowerCase().includes(historyFilter.toLowerCase()))
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

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
    if (trip?.members?.length > 0) {
      setExpensePaidBy(idOf(trip.members[0]));
      setExpenseSplitWith(trip.members.map(idOf));
    }
  }, [trip]);

  const fetchExpensesAndSettlements = async () => {
    try {
      const expRes = await api.get(`/event/${trip._id}/expenses`);
      setTripExpenses(expRes.data || []);
      calculateTripBalances(expRes.data || []);

      const setRes = await api.get(`/event/settlements/${trip._id}`);
      setSettlementCycles(setRes.data?.settlementCycles || []);
    } catch {
      setTripExpenses([]);
      setTripBalances({});
      setSettlementCycles([]);
    }
  };

  useEffect(() => {
    fetchExpensesAndSettlements();
  }, [trip]);

  const handleTripCheckboxChange = (id) => {
    setExpenseSplitWith((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const addExpense = async () => {
    const amountNum = parseFloat(expenseAmount);
    if (!expenseDesc || isNaN(amountNum) || amountNum <= 0 || !expensePaidBy || expenseSplitWith.length === 0) {
      toast({ title: "Incomplete details", description: "Please provide a description, positive amount, and select participants" });
      return;
    }
    try {
      await api.post(`/event/${trip._id}/expense`, {
        amount: amountNum,
        description: expenseDesc,
        paidBy: expensePaidBy,
        splitBetween: expenseSplitWith,
      });

      const updated = await api.get(`/event/${trip._id}/expenses`);
      setTripExpenses(updated.data || []);
      calculateTripBalances(updated.data || []);

      setExpenseDesc("");
      setExpenseAmount("");
      toast({ title: "Expense recorded successfully" });
    } catch (err) {
      toast({ title: "Submission failed", description: "Could not add expense. Check your connection or details." });
    }
  };

  const settleTripExpenses = async () => {
    setLoadingSettlement(true);
    try {
      await api.get(`/event/${trip._id}/settlements`);
      const res = await api.get(`/event/settlements/${trip._id}`);
      setSettlementCycles(res.data?.settlementCycles || []);
      toast({ title: "Settlement calculated" });
    } catch (err) {
      toast({ title: "Calculation failed", description: "Could not process settlements" });
    } finally {
      setLoadingSettlement(false);
    }
  };

  const [settlementFilter, setSettlementFilter] = useState("all");

  const unsettledCount = tripExpenses.filter(e => !e.settled).length;

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button onClick={onBack} variant="outline" size="icon" className="rounded-full shadow-sm">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">{trip.name}</h2>
            <p className="text-sm text-muted-foreground font-medium">{trip.members.length} members involved</p>
          </div>
        </div>
        {unsettledCount === 0 && settlementCycles.length > 0 && (
           <div className="px-3 py-1 rounded-full bg-green-500/10 text-green-600 text-[10px] font-bold border border-green-500/20 flex items-center gap-1">
             <CheckCircle2 className="w-3 h-3" /> UP TO DATE
           </div>
        )}
      </div>

      <Tabs defaultValue="addExpense" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6 h-12 bg-muted/50 p-1">
          <TabsTrigger value="addExpense" className="flex gap-2 font-bold data-[state=active]:bg-card data-[state=active]:shadow-sm"><Plus className="w-4 h-4" /> Add New</TabsTrigger>
          <TabsTrigger value="expenses" className="flex gap-2 font-bold data-[state=active]:bg-card data-[state=active]:shadow-sm"><History className="w-4 h-4" /> History</TabsTrigger>
          <TabsTrigger value="settlements" className="flex gap-2 font-bold data-[state=active]:bg-card data-[state=active]:shadow-sm"><Wallet className="w-4 h-4" /> Settle</TabsTrigger>
          <TabsTrigger value="members" className="flex gap-2 font-bold data-[state=active]:bg-card data-[state=active]:shadow-sm"><Users className="w-4 h-4" /> Team</TabsTrigger>
        </TabsList>

        <TabsContent value="addExpense">
          <Card className="border-none shadow-xl bg-card/60 backdrop-blur-sm overflow-hidden border-t-4 border-t-primary">
            <CardHeader>
              <CardTitle>Add New Expense</CardTitle>
              <CardDescription>Enter amount and select who paid and who shares it.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs uppercase font-bold tracking-widest opacity-70">Description</Label>
                  <Input
                    className="h-12 text-lg"
                    placeholder="E.g. Groceries, Movie, Dinner"
                    value={expenseDesc}
                    onChange={(e) => setExpenseDesc(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase font-bold tracking-widest opacity-70">Amount (₹)</Label>
                  <Input
                    className="h-12 text-2xl font-black text-primary"
                    placeholder="0.00"
                    type="number"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase font-bold tracking-widest opacity-70">Paid By</Label>
                  <Select value={expensePaidBy} onValueChange={setExpensePaidBy}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select Payer" />
                    </SelectTrigger>
                    <SelectContent>
                      {trip.members.map((m) => (
                        <SelectItem key={m._id} value={m._id}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center mb-2">
                    <Label className="text-xs uppercase font-bold tracking-widest opacity-70">Split With ({expenseSplitWith.length})</Label>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 text-[10px] font-bold px-2 uppercase hover:bg-primary/10"
                      onClick={() => {
                        if (expenseSplitWith.length === trip.members.length) {
                          setExpenseSplitWith([]);
                        } else {
                          setExpenseSplitWith(trip.members.map(m => m._id));
                        }
                      }}
                    >
                      {expenseSplitWith.length === trip.members.length ? "Deselect All" : "Select All"}
                    </Button>
                  </div>
                  <div className="p-4 rounded-xl border bg-background/50 max-h-48 overflow-y-auto grid grid-cols-1 gap-3 shadow-inner">
                    {trip.members.map((m) => (
                      <div key={m._id} className="flex items-center gap-3 hover:bg-muted/30 p-1 rounded-md transition-colors">
                        <Checkbox
                          id={`split-check-${m._id}`}
                          checked={expenseSplitWith.includes(m._id)}
                          onCheckedChange={() => handleTripCheckboxChange(m._id)}
                        />
                        <Label htmlFor={`split-check-${m._id}`} className="text-sm font-medium cursor-pointer flex-1">{m.name}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <Button onClick={addExpense} className="w-full h-14 text-xl font-bold rounded-xl shadow-lg shadow-primary/20">Add New Expense</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses">
          <div className="space-y-4">
            <div className="relative">
              <History className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search history..." 
                className="pl-10 h-10 bg-muted/20"
                value={historyFilter}
                onChange={(e) => setHistoryFilter(e.target.value)}
              />
            </div>
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredExpenses.length === 0 ? (
                <Card className="border-dashed h-40 flex flex-col items-center justify-center text-center p-6 bg-muted/5">
                  <History className="w-10 h-10 text-muted-foreground/30 mb-2" />
                  <p className="text-muted-foreground font-medium">No records found matching your search.</p>
                </Card>
              ) : (
                filteredExpenses.map((exp) => {
                  const getName = (idOrObj) =>
                     typeof idOrObj === "string"
                      ? trip.members.find((m) => m._id === idOrObj)?.name || memberById[idOrObj]?.name || "Unknown"
                      : idOrObj?.name || "Unknown";

                  const paidByName = getName(exp.paidBy);
                  const paidByUserId = idOf(exp.paidBy);
                  const canDelete = user?._id === paidByUserId || user?._id === group?.admin?._id;

                  return (
                    <Card key={exp._id} className={`border-none shadow-sm hover:translate-x-1 transition-transform bg-card/40 backdrop-blur-sm border-l-2 border-l-primary/30 ${exp.settled ? 'opacity-70' : ''}`}>
                      <CardContent className="p-4 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                           {canDelete && !exp.settled && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-destructive hover:bg-destructive/10 rounded-full h-8 w-8 p-0"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (!window.confirm("Delete this expense permanent record?")) return;
                                  try {
                                    await api.delete(`/event/${trip._id}/expense/${exp._id}`);
                                    const updated = await api.get(`/event/${trip._id}/expenses`);
                                    setTripExpenses(updated.data || []);
                                    calculateTripBalances(updated.data || []);
                                    toast({ title: "Record deleted" });
                                  } catch (err) {
                                    toast({ 
                                      title: "Deletion failed", 
                                      description: err.response?.data?.message || "Could not remove expense record",
                                      variant: "destructive" 
                                    });
                                  }
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                           )}
                           <div className="space-y-1">
                             <div className="flex items-center gap-2">
                               <p className="font-bold text-lg leading-none">{exp.description}</p>
                               {exp.settled && <Badge variant="secondary" className="text-[8px] h-4">SETTLED</Badge>}
                             </div>
                             <div className="flex items-center gap-2 text-xs text-muted-foreground">
                               <span className="bg-primary/5 px-1.5 py-0.5 rounded text-primary font-bold">Paid by {paidByName}</span>
                               <span>•</span>
                               <span>{exp.splitBetween?.length} shares</span>
                             </div>
                           </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black text-primary">₹{Number(exp.amount).toFixed(2)}</p>
                          <p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase">
                            {new Date(exp.createdAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="settlements">
          <Card className="border-none shadow-xl bg-card/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <div className="flex flex-col gap-1">
                   <span>Settlement Cycles</span>
                   <div className="flex gap-2">
                      <Button 
                         variant={settlementFilter === "all" ? "default" : "outline"} 
                         onClick={() => setSettlementFilter("all")} 
                         className="h-7 text-[10px] uppercase font-black"
                      >
                         Show All
                      </Button>
                      <Button 
                         variant={settlementFilter === "mine" ? "default" : "outline"} 
                         onClick={() => setSettlementFilter("mine")} 
                         className="h-7 text-[10px] uppercase font-black"
                      >
                         Involving Me
                      </Button>
                   </div>
                </div>
                {unsettledCount > 0 && user?._id === group?.admin?._id && (
                  <Button onClick={settleTripExpenses} disabled={loadingSettlement} size="sm" className="gap-2">
                    {loadingSettlement ? "Processing..." : <><CreditCard className="w-4 h-4" /> Calculate New Set ({unsettledCount})</>}
                  </Button>
                )}
              </CardTitle>
              <CardDescription>View current and past settlement transaction sets.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 max-h-[600px] overflow-y-auto">
              {settlementCycles.length === 0 ? (
                <div className="text-center py-12">
                   <CreditCard className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                   <p className="text-muted-foreground font-medium italic">No settlements calculated yet.</p>
                </div>
              ) : (
                settlementCycles.map((cycle, idx) => {
                  const cycleFiltered = (cycle.settlements || []).filter(s => 
                    settlementFilter === "all" || idOf(user) === idOf(s.from) || idOf(user) === idOf(s.to)
                  );

                  if (settlementFilter === "mine" && cycleFiltered.length === 0) return null;

                  return (
                    <div key={cycle._id} className="space-y-4">
                      <div className="flex items-center gap-3">
                         <div className="h-px flex-1 bg-border" />
                         <span className="text-[10px] font-black uppercase tracking-[3px] opacity-40">
                           {idx === 0 ? "Latest Set" : `Set from ${new Date(cycle.createdAt).toLocaleDateString()}`}
                         </span>
                         <div className="h-px flex-1 bg-border" />
                      </div>
                      
                      <div className="space-y-3">
                        {cycleFiltered.map((s) => (
                           <div key={s._id} className="flex items-center justify-between p-4 rounded-xl border bg-background/60 shadow-sm hover:border-primary/30 transition-colors">
                             <div className="flex items-center gap-4">
                               <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                                  <ArrowLeft className="w-5 h-5" />
                               </div>
                               <div className="text-sm">
                                 <p className="font-black text-red-500">{s.fromName}</p>
                                 <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">owes to</p>
                                 <p className="font-black text-green-500 mt-0.5">{s.toName}</p>
                               </div>
                             </div>
                             <div className="text-right flex items-center gap-6">
                               <div>
                                 <p className="text-2xl font-black">₹{Number(s.amount).toFixed(0)}</p>
                                 <p className={`text-[10px] font-black uppercase tracking-widest ${s.status === 'paid' ? 'text-green-500' : 'text-yellow-500'}`}>
                                   {s.status}
                                 </p>
                               </div>
                               {s.status !== "paid" && (idOf(user) === idOf(s.to) || idOf(user) === idOf(group?.admin)) && (
                                 <Button
                                   size="sm"
                                   className="bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/20"
                                   onClick={async () => {
                                     try {
                                       await api.patch(`/event/mark-paid/${trip._id}/${s._id}`, {});
                                       fetchExpensesAndSettlements(); 
                                       toast({ title: "Payment confirmed" });
                                     } catch (err) {
                                       toast({ title: "Update failed", description: "Failed to mark payment" });
                                     }
                                   }}
                                 >
                                   Received
                                 </Button>
                               )}
                               {s.status === 'paid' && <div className="p-1.5 rounded-full bg-green-500/10 text-green-600"><CheckCircle2 className="w-6 h-6" /></div>}
                             </div>
                           </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members">
           <Card className="border-none shadow-lg bg-card/60">
             <CardHeader>
               <CardTitle>Team Overview</CardTitle>
               <CardDescription>People involved in this trip/event.</CardDescription>
             </CardHeader>
             <CardContent className="grid gap-3">
               {trip.members.map((m) => (
                 <div key={m._id} className="flex items-center justify-between p-4 rounded-xl border bg-background/40">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-xl">
                          {m.name?.[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold">{m.name}</p>
                          <p className="text-xs text-muted-foreground italic">{m.email}</p>
                        </div>
                    </div>
                    {m._id === group?.admin?._id && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black tracking-widest border border-primary/20">
                        <Shield className="w-3 h-3" /> GROUP OWNER
                      </div>
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

const ViewGroup = () => {
  const user = useCurrentUser();
  const { selectedGroup, setSelectedGroup } = useSelectedGroup();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [group, setGroup] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [inviteEmail, setInviteEmail] = useState("");

  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(() => {
    const stored = localStorage.getItem("selectedTrip");
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    if (selectedTrip) localStorage.setItem("selectedTrip", JSON.stringify(selectedTrip));
    else localStorage.removeItem("selectedTrip");
  }, [selectedTrip]);
  const [tripName, setTripName] = useState("");
  const [tripMembersForCreate, setTripMembersForCreate] = useState([]);

  const [activeTrips, setActiveTrips] = useState([]);

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
        const gRes = await api.get(`/groups/${selectedGroup._id}`);
        setGroup(gRes.data);
        setSelectedGroup(gRes.data);
        setGroupMembers(gRes.data.members || []);

        const eRes = await api.get(`/group/${selectedGroup._id}/events`);
        const events = Array.isArray(eRes.data?.events) ? eRes.data.events : [];
        setTrips(events.map(normalizeEvent));

        const aRes = await api.get(`/groups/${selectedGroup._id}/events/active`);
        setActiveTrips(aRes.data.map((e) => e._id));
      } catch (err) {
        toast({ title: "Failed to load group details" });
      }
    };

    fetchAll();
  }, []);

  const toggleActiveTrip = async (tripId) => {
    try {
      if (activeTrips.includes(tripId)) {
        await api.delete(`/groups/${group._id}/events/${tripId}/active`);
        setActiveTrips((prev) => prev.filter((id) => id !== tripId));
        toast({ title: "Trip deactivated" });
      } else {
        await api.post(`/groups/${group._id}/events/${tripId}/active`, {});
        setActiveTrips((prev) => [...prev, tripId]);
        toast({ title: "Trip activated" });
      }
    } catch (err) {
      toast({ title: "Operation failed" });
    }
  };

  const handleKickMember = async (memberId) => {
    try {
      await api.post(`/kick/${group._id}/${memberId}`, {});
      const updated = await api.get(`/groups/${group._id}`);
      setGroup(updated.data);
      setGroupMembers(updated.data.members || []);
      toast({ title: "Member removed" });
    } catch (err) {
      toast({ title: "Could not remove member" });
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail) return;
    try {
      await api.post(`/send-invite/${group._id}`, { email: inviteEmail });
      const updated = await api.get(`/groups/${group._id}`);
      setGroup(updated.data);
      setGroupMembers(updated.data.members || []);
      setInviteEmail("");
      toast({ title: "Invitation sent" });
    } catch (err) {
      toast({ title: "Failed to send invitation", description: "User may not exist or is already invited" });
    }
  };

  const toggleTripMemberForCreate = (memberId) => {
    setTripMembersForCreate((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  const createTrip = async () => {
    if (!tripName || tripMembersForCreate.length === 0) {
      toast({ title: "Selection required", description: "Name and at least one member is needed" });
      return;
    }
    try {
      const res = await api.post(`/group/${group._id}/event`, { name: tripName, members: tripMembersForCreate });
      const createdRaw = res.data?.event;
      if (createdRaw) setTrips((prev) => [...prev, normalizeEvent(createdRaw)]);
      setTripName("");
      setTripMembersForCreate([]);
      toast({ title: "Trip created successfully" });
    } catch (err) {
      toast({ title: "Failed to create trip" });
    }
  };

  const selectTrip = (trip) => {
    setSelectedTrip(trip);
  };

  if (!group) return <div className="p-8 text-center animate-pulse italic">Connecting...</div>;

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
        {!selectedTrip && (
          <div className="flex justify-between items-start mb-8">
            <div className="space-y-2">
              <h1 className="text-4xl font-extrabold tracking-tight italic text-primary drop-shadow-sm">{group.name}</h1>
              <p className="text-muted-foreground flex items-center gap-2 font-medium">
                Admin: {group.admin?.name}
              </p>
            </div>
            <Button onClick={() => navigate("/viewgroup")} variant="outline" className="rounded-full gap-2 border-primary/20 hover:bg-primary/10 transition-all">
              <ArrowLeft className="w-4 h-4" /> Back to My Groups
            </Button>
          </div>
        )}

        {selectedTrip ? (
          <SelectedTripView
            key={selectedTrip._id}
            trip={selectedTrip}
            user={user}
            group={group}
            memberById={memberById}
            onBack={() => setSelectedTrip(null)}
          />
        ) : (
          <Tabs defaultValue="trips" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 h-12">
              <TabsTrigger value="trips" className="text-lg flex gap-2 h-full"><Wallet className="w-5 h-5" /> All Trips</TabsTrigger>
              <TabsTrigger value="groupMembers" className="text-lg flex gap-2 h-full"><Users className="w-5 h-5" /> Members</TabsTrigger>
            </TabsList>

            <TabsContent value="groupMembers" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="border-none shadow-md bg-card/60">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 px-1"><UserPlus className="text-primary" /> Invite People</CardTitle>
                    <CardDescription>Grow your circle and share the costs.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex gap-2 p-6 pt-0">
                    <Input 
                      className="h-11"
                      type="email" 
                      value={inviteEmail} 
                      onChange={(e) => setInviteEmail(e.target.value)} 
                      placeholder="friend@example.com" 
                    />
                    <Button onClick={handleInviteMember} size="icon" className="h-11 w-11 shrink-0"><Send className="w-5 h-5" /></Button>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-card/60">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 px-1"><Users className="text-primary" /> Current Members</CardTitle>
                    <CardDescription>{groupMembers.length} active participants.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 max-h-[300px] overflow-y-auto p-6 pt-0">
                    {groupMembers.map((m) => (
                      <div key={m._id} className="flex justify-between items-center p-3 rounded-xl bg-background/50 border">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold">
                            {m.name[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{m.name}</p>
                            <p className="text-[10px] text-muted-foreground">{m.email}</p>
                          </div>
                        </div>
                        {m._id === group.admin?._id ? (
                          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-600 text-[10px] font-bold border border-green-500/20">
                            <Shield className="w-3 h-3" /> ADMIN
                          </div>
                        ) : (
                          user?._id === group.admin?._id && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-destructive hover:bg-destructive/10 rounded-full"
                              onClick={() => handleKickMember(m._id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="trips" className="space-y-8">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {user?._id === group.admin?._id && (
                  <Card className="border-dashed border-2 flex flex-col items-center justify-center p-8 bg-card/20 hover:bg-card/40 transition-colors group cursor-pointer" onClick={() => document.getElementById('new-trip-input')?.focus()}>
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Plus className="text-primary" />
                    </div>
                    <CardHeader className="p-0 text-center">
                      <CardTitle className="text-xl">Create Trip</CardTitle>
                      <CardDescription>Start a new collection of expenses.</CardDescription>
                    </CardHeader>
                    <div className="mt-4 w-full px-4 space-y-4">
                      <Input
                        id="new-trip-input"
                        placeholder="Trip Name"
                        value={tripName}
                        onChange={(e) => setTripName(e.target.value)}
                        className="h-10 text-center font-semibold"
                      />
                      <div className="space-y-2">
                         <div className="flex justify-between items-end mb-1">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Select Members</p>
                            <Button 
                              variant="ghost" 
                              className="h-4 p-0 text-[10px] text-primary hover:bg-transparent"
                              onClick={() => {
                                if (tripMembersForCreate.length === groupMembers.length) {
                                  setTripMembersForCreate([]);
                                } else {
                                  setTripMembersForCreate(groupMembers.map(m => m._id));
                                }
                              }}
                            >
                              {tripMembersForCreate.length === groupMembers.length ? "Deselect All" : "Select All"}
                            </Button>
                         </div>
                         <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto border rounded p-2 bg-background/50">
                            {groupMembers.map((m) => (
                              <div key={m._id} className="flex items-center gap-3">
                                <Checkbox
                                  id={`new-trip-mem-${m._id}`}
                                  checked={tripMembersForCreate.includes(m._id)}
                                  onCheckedChange={() => toggleTripMemberForCreate(m._id)}
                                />
                                <Label htmlFor={`new-trip-mem-${m._id}`} className="text-xs">{m.name}</Label>
                              </div>
                            ))}
                         </div>
                      </div>
                      <Button onClick={createTrip} className="w-full">Create</Button>
                    </div>
                  </Card>
                )}

                {[...trips].sort((a, b) => {
                  const aActive = activeTrips.includes(a._id);
                  const bActive = activeTrips.includes(b._id);
                  if (aActive && !bActive) return -1;
                  if (!aActive && bActive) return 1;
                  return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
                }).map((t) => (
                  <Card 
                    key={t._id} 
                    className={`relative group cursor-pointer overflow-hidden border-none shadow-md transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${activeTrips.includes(t._id) ? 'bg-primary/5 ring-2 ring-primary/20' : 'bg-card/60'}`}
                    onClick={() => selectTrip(t)}
                  >
                    {activeTrips.includes(t._id) && (
                      <div className="absolute top-0 right-0 p-3">
                        <div className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">ACTIVE</div>
                      </div>
                    )}
                    {user?._id === group?.admin?._id && (
                       <Button
                         variant="ghost"
                         size="icon"
                         className="absolute top-10 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10 rounded-full"
                         onClick={async (e) => {
                            e.stopPropagation();
                            if (!window.confirm(`Permanently delete trip "${t.name}"?`)) return;
                            try {
                               await api.delete(`/group/${group._id}/event/${t._id}`);
                               setTrips(prev => prev.filter(item => item._id !== t._id));
                               toast({ title: "History deleted" });
                            } catch (err) {
                               toast({ title: "Deletion failed" });
                            }
                         }}
                       >
                         <Trash2 className="w-4 h-4" />
                       </Button>
                    )}
                    <CardHeader>
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-2 group-hover:scale-110 transition-transform">
                        <Wallet className="w-5 h-5" />
                      </div>
                      <CardTitle className="text-2xl font-bold group-hover:text-primary transition-colors">{t.name}</CardTitle>
                      <CardDescription>{t.members.length} participants</CardDescription>
                    </CardHeader>
                    <CardFooter className="pt-0 flex gap-2">
                       {user?._id === group.admin?._id && (
                          <Button 
                            className="w-full h-8 text-xs font-bold"
                            variant={activeTrips.includes(t._id) ? "secondary" : "outline"}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleActiveTrip(t._id);
                            }}
                          >
                            {activeTrips.includes(t._id) ? "Mark Inactive" : "Set Active"}
                          </Button>
                       )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
};

export default ViewGroup;
