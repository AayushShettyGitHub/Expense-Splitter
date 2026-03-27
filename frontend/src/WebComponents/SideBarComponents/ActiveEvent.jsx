import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Target, Activity, ChevronRight, Info, Wallet, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const ActiveEvent = ({ onTargetSelect }) => {
  const [events, setEvents] = useState([]);
  const [targetEvent, setTargetEvent] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchActiveEvents = async () => {
      try {
        const res = await api.get("/user/active-events");
        setEvents(res.data);
        const savedTarget = localStorage.getItem("targetEvent");
        if (savedTarget) setTargetEvent(savedTarget);
      } catch (err) {
        console.error("Error fetching active events:", err);
      }
    };
    fetchActiveEvents();
  }, []);

  const handleSelectTarget = async (event) => {
    try {
      const res = await api.patch(`/target/${event._id}`, {});
      const newTarget = res.data.targetEvent || null;
      setTargetEvent(newTarget);
      if (newTarget) {
        localStorage.setItem("targetEvent", newTarget);
        toast({ title: `Focused on ${event.name}` });
      } else {
        localStorage.removeItem("targetEvent");
      }
      if (onTargetSelect) onTargetSelect(event);
    } catch (err) {
      toast({ title: "Update failed", description: "Failed to set focused trip" });
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-card/30 p-8 rounded-3xl backdrop-blur-md border border-border/50 shadow-xl overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
           <Activity size={120} className="text-primary rotate-12" />
        </div>
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Globe size={24} />
             </div>
             <h1 className="text-3xl font-black tracking-tight uppercase italic">Active Trips</h1>
          </div>
          <p className="text-muted-foreground font-medium">Your ongoing adventures and shared expense circles.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
        {events.length > 0 ? (
          events.map((event) => {
            const isTarget = targetEvent === event._id;
            return (
              <Card
                key={event._id}
                onClick={() => handleSelectTarget(event)}
                className={`group cursor-pointer border-none transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] relative overflow-hidden ${
                  isTarget ? "bg-primary text-primary-foreground shadow-2xl shadow-primary/20 ring-4 ring-primary/20" : "bg-card/50 backdrop-blur-sm shadow-md"
                }`}
              >
                <div className={`absolute top-0 left-0 w-1.5 h-full ${isTarget ? "bg-primary-foreground/50" : "bg-primary/40"} group-hover:bg-primary transition-colors`} />
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className={`p-3 rounded-2xl ${isTarget ? "bg-primary-foreground/20" : "bg-primary/10 text-primary"} transition-colors`}>
                      <Wallet size={24} />
                    </div>
                    {isTarget && (
                       <Badge variant="secondary" className="bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground border-none font-black tracking-widest text-[10px]">
                         CURRENT FOCUS
                       </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <CardTitle className={`text-2xl font-bold line-clamp-1 italic ${isTarget ? "text-primary-foreground" : ""}`}>
                      {event.name}
                    </CardTitle>
                    <CardDescription className={`${isTarget ? "text-primary-foreground/80" : "text-muted-foreground"} font-medium mt-1`}>
                      Group: {event.group?.name}
                    </CardDescription>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-primary-foreground/10">
                     <span className={`text-xs font-bold uppercase tracking-widest ${isTarget ? "text-primary-foreground/70" : "text-primary"}`}>View Details</span>
                     <ChevronRight className={`transition-transform duration-300 group-hover:translate-x-1 ${isTarget ? "text-primary-foreground" : "text-primary"}`} size={20} />
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full py-20 px-6 rounded-3xl border-2 border-dashed border-primary/20 bg-muted/5 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
               <Info className="text-muted-foreground/30" size={32} />
            </div>
            <div className="max-w-xs">
              <h3 className="text-lg font-bold">Everything is quiet</h3>
              <p className="text-sm text-muted-foreground">You don't have any trips marked as active right now. Head to a group to set one.</p>
            </div>
          </div>
        )}
      </div>

      {targetEvent && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-8 duration-500">
           <Card className="bg-primary/90 text-primary-foreground backdrop-blur-xl border-none shadow-2xl px-6 py-4 flex items-center gap-6 rounded-2xl min-w-[300px]">
              <div className="w-10 h-10 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
                 <Target className="text-primary-foreground" size={24} />
              </div>
              <div className="flex-1">
                 <p className="text-[10px] font-black uppercase tracking-[2px] text-primary-foreground/60 leading-none mb-1">Active Focus</p>
                 <p className="text-lg font-bold leading-tight truncate max-w-[200px]">
                    {events.find((e) => e._id === targetEvent)?.name || "Trip"}
                 </p>
              </div>
              <div className="h-8 w-[1px] bg-primary-foreground/10" />
              <Activity className="text-primary-foreground/40 animate-pulse" size={20} />
           </Card>
        </div>
      )}
    </div>
  );
};

export default ActiveEvent;
