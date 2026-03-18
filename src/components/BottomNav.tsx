import { useNavigate, useLocation } from "react-router-dom";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { Home, Bot, ShieldAlert, HeartPulse, Settings } from "lucide-react";

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, speak, disabilityType } = useAccessibility();

  const tabs = [
    { path: "/home", icon: Home, label: t("Home", "ہوم") },
    { path: "/companion", icon: Bot, label: t("SOFI", "سوفی") },
    { path: "/emergency", icon: ShieldAlert, label: t("SOS", "SOS") },
    { path: "/health-dashboard", icon: HeartPulse, label: t("Health", "صحت") },
    { path: "/settings", icon: Settings, label: t("Settings", "ترتیبات") },
  ];

  // Don't show on intro, auth, profile setup
  const hiddenRoutes = ["/", "/auth", "/profile-setup", "/reset-password"];
  if (hiddenRoutes.includes(location.pathname)) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border safe-area-bottom"
      role="navigation"
      aria-label={t("Main navigation", "مرکزی نیویگیشن")}
    >
      <div className="flex items-center justify-around px-2 py-1" role="tablist">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          const isEmergency = tab.path === "/emergency";
          return (
            <button
              key={tab.path}
              onClick={() => {
                if (disabilityType === "visual" || disabilityType === "multiple") {
                  speak(tab.label);
                }
                navigate(tab.path);
              }}
              className={`flex flex-col items-center justify-center min-w-[64px] min-h-touch py-1 rounded-2xl transition-colors ${
                isEmergency
                  ? "text-emergency"
                  : isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
              role="tab"
              aria-selected={isActive}
              aria-label={`${tab.label}${isActive ? " — current page" : ""}`}
              aria-current={isActive ? "page" : undefined}
            >
              <tab.icon className={`w-6 h-6 ${isEmergency && !isActive ? "text-emergency" : ""}`} aria-hidden="true" />
              <span className="text-[10px] font-medium mt-0.5">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
