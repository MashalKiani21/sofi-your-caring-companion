import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { ArrowLeft, Plus, Clock, Trash2, Bell, Check } from "lucide-react";
import { motion } from "framer-motion";
import type { Reminder } from "@/types/app";

const mockReminders: Reminder[] = [
  { id: "1", user_id: "1", title: "Take medicine", title_urdu: "دوا لیں", time: "8:00 PM", recurring: "daily", completed: false, created_at: "" },
  { id: "2", user_id: "1", title: "Morning walk", title_urdu: "صبح کی سیر", time: "7:00 AM", recurring: "daily", completed: true, created_at: "" },
  { id: "3", user_id: "1", title: "Doctor appointment", title_urdu: "ڈاکٹر کی ملاقات", time: "3:00 PM", recurring: "once", completed: false, created_at: "" },
  { id: "4", user_id: "1", title: "Prayer time", title_urdu: "نماز کا وقت", time: "1:00 PM", recurring: "daily", completed: false, created_at: "" },
];

const RemindersPage = () => {
  const navigate = useNavigate();
  const { t, language } = useAccessibility();
  const [reminders, setReminders] = useState<Reminder[]>(mockReminders);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTime, setNewTime] = useState("");

  const toggleComplete = (id: string) => {
    setReminders(r => r.map(rem => rem.id === id ? { ...rem, completed: !rem.completed } : rem));
  };

  const deleteReminder = (id: string) => {
    setReminders(r => r.filter(rem => rem.id !== id));
  };

  const addReminder = () => {
    if (!newTitle || !newTime) return;
    const newR: Reminder = {
      id: Date.now().toString(),
      user_id: "1",
      title: newTitle,
      time: newTime,
      recurring: "once",
      completed: false,
      created_at: new Date().toISOString(),
    };
    setReminders([...reminders, newR]);
    setNewTitle("");
    setNewTime("");
    setShowAdd(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/companion")} className="min-h-touch min-w-touch flex items-center justify-center rounded-xl hover:bg-secondary">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">{t("Reminders", "یاد دہانیاں")}</h1>
            <p className="text-sm text-muted-foreground">{t("Manage your schedule", "اپنا شیڈول سنبھالیں")}</p>
          </div>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="min-h-touch min-w-touch flex items-center justify-center rounded-xl bg-primary text-primary-foreground"
        >
          <Plus className="w-5 h-5" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="p-4 rounded-2xl bg-card shadow-card space-y-3">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder={t("Reminder title...", "یاد دہانی کا عنوان...")}
              className="w-full min-h-touch px-4 rounded-2xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="w-full min-h-touch px-4 rounded-2xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button onClick={addReminder} className="w-full min-h-touch bg-primary text-primary-foreground rounded-2xl font-semibold">
              {t("Add Reminder", "یاد دہانی شامل کریں")}
            </button>
          </motion.div>
        )}

        {reminders.map((rem, i) => (
          <motion.div
            key={rem.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`p-4 rounded-2xl bg-card shadow-card flex items-center gap-3 ${rem.completed ? "opacity-50" : ""}`}
          >
            <button
              onClick={() => toggleComplete(rem.id)}
              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                rem.completed ? "bg-success text-success-foreground" : "border-2 border-border"
              }`}
            >
              {rem.completed && <Check className="w-5 h-5" />}
            </button>
            <div className="flex-1 min-w-0">
              <p className={`font-semibold text-foreground ${rem.completed ? "line-through" : ""}`}>{rem.title}</p>
              {rem.title_urdu && <p className="text-sm font-urdu text-muted-foreground" dir="rtl">{rem.title_urdu}</p>}
              <div className="flex items-center gap-2 mt-1">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{rem.time}</span>
                <Bell className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground capitalize">{rem.recurring}</span>
              </div>
            </div>
            <button
              onClick={() => deleteReminder(rem.id)}
              className="min-h-touch min-w-touch flex items-center justify-center rounded-xl hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default RemindersPage;
