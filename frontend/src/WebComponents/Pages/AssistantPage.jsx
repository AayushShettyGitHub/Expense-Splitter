import React, { useEffect, useState } from "react";
import Layout from "@/WebComponents/Pages/Layout";
import Assistant from "@/WebComponents/SideBarComponents/Assistant";

const AssistantPage = () => {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem("assistant-chat");
    return saved ? JSON.parse(saved) : [{ role: "assistant", content: "Hello! How can I help you?" }];
  });

  useEffect(() => {
    localStorage.setItem("assistant-chat", JSON.stringify(messages));
  }, [messages]);

  return (
    <Layout pageTitle="Assistant">
      <Assistant messages={messages} setMessages={setMessages} />
    </Layout>
  );
};

export default AssistantPage;
