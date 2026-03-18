import React, { useEffect, useState } from "react";
import Layout from "@/WebComponents/Pages/Layout";
import Assistant from "@/WebComponents/SideBarComponents/Assistant";
import api from "@/lib/api";

const AssistantPage = () => {
  const [messages, setMessages] = useState([{ role: "assistant", content: "Hello! How can I help you?" }]);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Get the current user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: user } = await api.get("/getUser");
        setUserId(user._id);
        
        // 2. Load messages for THIS user
        const saved = localStorage.getItem(`assistant-chat-${user._id}`);
        if (saved) {
          setMessages(JSON.parse(saved));
        }
      } catch (err) {
        console.error("Failed to fetch user for assistant:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  // 3. Save messages when they change, but ONLY if we have a userId
  useEffect(() => {
    if (userId) {
      localStorage.setItem(`assistant-chat-${userId}`, JSON.stringify(messages));
    }
  }, [messages, userId]);

  return (
    <Layout pageTitle="Assistant">
      {!loading && <Assistant messages={messages} setMessages={setMessages} />}
      {loading && <div className="p-10 text-center">Loading your assistant...</div>}
    </Layout>
  );
};

export default AssistantPage;
