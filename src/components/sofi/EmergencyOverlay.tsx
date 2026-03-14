import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface EmergencyOverlayProps {
  active: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const EmergencyOverlay = ({ active, onCancel, onConfirm }: EmergencyOverlayProps) => {
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    if (!active) {
      setCountdown(10);
      return;
    }

    if (countdown <= 0) {
      onConfirm();
      return;
    }

    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [active, countdown, onConfirm]);

  const handleCancel = useCallback(() => {
    setCountdown(10);
    onCancel();
  }, [onCancel]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, scale: [1, 1.02, 1] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, scale: { repeat: Infinity, duration: 1.5 } }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-emergency/95 p-8"
        >
          <div className="text-center space-y-8 max-w-lg">
            <motion.h1
              className="text-4xl md:text-6xl font-bold text-emergency-foreground tracking-tight"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              FALL DETECTED
            </motion.h1>

            <p className="text-2xl font-urdu text-emergency-foreground/90" dir="rtl">
              گرنے کا پتہ چلا
            </p>

            <p className="text-3xl md:text-5xl font-bold text-emergency-foreground">
              Calling for help in{" "}
              <span className="tabular-nums">{countdown}</span>…
            </p>

            <p className="text-xl font-urdu text-emergency-foreground/80" dir="rtl">
              {countdown} …سیکنڈ میں مدد کے لیے کال کی جائے گی
            </p>

            <button
              onClick={handleCancel}
              className="mt-8 min-h-touch min-w-touch px-12 py-5 rounded-2xl bg-emergency-foreground text-emergency text-xl font-bold tracking-tight focus:outline-none focus:ring-2 focus:ring-emergency-foreground focus:ring-offset-2 focus:ring-offset-emergency"
            >
              CANCEL — I'M OK
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EmergencyOverlay;
