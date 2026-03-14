import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { ArrowLeft, Plus, Trash2, Edit, Save } from "lucide-react";
import { motion } from "framer-motion";
import type { Note } from "@/types/app";

const mockNotes: Note[] = [
  { id: "1", user_id: "1", title: "Shopping list", content: "Milk, bread, eggs, fruits", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "2", user_id: "1", title: "Doctor's instructions", content: "Take medicine after meals. Walk 30 min daily.", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

const NotesPage = () => {
  const navigate = useNavigate();
  const { t } = useAccessibility();
  const [notes, setNotes] = useState<Note[]>(mockNotes);
  const [editing, setEditing] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");

  const addNote = () => {
    if (!newTitle) return;
    setNotes([...notes, {
      id: Date.now().toString(), user_id: "1", title: newTitle, content: newContent,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }]);
    setNewTitle("");
    setNewContent("");
    setShowAdd(false);
  };

  const saveEdit = (id: string) => {
    setNotes(n => n.map(note => note.id === id ? { ...note, content: editContent, updated_at: new Date().toISOString() } : note));
    setEditing(null);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/companion")} className="min-h-touch min-w-touch flex items-center justify-center rounded-xl hover:bg-secondary">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground">{t("Notes", "نوٹس")}</h1>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="min-h-touch min-w-touch flex items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Plus className="w-5 h-5" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 rounded-2xl bg-card shadow-card space-y-3">
            <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder={t("Title...", "عنوان...")}
              className="w-full min-h-touch px-4 rounded-2xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            <textarea value={newContent} onChange={(e) => setNewContent(e.target.value)} placeholder={t("Content...", "مواد...")}
              className="w-full min-h-[100px] px-4 py-3 rounded-2xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
            <button onClick={addNote} className="w-full min-h-touch bg-primary text-primary-foreground rounded-2xl font-semibold">
              {t("Save Note", "نوٹ محفوظ کریں")}
            </button>
          </motion.div>
        )}

        {notes.map((note) => (
          <motion.div key={note.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-2xl bg-card shadow-card">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-foreground">{note.title}</h3>
              <div className="flex gap-1">
                <button onClick={() => { setEditing(note.id); setEditContent(note.content); }} className="p-2 rounded-lg hover:bg-secondary">
                  <Edit className="w-4 h-4 text-muted-foreground" />
                </button>
                <button onClick={() => setNotes(n => n.filter(x => x.id !== note.id))} className="p-2 rounded-lg hover:bg-destructive/10">
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
              <p className="text-sm text-muted-foreground">{note.content}</p>
            )}
            <p className="text-[10px] text-muted-foreground mt-2">
              {new Date(note.updated_at).toLocaleDateString()}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default NotesPage;
