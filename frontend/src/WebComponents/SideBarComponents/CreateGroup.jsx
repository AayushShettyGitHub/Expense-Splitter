"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { Users, Mail, Plus, X, ArrowLeft, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CreateGroup = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [groupName, setGroupName] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [invitees, setInvitees] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleAddEmail = () => {
    const email = emailInput.trim();
    if (!email || invitees.includes(email)) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: "Invalid Email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }

    setInvitees([...invitees, email]);
    setEmailInput("");
  };

  const handleRemoveEmail = (email) => {
    setInvitees(invitees.filter((e) => e !== email));
  };

  const handleSubmit = async () => {
    if (!groupName || invitees.length === 0) {
      toast({ title: "Missing Details", description: "Enter a group name and at least one email to start.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      await api.post("/create", { name: groupName, invitees });
      toast({ title: "Group Created!", description: `${groupName} is ready for splitting.` });
      navigate("/viewgroup");
    } catch (error) {
      toast({ title: "Failed", description: error?.response?.data?.message || error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl animate-in fade-in slide-in-from-top-4 duration-500">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 gap-2 hover:bg-primary/5 group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back
      </Button>

      <Card className="border-none shadow-2xl bg-card/60 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 to-primary" />
        <CardHeader className="text-center pb-2">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mx-auto mb-4">
            <Users className="w-8 h-8" />
          </div>
          <CardTitle className="text-3xl font-extrabold tracking-tight">Create New Group</CardTitle>
          <CardDescription>Collaborate and manage expenses with friends, roommates, or family.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-8 p-8">
          <div className="space-y-2">
            <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Plus className="w-3 h-3" /> Group Identity
            </Label>
            <Input
              className="h-12 text-lg font-semibold bg-background/50 border-input shadow-sm focus:ring-2 ring-primary/20 transition-all"
              placeholder="e.g. Goa Trip 2024, Flat No. 402"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Mail className="w-3 h-3" /> Add Participants
              </Label>
              <div className="flex gap-2">
                <Input
                  className="h-12 bg-background/50"
                  placeholder="friend@email.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddEmail())}
                />
                <Button onClick={handleAddEmail} size="icon" className="h-12 w-12 shrink-0 shadow-md">
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <div className="min-h-[100px] p-4 rounded-xl border border-dashed border-border/60 bg-muted/20 flex flex-wrap gap-2 items-start content-start">
              {invitees.length === 0 ? (
                <p className="text-muted-foreground text-sm italic py-8 px-4 text-center w-full">
                  No invitees added yet. Enter emails above to build your group.
                </p>
              ) : (
                invitees.map((email, idx) => (
                  <div
                    key={idx}
                    className="bg-card shadow-sm border px-4 py-2 rounded-full text-xs font-bold flex items-center gap-3 animate-in zoom-in-95 duration-200"
                  >
                    <Mail className="w-3 h-3 text-primary" />
                    {email}
                    <button
                      onClick={() => handleRemoveEmail(email)}
                      className="hover:text-destructive transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <Button 
            disabled={loading} 
            onClick={handleSubmit} 
            className="w-full h-14 text-xl font-bold shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all rounded-xl"
          >
            {loading ? "Launching Group..." : "Initialize Group"}
          </Button>
        </CardContent>
      </Card>

      <p className="text-center mt-8 text-sm text-muted-foreground italic">
        "Great fences (and clear bills) make great neighbors."
      </p>
    </div>
  );
};

export default CreateGroup;

