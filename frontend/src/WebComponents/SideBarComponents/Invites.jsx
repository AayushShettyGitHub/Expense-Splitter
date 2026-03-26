import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { MailOpen, User, Check, Trash2, Users } from "lucide-react";

const Invites = () => {
  const [invites, setInvites] = useState([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchInvites = async () => {
    try {
      const res = await api.get("/my-groups");
      const pending = res.data.filter(group => group.isPendingInvite);
      setInvites(pending);
    } catch (err) {
      console.error("Failed to fetch invites", err);
    }
  };

  const handleAccept = async (groupId) => {
    try {
      await api.post(`/accept-invite/${groupId}`, {});
      toast({ title: "Welcome to the group!", description: "Invitation accepted successfully." });
      navigate("/groupview");
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  useEffect(() => {
    fetchInvites();
  }, []);

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-8 animate-in slide-in-from-right-4 duration-500">
      <div className="flex items-center gap-4 mb-4">
        <div className="p-3 rounded-2xl bg-primary/10 text-primary">
          <MailOpen className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Group Invites</h1>
          <p className="text-muted-foreground">Pending invitations to join expense splitting circles.</p>
        </div>
      </div>

      {invites.length === 0 ? (
        <Card className="border-dashed h-64 flex flex-col items-center justify-center text-center p-12 bg-muted/5">
          <p className="text-muted-foreground text-lg">You have no pending invitations at the moment.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {invites.map((group) => (
            <Card key={group._id} className="relative overflow-hidden border-none shadow-lg bg-card/60 backdrop-blur-sm group hover:scale-[1.01] transition-transform">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Users className="w-24 h-24 rotate-12" />
              </div>
              <CardHeader>
                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-2">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  New Invitation
                </div>
                <CardTitle className="text-2xl font-bold">{group.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Invited by:</span>
                    <span className="font-semibold">{group.admin?.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Members:</span>
                    <span className="font-semibold">{group.members.length}</span>
                  </div>
                </div>
                <p className="text-sm text-yellow-600/80 italic font-medium">"You've been invited to split expenses with this group."</p>
              </CardContent>
              <CardFooter className="flex gap-3 pt-4 border-t border-border/40">
                <Button
                  className="flex-1 gap-2 shadow-md shadow-primary/20"
                  onClick={() => handleAccept(group._id)}
                >
                  <Check className="w-4 h-4" /> Accept
                </Button>
                <Button
                  variant="outline"
                  className="gap-2 border-destructive/20 text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" /> Ignore
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Invites;

