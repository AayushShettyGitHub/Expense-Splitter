// Sidebar.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useToast } from "@/components/use-toast";

const ActiveEvent = ({ onTargetSelect }) => {
  const [events, setEvents] = useState([]);
  const [targetEvent, setTargetEvent] = useState(null);
  const { toast } = useToast();


  useEffect(() => {
    const fetchActiveEvents = async () => {
      try {
        const res = await axios.get(
          "https://split-backend-02lh.onrender.com/api/user/active-events",
          { withCredentials: true }
        );
        setEvents(res.data);

        const savedTarget = localStorage.getItem("targetEvent");
        if (savedTarget) {
          setTargetEvent(savedTarget);
        }
      } catch (err) {
        console.error("Error fetching active events:", err);
      }
    };
    fetchActiveEvents();
  }, []);


  const handleSelectTarget = async (event) => {
    try {
      const res = await axios.patch(
        `https://split-backend-02lh.onrender.com/api/target/${event._id}`,
        {},
        { withCredentials: true }
      );
      console.log("Target event response:", res.data);

      const newTarget = res.data.targetEvent || null;
      setTargetEvent(newTarget);
      if (newTarget) {
        localStorage.setItem("targetEvent", newTarget);
      } else {
        localStorage.removeItem("targetEvent");
      }

      if (onTargetSelect) {
        onTargetSelect(event);
      }
    } catch (err) {
      console.error("Error setting target event:", err);
    }
  };

  return (
    <aside className="w-64 bg-gray-900 text-white h-screen p-4 flex flex-col">
      <h2 className="text-lg font-semibold mb-4 border-b border-gray-700 pb-2">
        Active Events
      </h2>
      <div className="flex-1 overflow-y-auto space-y-2">
        {events.length > 0 ? (
          events.map((event) => (
            <div
              key={event._id}
              onClick={() => handleSelectTarget(event)}
              className={`p-3 rounded-lg cursor-pointer transition ${
                targetEvent === event._id
                  ? "bg-blue-600"
                  : "bg-gray-800 hover:bg-gray-700"
              }`}
            >
              <p className="font-medium">{event.name}</p>
              <p className="text-sm text-gray-400">{event.group?.name}</p>
            </div>
          ))
        ) : (
          <p className="text-gray-400 text-sm">No active events</p>
        )}
      </div>
      {targetEvent && (
        <div className="mt-4 p-2 bg-gray-800 rounded-md text-sm">
          Target:{" "}
          <span className="font-semibold">
            {events.find((e) => e._id === targetEvent)?.name || "Unknown"}
          </span>
        </div>
      )}
    </aside>
  );
};

export default ActiveEvent;
