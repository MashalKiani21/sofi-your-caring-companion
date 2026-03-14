import { motion } from "framer-motion";
import type { TranscriptEntry } from "@/types/sofi";

interface TranscriptDisplayProps {
  entries: TranscriptEntry[];
}

const TranscriptDisplay = ({ entries }: TranscriptDisplayProps) => {
  if (entries.length === 0) return null;

  const latest = entries[entries.length - 1];

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      {/* English - Top */}
      <motion.div
        key={`en-${latest.id}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="text-center"
      >
        <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground mb-2">
          {latest.type === "user" ? "You said" : "SOFI"}
        </p>
        <p className="text-2xl md:text-3xl font-bold tracking-tight text-foreground leading-relaxed">
          {latest.english}
        </p>
      </motion.div>

      {/* Urdu - Bottom */}
      <motion.div
        key={`ur-${latest.id}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="text-center"
      >
        <p className="text-2xl md:text-3xl font-bold font-urdu text-muted-foreground leading-relaxed" dir="rtl">
          {latest.urdu}
        </p>
      </motion.div>
    </div>
  );
};

export default TranscriptDisplay;
