"use client";

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useSelectedGroup } from "@/context/SelectedGroupContext";
import axios from "axios";

const ViewGroup = () => {
  const { selectedGroup: group, setSelectedGroup } = useSelectedGroup();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!group) navigate("/viewgroup");
  }, [group]);

  const kickMember = async (memberId) => {
    try {
      await axios.post(
        `http://localhost:3000/auth/group/${group._id}/kick`,
        { memberId },
        { withCredentials: true }
      );
      toast({ title: "Member removed" });

      const res = await axios.get(`http://localhost:3000/auth/group/${group._id}`, {
        withCredentials: true,
      });
      setSelectedGroup(res.data);
    } catch (err) {
      toast({ title: "Kick failed", description: err.message });
    }
  };

  if (!group) return null;

  return (
    <div className="p-4">
      <Button variant="ghost" onClick={() => navigate("/viewgroup")}>
        ← Back to My Groups
      </Button>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-xl">{group.name}</CardTitle>
          <p className="text-muted-foreground text-sm">Admin: {group.admin?.name}</p>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="expenses" className="w-full">
            <TabsList className="flex gap-2">
              <TabsTrigger value="expenses">Expenses</TabsTrigger>
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="expenses">
              <p className="text-sm">Expense splitting feature coming soon...</p>
            </TabsContent>

            <TabsContent value="members">
              <ul className="space-y-2 mt-2">
                {group.members.map((member) => (
                  <li
                    key={member._id}
                    className="flex justify-between items-center border p-2 rounded"
                  >
                    <span>{member.name}</span>
                    {member._id !== group.admin?._id && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => kickMember(member._id)}
                      >
                        Kick
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            </TabsContent>

            <TabsContent value="settings">
              <p className="text-sm text-muted-foreground">Group settings coming soon...</p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ViewGroup;
