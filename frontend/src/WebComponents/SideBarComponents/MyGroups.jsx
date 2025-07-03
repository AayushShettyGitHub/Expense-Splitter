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

const MyGroups = () => {
  const [groups, setGroups] = useState([]);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { setSelectedGroup } = useSelectedGroup();

  const fetchGroups = async () => {
    try {
      const res = await axios.get("http://localhost:3000/auth/my-groups", {
        withCredentials: true,
      });
      setGroups(res.data);
    } catch (err) {
      console.error("Failed to fetch groups", err);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleAccept = async (groupId) => {
    try {
      await axios.post(
        `http://localhost:3000/auth/accept-invite/${groupId}`,
        {},
        { withCredentials: true }
      );
      toast({ title: "Invite accepted!" });
      fetchGroups();
    } catch (err) {
      toast({ title: "Failed to accept invite", description: err.message });
    }
  };

  const handleGroupClick = (group) => {
    setSelectedGroup(group);
    navigate("/groupview");
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">My Groups</h1>
      {groups.length === 0 ? (
        <p className="text-muted-foreground">No groups to show.</p>
      ) : (
        groups.map((group) => {
          const isPending = group.isPendingInvite;

          return (
            <Card
              key={group._id}
              className="cursor-pointer hover:shadow-lg transition-all"
              onClick={() => !isPending && handleGroupClick(group)}
            >
              <CardHeader>
                <CardTitle>{group.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  <p>Admin: {group.admin?.name}</p>
                  <p>Members: {group.members.length}</p>
                </div>

                {isPending && (
                  <div className="mt-2">
                    <p className="text-yellow-600">You have been invited</p>
                    <Button
                      size="sm"
                      className="mt-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAccept(group._id);
                      }}
                    >
                      Accept Invite
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
};

export default MyGroups;
