import React, { useEffect, useState } from "react";
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

const Invites = () => {
  const [invites, setInvites] = useState([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchInvites = async () => {
    try {
      const res = await axios.get("https://split-backend-drcy.onrender.com/api/my-groups", {
        withCredentials: true,
      });
      const pending = res.data.filter(group => group.isPendingInvite);
      setInvites(pending);
    } catch (err) {
      console.error("Failed to fetch invites", err);
    }
  };

  const handleAccept = async (groupId) => {
    try {
      await axios.post(
        `https://split-backend-drcy.onrender.com/api/accept-invite/${groupId}`,
        {},
        { withCredentials: true }
      );
      toast({ title: "Invite accepted!" });
      navigate("/viewgroup");
    } catch (err) {
      toast({ title: "Failed to accept invite", description: err.message });
    }
  };

  useEffect(() => {
    fetchInvites();
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Group Invites</h1>
      {invites.length === 0 ? (
        <p className="text-muted-foreground">No invites available.</p>
      ) : (
        invites.map((group) => (
          <Card key={group._id} className="hover:shadow-lg transition-all">
            <CardHeader>
              <CardTitle>{group.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Admin: {group.admin?.name}</p>
              <p>Members: {group.members.length}</p>
              <p className="text-yellow-600">You have been invited</p>
              <Button
                size="sm"
                className="mt-1"
                onClick={() => handleAccept(group._id)}
              >
                Accept Invite
              </Button>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};

export default Invites;
