"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useSelectedGroup } from "@/context/SelectedGroupContext";
import { useToast } from "@/components/use-toast";

const MyGroups = () => {
  const [groups, setGroups] = useState([]);
  const navigate = useNavigate();
  const { setSelectedGroup } = useSelectedGroup();
  const { toast } = useToast();

  const fetchGroups = async () => {
    try {
      const res = await axios.get("https://split-backend-02lh.onrender.com/api/my-groups", {
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
        groups.map((group) => (
          <Card
            key={group._id}
            className="cursor-pointer hover:shadow-lg transition-all"
            onClick={() => handleGroupClick(group)}
          >
            <CardHeader>
              <CardTitle>{group.name}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>Admin: {group.admin?.name}</p>
              <p>Members: {group.members.length}</p>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};

export default MyGroups;
