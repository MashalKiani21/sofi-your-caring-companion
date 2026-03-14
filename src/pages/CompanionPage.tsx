import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { useAuth } from "@/contexts/AuthContext";
import { useVoiceRecognition } from "@/hooks/useVoiceRecognition";
import { supabase } from "@/integrations/supabase/client";
import { Mic, MicOff, Send, ArrowLeft, Globe, Menu, Volume2, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import type { ChatMessage } from "@/types/app";

const CompanionPage = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { t, speak, stopSpeaking, language, setLanguage } = useAccessibility();
  const { user } = useAuth();

  const { isListening, startListening, stopListening, isSupported } = useVoiceRecognition({
    language,
    onResult: (text) => {
      setInput(text);
      // Auto-send voice input
      handleSend(text);
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Welcome message
  useEffect(() => {
    const welcome: ChatMessage = {
      id: "welcome",
      user_id: "system",
      role: "assistant",
      content: "Hello! I'm SOFI, your AI companion. How can I help you today? You can speak or type in English or Urdu.\n\nسلام! میں سوفی ہوں، آپ کا AI ساتھی۔ میں آج آپ کی کیسے مدد کر سکتی ہوں؟",
      type: "text",
      timestamp: new Date(),
    };
    setMessages([welcome]);
    if (!isMuted) speak(language === "ur" 
      ? "سلام! میں سوفی ہوں۔ میں آپ کی کیسے مدد کر سکتی ہوں؟"
      : "Hello! I'm SOFI. How can I help you today?");
  }, []);

  const handleSend = useCallback(async (voiceText?: string) => {
    const text = voiceText || input.trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      user_id: user?.id || "anonymous",
      role: "user",
      content: text,
      type: voiceText ? "voice" : "text",
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const allMessages = [...messages, userMsg].map(m => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      const response = await supabase.functions.invoke("chat", {
        body: { messages: allMessages },
      });

      if (response.error) throw response.error;

      const aiContent = response.data?.choices?.[0]?.message?.content || 
        t("I'm sorry, I couldn't process that.", "معذرت، میں اسے سمجھ نہیں سکی۔");

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        user_id: "sofi",
        role: "assistant",
        content: aiContent,
        type: "text",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMsg]);
      if (!isMuted) speak(aiContent);
    } catch (err: any) {
      console.error("Chat error:", err);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        user_id: "sofi",
        role: "assistant",
        content: t(
          "I'm having trouble connecting. Please try again.",
          "مجھے جوڑنے میں مشکل ہو رہی ہے۔ دوبارہ کوشش کریں۔"
        ),
        type: "text",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [input, messages, isLoading, user, t, speak, isMuted, language]);

  const toggleLanguage = () => {
    const newLang = language === "en" ? "ur" : "en";
    setLanguage(newLang as any);
    speak(newLang === "ur" ? "زبان اردو میں تبدیل ہو گئی" : "Language switched to English");
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="min-h-touch min-w-touch flex items-center justify-center rounded-xl hover:bg-secondary transition-colors"
            aria-label="Menu"
          >
            <Menu className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-foreground">SOFI</h1>
            <p className="text-xs text-muted-foreground">
              {isListening ? t("Listening...", "سن رہی ہے...") : t("AI Companion", "AI ساتھی")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleLanguage}
            className="min-h-touch min-w-touch flex items-center justify-center rounded-xl hover:bg-secondary transition-colors"
            aria-label="Toggle language"
          >
            <Globe className="w-5 h-5 text-foreground" />
          </button>
          <button
            onClick={() => { setIsMuted(!isMuted); if (!isMuted) stopSpeaking(); }}
            className="min-h-touch min-w-touch flex items-center justify-center rounded-xl hover:bg-secondary transition-colors"
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-muted-foreground" /> : <Volume2 className="w-5 h-5 text-foreground" />}
          </button>
        </div>
      </header>

      {/* Side menu */}
      <AnimatePresence>
        {showMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-foreground z-40"
              onClick={() => setShowMenu(false)}
            />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 25 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-card border-r border-border z-50 p-6 space-y-4"
            >
              <h2 className="text-lg font-bold text-foreground mb-6">{t("Menu", "مینو")}</h2>
              {[
                { label: t("Dashboard", "ڈیش بورڈ"), path: "/health-dashboard" },
                { label: t("Reminders", "یاد دہانیاں"), path: "/reminders" },
                { label: t("Notes", "نوٹس"), path: "/notes" },
                { label: t("Contacts", "رابطے"), path: "/contacts" },
                { label: t("Messages", "پیغامات"), path: "/messages" },
                { label: t("Settings", "ترتیبات"), path: "/settings" },
              ].map(item => (
                <button
                  key={item.path}
                  onClick={() => { setShowMenu(false); navigate(item.path); }}
                  className="w-full text-left min-h-touch px-4 py-3 rounded-2xl hover:bg-secondary text-foreground font-medium transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className={`max-w-[85%] px-4 py-3 rounded-2xl ${
              msg.role === "user"
                ? "bg-primary text-primary-foreground rounded-br-md"
                : "bg-card border border-border text-card-foreground rounded-bl-md"
            }`}>
              {msg.role === "assistant" ? (
                <div className="prose prose-sm max-w-none text-inherit">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm">{msg.content}</p>
              )}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] opacity-60">
                  {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
                {msg.type === "voice" && <Mic className="w-3 h-3 opacity-60" />}
              </div>
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border px-4 py-3 bg-card">
        <div className="flex items-center gap-2 max-w-3xl mx-auto">
          <button
            onClick={() => isListening ? stopListening() : startListening()}
            disabled={!isSupported}
            className={`min-h-touch min-w-touch rounded-2xl flex items-center justify-center transition-all ${
              isListening
                ? "bg-emergency text-emergency-foreground animate-pulse scale-110"
                : "bg-secondary text-foreground hover:bg-secondary/80"
            } disabled:opacity-30`}
            aria-label={isListening ? t("Stop listening", "سننا بند کریں") : t("Start voice input", "آواز شروع کریں")}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={t("Type a message...", "پیغام لکھیں...")}
            className="flex-1 min-h-touch px-4 rounded-2xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            dir={language === "ur" ? "rtl" : "ltr"}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="min-h-touch min-w-touch rounded-2xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50"
            aria-label={t("Send message", "پیغام بھیجیں")}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompanionPage;
