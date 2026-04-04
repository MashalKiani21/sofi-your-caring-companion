import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { useAuth } from "@/contexts/AuthContext";
import { useVoiceContext } from "@/contexts/VoiceContext";
import { useVoiceConfirmation } from "@/hooks/useVoiceConfirmation";
import { usePageAnnounce } from "@/hooks/usePageAnnounce";
import { supabase } from "@/integrations/supabase/client";
import { VoiceService } from "@/services/VoiceService";
import { ArrowLeft, Plus, Trash2, Edit, Save, X, FileText, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface NoteData {
  id: string;
  title: string;
  content: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

const NotesPage = () => {
  const navigate = useNavigate();
  const { t, speak, language, disabilityType } = useAccessibility();
  const { user } = useAuth();
  const { registerPageHandler, isListening } = useVoiceContext();
  const { confirm } = useVoiceConfirmation();
  const [notes, setNotes] = useState<NoteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");

  usePageAnnounce("Notes", "نوٹس");

  useEffect(() => {
    const unregister = registerPageHandler((text: string) => {
      if (VoiceService.parseIntent(text).type !== "unknown") {
        return false;
      }

      if (!text.trim()) return false;

      setNewTitle(text.slice(0, 50));
      setNewContent(text);
      setShowAdd(true);
      speak(t("Note captured! Review and save.", "نوٹ لیا! جائزہ لیں اور محفوظ کریں۔"));
      return true;
    });
    return unregister;
  }, [registerPageHandler, speak, t]);

  useEffect(() => {
    if (user) loadNotes();
  }, [user]);

  const loadNotes = async () => {
    try {
      const { data, error } = await supabase.from("notes").select("*").eq("user_id", user!.id).order("updated_at", { ascending: false });
      if (error) throw error;
      setNotes(data || []);
    } catch (err) {
      toast.error(t("Failed to load notes", "نوٹس لوڈ نہیں ہوئے"));
    } finally {
      setLoading(false);
    }
  };

  const addNote = async () => {
    if (!newTitle || !user) return;
    try {
      const { error } = await supabase.from("notes").insert({ title: newTitle, content: newContent, user_id: user.id });
      if (error) throw error;
      await loadNotes();
      setNewTitle(""); setNewContent(""); setShowAdd(false);
      speak(t("Note saved!", "نوٹ محفوظ!"));
      toast.success(t("Note saved", "نوٹ محفوظ"));
    } catch (err) {
      toast.error(t("Failed to save note", "نوٹ محفوظ نہیں ہوا"));
    }
  };

  const saveEdit = async (id: string) => {
    try {
      const { error } = await supabase.from("notes").update({ content: editContent }).eq("id", id);
      if (error) throw error;
      setNotes((n) => n.map((note) => (note.id === id ? { ...note, content: editContent, updated_at: new Date().toISOString() } : note)));
      setEditing(null);
      toast.success(t("Note updated", "نوٹ اپ ڈیٹ"));
    } catch (err) {
      toast.error(t("Update failed", "اپ ڈیٹ ناکام"));
    }
  };

  const deleteNote = async (note: NoteData) => {
    const confirmed = await confirm(
      `Delete note "${note.title}"? Say yes or no.`,
      `نوٹ "${note.title}" حذف کریں؟ ہاں یا نہیں بولیں۔`
    );
    if (!confirmed) return;
    try {
      const { error } = await supabase.from("notes").delete().eq("id", note.id);
      if (error) throw error;
      setNotes((n) => n.filter((x) => x.id !== note.id));
      toast.success(t("Note deleted", "نوٹ حذف"));
    } catch (err) {
      toast.error(t("Delete failed", "حذف ناکام"));
    }
  };

  const readNoteAloud = (note: NoteData) => {
    speak(`${note.title}. ${note.content || ""}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/home")} className="min-h-touch min-w-touch flex items-center justify-center rounded-xl hover:bg-secondary">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">{t("Notes", "نوٹس")}</h1>
            <p className="text-sm text-muted-foreground">
              {isListening ? t("Speak to create a note!", "نوٹ بنانے کے لیے بولیں!") : t("Voice-enabled", "آواز فعال")}
            </p>
          </div>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="min-h-touch min-w-touch flex items-center justify-center rounded-xl bg-primary text-primary-foreground">
          {showAdd ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <AnimatePresence>
          {showAdd && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="p-4 rounded-2xl bg-card shadow-card space-y-3">
              <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder={t("Title (or just speak)...", "عنوان (یا بس بولیں)...")}
                className="w-full min-h-touch px-4 rounded-2xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              <textarea value={newContent} onChange={(e) => setNewContent(e.target.value)} placeholder={t("Content...", "مواد...")}
                className="w-full min-h-[100px] px-4 py-3 rounded-2xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
              <button onClick={addNote} disabled={!newTitle} className="w-full min-h-touch bg-primary text-primary-foreground rounded-2xl font-semibold disabled:opacity-50">
                {t("Save Note", "نوٹ محفوظ کریں")}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">{t("No notes yet", "ابھی کوئی نوٹ نہیں")}</p>
            <p className="text-sm text-muted-foreground mt-1">{t("Just speak to create a note!", "نوٹ بنانے کے لیے بس بولیں!")}</p>
          </div>
        ) : (
          notes.map((note) => (
            <motion.div key={note.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-2xl bg-card shadow-card">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-foreground">{note.title}</h3>
                <div className="flex gap-1">
                  <button onClick={() => readNoteAloud(note)} className="p-2 rounded-lg hover:bg-primary/10" aria-label="Read aloud">
                    <Volume2 className="w-4 h-4 text-primary" />
                  </button>
                  <button onClick={() => { setEditing(note.id); setEditContent(note.content || ""); }} className="p-2 rounded-lg hover:bg-secondary">
                    <Edit className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button onClick={() => deleteNote(note)} className="p-2 rounded-lg hover:bg-destructive/10">
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              </div>
              {editing === note.id ? (
                <div className="space-y-2">
                  <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)}
                    className="w-full min-h-[80px] px-3 py-2 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none text-sm" />
                  <button onClick={() => saveEdit(note.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm">
                    <Save className="w-3 h-3" /> {t("Save", "محفوظ")}
                  </button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{note.content}</p>
              )}
              <p className="text-[10px] text-muted-foreground mt-2">{new Date(note.updated_at).toLocaleDateString()}</p>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotesPage;
