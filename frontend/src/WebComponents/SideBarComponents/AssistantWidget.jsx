import { useState, useEffect } from "react";
import { MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";

export default function AssistantWidget() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);


  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: user } = await api.get("/getUser");
        const saved = localStorage.getItem(`assistant-chat-${user._id}`);
        if (saved) {
          setMessages(JSON.parse(saved));
        }
      } catch (err) {
        console.error("Failed to fetch user for widget:", err);
      }
    };
    fetchUser();
  }, []);

  const handleClick = () => {
    navigate("/assistant");
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 group">
      <button
        onClick={handleClick}
        className="w-14 h-14 flex items-center justify-center bg-blue-600 text-white rounded-full shadow-lg hover:scale-110 transition-transform relative"
      >
        <MessageCircle size={28} />
      </button>

      {/* Tooltip */}
      <div className="absolute bottom-16 right-0 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded-md px-3 py-1 shadow-lg">
        Open Assistant
      </div>
    </div>
  );
}
