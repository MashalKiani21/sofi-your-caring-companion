import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import {
  ArrowLeft, Heart, Activity, TrendingUp, Droplets, Moon, Smile, 
  ThermometerSun, Pill, Plus, AlertTriangle
} from "lucide-react";
import { motion } from "framer-motion";
import type { HealthMetric } from "@/types/app";

const mockMetrics: HealthMetric[] = [
  { id: "1", user_id: "1", type: "heart_rate", value: "72", unit: "bpm", recorded_at: new Date().toISOString() },
  { id: "2", user_id: "1", type: "blood_pressure", value: "120/80", unit: "mmHg", recorded_at: new Date().toISOString() },
  { id: "3", user_id: "1", type: "steps", value: "3,240", unit: "steps", recorded_at: new Date().toISOString() },
  { id: "4", user_id: "1", type: "sleep", value: "7.5", unit: "hours", recorded_at: new Date().toISOString() },
  { id: "5", user_id: "1", type: "mood", value: "Good", unit: "", recorded_at: new Date().toISOString() },
  { id: "6", user_id: "1", type: "pain_level", value: "2", unit: "/10", recorded_at: new Date().toISOString() },
];

const metricConfig: Record<string, { icon: any; color: string; label: { en: string; ur: string } }> = {
  heart_rate: { icon: Heart, color: "text-emergency", label: { en: "Heart Rate", ur: "دل کی دھڑکن" } },
  blood_pressure: { icon: Activity, color: "text-primary", label: { en: "Blood Pressure", ur: "بلڈ پریشر" } },
  steps: { icon: TrendingUp, color: "text-success", label: { en: "Steps Today", ur: "آج کے قدم" } },
  sleep: { icon: Moon, color: "text-primary", label: { en: "Sleep", ur: "نیند" } },
  mood: { icon: Smile, color: "text-success", label: { en: "Mood", ur: "موڈ" } },
  pain_level: { icon: ThermometerSun, color: "text-emergency", label: { en: "Pain Level", ur: "درد کی سطح" } },
  medication: { icon: Pill, color: "text-primary", label: { en: "Medication", ur: "دوائی" } },
};

const HealthDashboard = () => {
  const navigate = useNavigate();
  const { t, language } = useAccessibility();
  const [metrics] = useState<HealthMetric[]>(mockMetrics);

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/companion")}
            className="min-h-touch min-w-touch flex items-center justify-center rounded-xl hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">{t("Health Dashboard", "صحت ڈیش بورڈ")}</h1>
            <p className="text-sm text-muted-foreground">{t("Monitor your health", "اپنی صحت مانیٹر کریں")}</p>
          </div>
        </div>
        <button className="min-h-touch min-w-touch flex items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Plus className="w-5 h-5" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Status banner */}
        <div className="p-4 rounded-2xl bg-success/10 border border-success/20 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
            <Heart className="w-5 h-5 text-success" />
          </div>
          <div>
            <p className="font-semibold text-foreground">{t("All Normal", "سب ٹھیک ہے")}</p>
            <p className="text-sm text-muted-foreground">{t("Last updated 5 min ago", "آخری اپ ڈیٹ 5 منٹ پہلے")}</p>
          </div>
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-2 gap-3">
          {metrics.map((metric, i) => {
            const config = metricConfig[metric.type];
            if (!config) return null;
            const Icon = config.icon;
            return (
              <motion.div
                key={metric.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 rounded-2xl bg-card shadow-card"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-4 h-4 ${config.color}`} />
                  <p className="text-xs font-medium text-muted-foreground">
                    {language === "ur" ? config.label.ur : config.label.en}
                  </p>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {metric.value}
                  <span className="text-sm font-normal text-muted-foreground ml-1">{metric.unit}</span>
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Medications */}
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
            <Pill className="w-4 h-4" /> {t("Today's Medications", "آج کی دوائیں")}
          </h2>
          <div className="space-y-2">
            {[
              { name: "Metformin 500mg", time: "8:00 AM", taken: true },
              { name: "Vitamin D", time: "12:00 PM", taken: true },
              { name: "Metformin 500mg", time: "8:00 PM", taken: false },
            ].map((med, i) => (
              <div key={i} className={`p-4 rounded-2xl bg-card shadow-card flex items-center justify-between ${med.taken ? "opacity-60" : ""}`}>
                <div>
                  <p className="font-semibold text-foreground">{med.name}</p>
                  <p className="text-sm text-muted-foreground">{med.time}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  med.taken ? "bg-success/10 text-success" : "bg-primary/10 text-primary"
                }`}>
                  {med.taken ? t("Taken", "لی") : t("Pending", "باقی")}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Emergency */}
        <button
          onClick={() => navigate("/emergency")}
          className="w-full min-h-touch p-4 rounded-2xl bg-emergency/10 border-2 border-emergency/20 flex items-center gap-3 hover:bg-emergency/20 transition-colors"
        >
          <AlertTriangle className="w-6 h-6 text-emergency" />
          <div className="text-left">
            <p className="font-semibold text-emergency">{t("Emergency SOS", "ایمرجنسی SOS")}</p>
            <p className="text-sm text-muted-foreground">{t("Tap to call for help", "مدد کے لیے ٹیپ کریں")}</p>
          </div>
        </button>
      </div>
    </div>
  );
};

export default HealthDashboard;
