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
import { useNavigate } from "react-router-dom";
import { useSelectedGroup } from "@/context/SelectedGroupContext";
import { useToast } from "@/hooks/use-toast";
import { Users, User, ArrowRight, Plus, LayoutGrid } from "lucide-react";

const MyGroups = () => {
  const [groups, setGroups] = useState([]);
  const navigate = useNavigate();
  const { setSelectedGroup } = useSelectedGroup();
  const { toast } = useToast();

  const fetchGroups = async () => {
    try {
      const res = await api.get("/my-groups");
      // Filter out groups that are pending invites from the "My Groups" list
      const actualGroups = res.data.filter(g => !g.isPendingInvite);
      setGroups(actualGroups);
    } catch (err) {
      console.error("Failed to fetch groups", err);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleGroupClick = (group) => {
    setSelectedGroup(group);
    navigate("/groupview");
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-card/30 p-6 rounded-2xl backdrop-blur-sm border border-border/50">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <LayoutGrid className="text-primary w-8 h-8" />
            My Groups
          </h1>
          <p className="text-muted-foreground">Manage your circles and shared expenses effortlessly.</p>
        </div>
        <Button onClick={() => navigate("/creategroup")} className="rounded-full px-6 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all flex gap-2">
          <Plus className="w-5 h-5" /> Create Group
        </Button>
      </div>

      {groups.length === 0 ? (
        <Card className="border-dashed h-80 flex flex-col items-center justify-center text-center p-12 bg-muted/5">
          <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
            <Users className="w-10 h-10 text-muted-foreground/50" />
          </div>
          <h3 className="text-2xl font-semibold mb-2">No groups yet</h3>
          <p className="text-muted-foreground max-w-xs mb-8">
            Create your first group to start splitting expenses with friends and family.
          </p>
          <Button onClick={() => navigate("/creategroup")} variant="outline">
            Get Started
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => (
            <Card
              key={group._id}
              className="group cursor-pointer border-none shadow-md bg-card/50 backdrop-blur-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 relative overflow-hidden"
              onClick={() => handleGroupClick(group)}
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-50 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary mb-3">
                    <Users className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-bold">
                    <User className="w-3 h-3" /> {group.members.length} Members
                  </div>
                </div>
                <CardTitle className="text-xl font-bold line-clamp-1">{group.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-medium">Admin:</span>
                  <span className="text-foreground font-semibold">{group.admin?.name}</span>
                  {group.admin?._id === localStorage.getItem("userId") && (
                    <span className="ml-auto text-[10px] uppercase tracking-wider font-extrabold bg-green-500/10 text-green-600 px-2 py-0.5 rounded border border-green-500/20">
                      You
                    </span>
                  )}
                </div>
              </CardContent>
              <CardFooter className="pt-0 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-primary text-sm font-bold flex items-center gap-1">
                  View Details <ArrowRight className="w-4 h-4" />
                </span>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyGroups;

