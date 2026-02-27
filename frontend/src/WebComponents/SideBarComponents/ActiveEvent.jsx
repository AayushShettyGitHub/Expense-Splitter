import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Target, Activity, ChevronRight, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const ActiveEvent = ({ onTargetSelect }) => {
  const [events, setEvents] = useState([]);
  const [targetEvent, setTargetEvent] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchActiveEvents = async () => {
      try {
        const res = await api.get(
          "/user/active-events"
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
      const res = await api.patch(
        `/target/${event._id}`,
        {}
      );

      const newTarget = res.data.targetEvent || null;
      setTargetEvent(newTarget);
      if (newTarget) {
        localStorage.setItem("targetEvent", newTarget);
        toast({ title: `Target set to ${event.name}` });
      } else {
        localStorage.removeItem("targetEvent");
      }

      if (onTargetSelect) {
        onTargetSelect(event);
      }
    } catch (err) {
      console.error("Error setting target event:", err);
      toast({ title: "Failed to set target", variant: "destructive" });
    }
  };

  return (
    <aside className="w-full h-full p-4 flex flex-col space-y-6">
      <div className="flex items-center gap-2 px-2">
        <Activity className="text-blue-500" size={24} />
        <h2 className="text-xl font-bold text-foreground">Active Trips</h2>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
        {events.length > 0 ? (
          events.map((event) => {
            const isTarget = targetEvent === event._id;
            return (
              <Card
                key={event._id}
                onClick={() => handleSelectTarget(event)}
                className={`group cursor-pointer border-none transition-all duration-300 hover:scale-[1.02] ${isTarget
                  ? "bg-blue-600 shadow-lg shadow-blue-500/20"
                  : "bg-muted/50 hover:bg-muted shadow-sm"
                  }`}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className={`font-semibold text-lg leading-tight ${isTarget ? "text-white" : "text-foreground"}`}>
                      {event.name}
                    </p>
                    <div className="flex items-center gap-1">
                      <p className={`text-sm ${isTarget ? "text-blue-100" : "text-muted-foreground"}`}>
                        {event.group?.name}
                      </p>
                      {isTarget && <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider">Target</span>}
                    </div>
                  </div>
                  <ChevronRight
                    className={`transition-transform duration-300 group-hover:translate-x-1 ${isTarget ? "text-white/70" : "text-muted-foreground/50"
                      }`}
                    size={20}
                  />
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-48 space-y-3 bg-muted/30 rounded-2xl border border-dashed text-muted-foreground">
            <Info size={32} />
            <p className="text-sm font-medium">No active trips yet</p>
          </div>
        )}
      </div>

      {targetEvent && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center gap-3 border border-blue-100 dark:border-blue-900/30">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
            <Target className="text-blue-600 dark:text-blue-400" size={18} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-blue-600 dark:text-blue-400">Current Target</p>
            <p className="text-sm font-semibold truncate text-foreground">
              {events.find((e) => e._id === targetEvent)?.name || "Analyzing..."}
            </p>
          </div>
        </div>
      )}
    </aside>
  );
};

export default ActiveEvent;
