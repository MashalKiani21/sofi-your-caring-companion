import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft, Activity, Bell, ShieldAlert, User, CheckCircle, Clock,
  AlertTriangle, Heart, Send
} from "lucide-react";

const CaregiverPage = () => {
  const navigate = useNavigate();
  const { t } = useAccessibility();
  const { user } = useAuth();
  const [activities, setActivities] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    const [actRes, remRes, conRes] = await Promise.all([
      supabase.from("activity_logs").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(20),
      supabase.from("reminders").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(10),
      supabase.from("emergency_contacts").select("*").eq("user_id", user!.id).limit(5),
    ]);
    if (actRes.data) setActivities(actRes.data);
    if (remRes.data) setReminders(remRes.data);
    if (conRes.data) setContacts(conRes.data);
  };

  const statusIcon = (category: string) => {
    switch (category) {
      case "emergency": return <AlertTriangle className="w-5 h-5 text-emergency" />;
      case "reminder": return <Bell className="w-5 h-5 text-primary" />;
      case "health": return <Heart className="w-5 h-5 text-emergency" />;
      default: return <CheckCircle className="w-5 h-5 text-success" />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <button onClick={() => navigate("/home")} className="min-h-touch min-w-touch flex items-center justify-center rounded-xl hover:bg-secondary">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">{t("Caregiver Dashboard", "نگہداشت ڈیش بورڈ")}</h1>
          <p className="text-xs text-muted-foreground">{t("Monitor and assist", "نگرانی اور مدد")}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-success" />
          <span className="text-xs text-muted-foreground">{t("Online", "آن لائن")}</span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Activity Timeline */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            {t("Recent Activity", "حالیہ سرگرمی")}
          </h2>
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground p-4 bg-card rounded-2xl">{t("No activity recorded yet.", "ابھی کوئی سرگرمی نہیں۔")}</p>
          ) : (
            <div className="space-y-2">
              {activities.slice(0, 10).map((act) => (
                <div key={act.id} className="flex items-start gap-3 p-3 rounded-2xl bg-card border border-border">
                  {statusIcon(act.category)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{act.action}</p>
                    <p className="text-xs text-muted-foreground">{new Date(act.created_at).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Reminders */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <Bell className="w-4 h-4" />
            {t("Active Reminders", "فعال یاد دہانیاں")}
          </h2>
          {reminders.length === 0 ? (
            <p className="text-sm text-muted-foreground p-4 bg-card rounded-2xl">{t("No reminders set.", "کوئی یاد دہانی نہیں۔")}</p>
          ) : (
            <div className="space-y-2">
              {reminders.map((r) => (
                <div key={r.id} className={`p-4 rounded-2xl bg-card border border-border ${r.completed ? "opacity-50" : ""}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground text-sm">{r.title}</p>
                      {r.title_urdu && <p className="text-xs text-muted-foreground font-urdu" dir="rtl">{r.title_urdu}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-foreground">{r.reminder_time}</p>
                      <p className="text-xs text-muted-foreground capitalize">{r.recurring}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Emergency Contacts */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            {t("Emergency Contacts", "ایمرجنسی رابطے")}
          </h2>
          <div className="space-y-2">
            {contacts.map((c) => (
              <div key={c.id} className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.phone}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Send Voice Reminder (placeholder) */}
        <section>
          <button className="w-full min-h-touch rounded-2xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2">
            <Send className="w-5 h-5" />
            {t("Send Voice Reminder", "آواز یاد دہانی بھیجیں")}
            {/* TODO: Implement push notification or in-app voice reminder to user */}
          </button>
        </section>
      </div>
    </div>
  );
};

export default CaregiverPage;
