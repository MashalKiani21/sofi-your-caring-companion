import { useState, useEffect } from "react";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { useNavigate } from "react-router-dom";
import { Download, Share, MoreVertical, CheckCircle2 } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const InstallPage = () => {
  const { t } = useAccessibility();
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Detect iOS
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream);

    // Listen for install prompt (Android / Chrome)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setIsInstalled(true);
    setDeferredPrompt(null);
  };

  if (isInstalled) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background px-6 text-center">
        <CheckCircle2 className="w-16 h-16 text-primary mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">
          {t("SOFI is installed!", "سوفی انسٹال ہو گئی!")}
        </h1>
        <p className="text-muted-foreground mb-6">
          {t("Open SOFI from your home screen anytime.", "اپنی ہوم اسکرین سے کبھی بھی سوفی کھولیں۔")}
        </p>
        <button
          onClick={() => navigate("/home")}
          className="min-h-touch px-8 py-3 rounded-2xl bg-primary text-primary-foreground font-semibold text-lg"
        >
          {t("Continue", "جاری رکھیں")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-6 text-center">
      <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
        <Download className="w-10 h-10 text-primary" />
      </div>

      <h1 className="text-2xl font-bold text-foreground mb-2">
        {t("Install SOFI", "سوفی انسٹال کریں")}
      </h1>
      <p className="text-muted-foreground mb-8 max-w-sm">
        {t(
          "Add SOFI to your home screen for quick access — works offline like a real app!",
          "فوری رسائی کے لیے سوفی کو اپنی ہوم اسکرین پر شامل کریں — حقیقی ایپ کی طرح آف لائن کام کرتی ہے!"
        )}
      </p>

      {deferredPrompt ? (
        <button
          onClick={handleInstall}
          className="min-h-touch px-8 py-3 rounded-2xl bg-primary text-primary-foreground font-semibold text-lg mb-4 flex items-center gap-2"
        >
          <Download className="w-5 h-5" />
          {t("Install Now", "ابھی انسٹال کریں")}
        </button>
      ) : isIOS ? (
        <div className="bg-card border border-border rounded-2xl p-5 max-w-sm text-left space-y-3">
          <p className="font-semibold text-foreground">
            {t("To install on iPhone/iPad:", "آئی فون/آئی پیڈ پر انسٹال کرنے کے لیے:")}
          </p>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Share className="w-4 h-4 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">
              {t("Tap the Share button in Safari", "سفاری میں شیئر بٹن دبائیں")}
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-primary font-bold text-sm">+</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {t("Select \"Add to Home Screen\"", "\"ہوم اسکرین میں شامل کریں\" منتخب کریں")}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl p-5 max-w-sm text-left space-y-3">
          <p className="font-semibold text-foreground">
            {t("To install on Android:", "اینڈرائیڈ پر انسٹال کرنے کے لیے:")}
          </p>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <MoreVertical className="w-4 h-4 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">
              {t("Tap the menu (⋮) in Chrome", "کروم میں مینو (⋮) دبائیں")}
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Download className="w-4 h-4 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">
              {t("Select \"Install app\" or \"Add to Home Screen\"", "\"ایپ انسٹال کریں\" یا \"ہوم اسکرین میں شامل کریں\" منتخب کریں")}
            </p>
          </div>
        </div>
      )}

      <button
        onClick={() => navigate("/home")}
        className="mt-6 text-sm text-muted-foreground underline"
      >
        {t("Skip for now", "ابھی چھوڑیں")}
      </button>
    </div>
  );
};

export default InstallPage;
