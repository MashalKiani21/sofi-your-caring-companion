import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { useAuth } from "@/contexts/AuthContext";
import { useVoiceContext } from "@/contexts/VoiceContext";
import { useVoiceConfirmation } from "@/hooks/useVoiceConfirmation";
import { ReminderService, type ReminderData } from "@/services/ReminderService";
import { VoiceService } from "@/services/VoiceService";
import { usePageAnnounce } from "@/hooks/usePageAnnounce";
import { ArrowLeft, Plus, Clock, Trash2, Bell, Check, X, AlarmClock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const RemindersPage = () => {
  const navigate = useNavigate();
  const { t, speak, language } = useAccessibility();
  const { user } = useAuth();
  const { registerPageHandler, isListening } = useVoiceContext();
  const { confirm } = useVoiceConfirmation();
  const [reminders, setReminders] = useState<ReminderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newRecurring, setNewRecurring] = useState<string>("once");

  usePageAnnounce("Reminders", "یاد دہانیاں");

  useEffect(() => {
    const unregister = registerPageHandler((text: string) => {
      const intent = VoiceService.parseIntent(text);

      if (intent.type === "navigate" || intent.type === "call" || intent.type === "message" || intent.type === "emergency") {
        return false;
      }

      const parsed = intent.type === "reminder"
        ? { title: intent.title, time: intent.time || "" }
        : ReminderService.parseVoiceReminder(text);

      if (parsed) {
        setNewTitle(parsed.title);
        if (parsed.time) setNewTime(parsed.time);
        setShowAdd(true);
        speak(t(`Setting reminder: ${parsed.title}`, `یاد دہانی لگا رہے ہیں: ${parsed.title}`));
        return true;
      }

      if (!text.trim()) return false;

      setNewTitle(text);
      setShowAdd(true);
      speak(t(`Creating reminder: ${text}`, `یاد دہانی بنا رہے ہیں: ${text}`));
      return true;
    });
    return unregister;
  }, [registerPageHandler, speak, t]);

  useEffect(() => {
    if (user) loadReminders();
  }, [user]);

  const loadReminders = async () => {
    try {
      const data = await ReminderService.getReminders(user!.id);
      setReminders(data);
    } catch (err) {
      toast.error(t("Failed to load reminders", "یاد دہانیاں لوڈ نہیں ہوئیں"));
    } finally {
      setLoading(false);
    }
  };

  const addReminder = async () => {
    if (!newTitle || !newTime || !user) return;
    try {
      await ReminderService.createReminder(user.id, {
        title: newTitle,
        reminder_time: newTime,
        recurring: newRecurring,
      });
      await loadReminders();
      setNewTitle(""); setNewTime(""); setNewRecurring("once"); setShowAdd(false);
      speak(t("Reminder added!", "یاد دہانی شامل ہو گئی!"));
      toast.success(t("Reminder added", "یاد دہانی شامل"));
    } catch (err) {
      toast.error(t("Failed to add reminder", "یاد دہانی شامل نہیں ہوئی"));
    }
  };

  const toggleComplete = async (id: string, completed: boolean) => {
    try {
      await ReminderService.toggleComplete(id, !completed);
      setReminders((r) => r.map((rem) => (rem.id === id ? { ...rem, completed: !completed } : rem)));
    } catch (err) {
      toast.error(t("Update failed", "اپ ڈیٹ ناکام"));
    }
  };

  const deleteReminder = async (rem: ReminderData) => {
    const confirmed = await confirm(
      `Delete reminder "${rem.title}"? Say yes or no.`,
      `یاد دہانی "${rem.title}" حذف کریں؟ ہاں یا نہیں بولیں۔`
    );
    if (!confirmed) return;
    try {
      await ReminderService.deleteReminder(rem.id);
      setReminders((r) => r.filter((x) => x.id !== rem.id));
      toast.success(t("Reminder deleted", "یاد دہانی حذف"));
    } catch (err) {
      toast.error(t("Delete failed", "حذف ناکام"));
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/home")} className="min-h-touch min-w-touch flex items-center justify-center rounded-xl hover:bg-secondary">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">{t("Reminders", "یاد دہانیاں")}</h1>
            <p className="text-sm text-muted-foreground">
              {isListening ? t("Say your reminder!", "اپنی یاد دہانی بولیں!") : t("Voice or text", "آواز یا ٹیکسٹ")}
            </p>
          </div>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="min-h-touch min-w-touch flex items-center justify-center rounded-xl bg-primary text-primary-foreground">
          {showAdd ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        </button>
      </header>

      <div className="mx-4 mt-3 p-3 rounded-2xl bg-accent border border-border flex items-center gap-2 text-sm text-muted-foreground">
        <AlarmClock className="w-4 h-4 shrink-0" />
        <span>{t("Just say \"Remind me to take medicine at 9 PM\"", "بس بولیں \"مجھے 9 بجے دوائی یاد دلائیں\"")}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <AnimatePresence>
          {showAdd && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="p-4 rounded-2xl bg-card shadow-card space-y-3">
              <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder={t("Reminder title (or just speak)...", "یاد دہانی کا عنوان (یا بس بولیں)...")}
                className="w-full min-h-touch px-4 rounded-2xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)}
                className="w-full min-h-touch px-4 rounded-2xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              <div className="grid grid-cols-4 gap-2">
                {["once", "daily", "weekly", "monthly"].map((r) => (
                  <button key={r} onClick={() => setNewRecurring(r)}
                    className={`min-h-touch rounded-xl text-xs font-medium capitalize transition-colors ${
                      newRecurring === r ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                    }`}>
                    {t(r, r === "once" ? "ایک بار" : r === "daily" ? "روزانہ" : r === "weekly" ? "ہفتہ وار" : "ماہانہ")}
                  </button>
                ))}
              </div>
              <button onClick={addReminder} disabled={!newTitle || !newTime} className="w-full min-h-touch bg-primary text-primary-foreground rounded-2xl font-semibold disabled:opacity-50">
                {t("Add Reminder", "یاد دہانی شامل کریں")}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : reminders.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">{t("No reminders yet", "ابھی کوئی یاد دہانی نہیں")}</p>
          </div>
        ) : (
          reminders.map((rem, i) => (
            <motion.div key={rem.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className={`p-4 rounded-2xl bg-card shadow-card flex items-center gap-3 ${rem.completed ? "opacity-50" : ""}`}>
              <button onClick={() => toggleComplete(rem.id, rem.completed)}
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  rem.completed ? "bg-success text-success-foreground" : "border-2 border-border"
                }`}>
                {rem.completed && <Check className="w-5 h-5" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-foreground ${rem.completed ? "line-through" : ""}`}>{rem.title}</p>
                {rem.title_urdu && <p className="text-sm font-urdu text-muted-foreground" dir="rtl">{rem.title_urdu}</p>}
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{rem.reminder_time}</span>
                  <Bell className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground capitalize">{rem.recurring}</span>
                </div>
              </div>
              <button onClick={() => deleteReminder(rem)} className="min-h-touch min-w-touch flex items-center justify-center rounded-xl hover:bg-destructive/10">
                <Trash2 className="w-4 h-4 text-destructive" />
              </button>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default RemindersPage;
