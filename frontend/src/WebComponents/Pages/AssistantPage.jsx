import React, { useEffect, useState } from "react";
import Layout from "@/WebComponents/Pages/Layout";
import Assistant from "@/WebComponents/SideBarComponents/Assistant";

const AssistantPage = () => {
  const [messages, setMessages] = useState([]);

  // Load saved messages from localStorage when page mounts
  useEffect(() => {
    const saved = localStorage.getItem("assistant-chat");
    if (saved) {
      setMessages(JSON.parse(saved));
    }
  }, []);

  // Save messages whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("assistant-chat", JSON.stringify(messages));
    }
  }, [messages]);

  return (
    <Layout pageTitle="Assistant">
      <Assistant messages={messages} setMessages={setMessages} />
    </Layout>
  );
};

export default AssistantPage;
