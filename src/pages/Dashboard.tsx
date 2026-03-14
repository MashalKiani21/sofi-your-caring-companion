import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Activity, AlertTriangle, Bell, CheckCircle, Clock, User, Shield } from "lucide-react";
import type { ActivityEvent, Reminder, EmergencyContact } from "@/types/sofi";

const mockActivities: ActivityEvent[] = [
  { id: "1", type: "command", description: "Set reminder: Take medicine at 8 PM", timestamp: new Date(Date.now() - 1800000), status: "completed" },
  { id: "2", type: "reminder", description: "Medicine reminder triggered", timestamp: new Date(Date.now() - 3600000), status: "completed" },
  { id: "3", type: "check-in", description: "Inactivity check-in — responded OK", timestamp: new Date(Date.now() - 7200000), status: "completed" },
  { id: "4", type: "command", description: "Asked about weather", timestamp: new Date(Date.now() - 10800000), status: "completed" },
  { id: "5", type: "reminder", description: "Morning prayer reminder", timestamp: new Date(Date.now() - 14400000), status: "missed" },
];

const mockReminders: Reminder[] = [
  { id: "1", title: "Take medicine", titleUrdu: "دوا لیں", time: "8:00 PM", recurring: "daily", completed: false },
  { id: "2", title: "Morning walk", titleUrdu: "صبح کی سیر", time: "7:00 AM", recurring: "daily", completed: true },
  { id: "3", title: "Doctor appointment", titleUrdu: "ڈاکٹر کی ملاقات", time: "Tomorrow 3:00 PM", recurring: "once", completed: false },
];

const mockContacts: EmergencyContact[] = [
  { id: "1", name: "Ahmed (Son)", phone: "+92 300 1234567", relationship: "Son" },
  { id: "2", name: "Dr. Fatima", phone: "+92 321 7654321", relationship: "Doctor" },
  { id: "3", name: "Neighbor - Khalid", phone: "+92 333 9876543", relationship: "Neighbor" },
];

const statusColors: Record<string, string> = {
  completed: "text-success",
  pending: "text-primary",
  missed: "text-emergency",
  active: "text-primary",
};

const statusIcons: Record<string, typeof CheckCircle> = {
  completed: CheckCircle,
  pending: Clock,
  missed: AlertTriangle,
  active: Activity,
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [systemStatus] = useState<"normal" | "alert">("normal");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="min-h-touch min-w-touch flex items-center justify-center rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            aria-label="Back to SOFI"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Caregiver Dashboard</h1>
            <p className="text-sm text-muted-foreground">Monitoring: Amina · Last active 2 min ago</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${systemStatus === "normal" ? "bg-success" : "bg-emergency animate-pulse"}`} />
          <span className="text-sm font-medium text-muted-foreground capitalize">{systemStatus}</span>
        </div>
      </header>

      {/* 3-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 lg:gap-0 min-h-[calc(100vh-73px)]">
        {/* Left: Navigation / Reminders */}
        <div className="border-b lg:border-b-0 lg:border-r border-border p-6 space-y-6">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
              <Bell className="w-4 h-4" /> Active Reminders
            </h2>
            <div className="space-y-3">
              {mockReminders.map((r) => (
                <div
                  key={r.id}
                  className={`p-4 rounded-2xl shadow-card bg-card ${r.completed ? "opacity-50" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-card-foreground">{r.title}</p>
                      <p className="text-sm font-urdu text-muted-foreground" dir="rtl">{r.titleUrdu}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">{r.time}</p>
                      <p className="text-xs text-muted-foreground capitalize">{r.recurring}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4" /> Emergency Contacts
            </h2>
            <div className="space-y-3">
              {mockContacts.map((c) => (
                <div key={c.id} className="p-4 rounded-2xl shadow-card bg-card flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-card-foreground">{c.name}</p>
                    <p className="text-sm text-muted-foreground">{c.phone}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center: Activity Timeline */}
        <div className="border-b lg:border-b-0 lg:border-r border-border p-6">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4" /> Activity Timeline
          </h2>
          <div className="space-y-1">
            {mockActivities.map((event) => {
              const StatusIcon = statusIcons[event.status] || CheckCircle;
              return (
                <div key={event.id} className="flex items-start gap-4 p-4 rounded-2xl hover:bg-secondary/50 transition-colors">
                  <div className={`mt-0.5 ${statusColors[event.status]}`}>
                    <StatusIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{event.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {event.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <span className={`text-xs font-medium capitalize ${statusColors[event.status]}`}>
                    {event.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Health / Status */}
        <div className="p-6 space-y-6">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Health & Safety
          </h2>

          {/* Status cards */}
          <div className="space-y-4">
            <div className="p-5 rounded-2xl shadow-card bg-card">
              <p className="text-sm font-semibold text-muted-foreground mb-1">System Status</p>
              <p className="text-2xl font-bold text-success">All Normal</p>
              <p className="text-sm font-urdu text-muted-foreground mt-1" dir="rtl">سب ٹھیک ہے</p>
            </div>

            <div className="p-5 rounded-2xl shadow-card bg-card">
              <p className="text-sm font-semibold text-muted-foreground mb-1">Last Check-in</p>
              <p className="text-2xl font-bold text-foreground">2 min ago</p>
              <p className="text-sm text-muted-foreground mt-1">Responded to inactivity check</p>
            </div>

            <div className="p-5 rounded-2xl shadow-card bg-card">
              <p className="text-sm font-semibold text-muted-foreground mb-1">Today's Activity</p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-3xl font-bold text-foreground">12</p>
                <p className="text-sm text-muted-foreground">commands</p>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-3xl font-bold text-foreground">3/4</p>
                <p className="text-sm text-muted-foreground">reminders completed</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl shadow-card bg-card">
              <p className="text-sm font-semibold text-muted-foreground mb-1">Medical Info</p>
              <div className="space-y-2 mt-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Conditions</span>
                  <span className="font-medium text-foreground">Diabetes Type 2</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Allergies</span>
                  <span className="font-medium text-foreground">Penicillin</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Medications</span>
                  <span className="font-medium text-foreground">Metformin 500mg</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
