"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

const CreateGroup = () => {
  const { toast } = useToast();

  const [groupName, setGroupName] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [invitees, setInvitees] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleAddEmail = () => {
    const email = emailInput.trim();
    if (!email || invitees.includes(email)) return;

    setInvitees([...invitees, email]);
    setEmailInput("");
  };

  const handleRemoveEmail = (email) => {
    setInvitees(invitees.filter((e) => e !== email));
  };

  const handleSubmit = async () => {
    if (!groupName || invitees.length === 0) {
      toast({ title: "Missing Details", description: "Enter a group name and at least one email.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        "https://split-backend-263e.onrender.com/api/create",
        { name: groupName, invitees },
        { withCredentials: true }
      );
      toast({ title: "Group created!", description: `${groupName} has been created successfully.` });

      setGroupName("");
      setInvitees([]);
    } catch (error) {
      toast({ title: "Failed to create group", description: error?.response?.data?.message || error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">👥 Create a Group</CardTitle>
          <p className="text-sm text-muted-foreground">Invite users by email to split expenses together.</p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div>
            <Label>Group Name</Label>
            <Input
              placeholder="e.g. Goa Trip"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>

          {/* Email Input */}
          <div>
            <Label>Invite by Email</Label>
            <div className="flex gap-2 mt-1">
              <Input
                placeholder="Enter user email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddEmail()}
              />
              <Button onClick={handleAddEmail}>Add</Button>
            </div>
          </div>

          {/* Show Invitees */}
          {invitees.length > 0 && (
            <div>
              <Label className="text-muted-foreground">Invited Users</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {invitees.map((email, idx) => (
                  <div
                    key={idx}
                    className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm flex items-center gap-2"
                  >
                    {email}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveEmail(email)}
                      className="h-4 w-4"
                    >
                      ✕
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submit */}
          <Button disabled={loading} onClick={handleSubmit} className="w-full">
            {loading ? "Creating..." : "Create Group"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateGroup;
