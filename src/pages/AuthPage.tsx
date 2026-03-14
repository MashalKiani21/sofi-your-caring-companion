import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { Mail, Lock, User, Eye, EyeOff, Mic, ArrowLeft } from "lucide-react";
import { useVoiceRecognition } from "@/hooks/useVoiceRecognition";
import { toast } from "sonner";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeField, setActiveField] = useState<string | null>(null);

  const { signIn, signUp, resetPassword } = useAuth();
  const { t, speak, language } = useAccessibility();
  const navigate = useNavigate();

  const { isListening, startListening, stopListening } = useVoiceRecognition({
    language,
    onResult: (text) => {
      if (activeField === "email") setEmail(text.replace(/\s/g, "").toLowerCase());
      else if (activeField === "name") setFullName(text);
      else if (activeField === "password") setPassword(text.replace(/\s/g, ""));
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error.message);
          speak(t("Login failed. Please try again.", "لاگ ان ناکام۔ دوبارہ کوشش کریں۔"));
        } else {
          speak(t("Login successful!", "لاگ ان کامیاب!"));
          navigate("/profile-setup");
        }
      } else {
        if (!fullName.trim()) {
          toast.error(t("Please enter your name", "اپنا نام درج کریں"));
          return;
        }
        const { error } = await signUp(email, password, fullName);
        if (error) {
          toast.error(error.message);
          speak(t("Sign up failed.", "سائن اپ ناکام۔"));
        } else {
          toast.success(t("Account created! Check your email.", "اکاؤنٹ بنا! ای میل چیک کریں۔"));
          speak(t("Account created! Please check your email to verify.", "اکاؤنٹ بن گیا! تصدیق کے لیے ای میل چیک کریں۔"));
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error(t("Enter your email first", "پہلے ای میل درج کریں"));
      return;
    }
    const { error } = await resetPassword(email);
    if (error) toast.error(error.message);
    else {
      toast.success(t("Password reset email sent!", "پاسورڈ ری سیٹ ای میل بھیج دی!"));
      speak(t("Password reset email sent.", "پاسورڈ ری سیٹ ای میل بھیج دی۔"));
    }
  };

  const toggleVoice = (field: string) => {
    if (isListening) {
      stopListening();
      setActiveField(null);
    } else {
      setActiveField(field);
      startListening();
      speak(t(`Speak your ${field}`, `اپنا ${field} بولیں`));
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center p-4 gap-3">
        <button
          onClick={() => navigate("/")}
          className="min-h-touch min-w-touch flex items-center justify-center rounded-xl hover:bg-secondary transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground">{t("SOFI", "سوفی")}</h1>
          <p className="text-sm text-muted-foreground">
            {isLogin ? t("Welcome back", "واپس خوش آمدید") : t("Create account", "اکاؤنٹ بنائیں")}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 flex flex-col justify-center px-6 max-w-md mx-auto w-full">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name field (signup only) */}
          {!isLogin && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t("Full Name", "پورا نام")}
              </label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t("Enter your name", "اپنا نام درج کریں")}
                    className="w-full min-h-touch pl-11 pr-4 rounded-2xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    aria-label="Full name"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => toggleVoice("name")}
                  className={`min-h-touch min-w-touch rounded-2xl flex items-center justify-center transition-colors ${
                    isListening && activeField === "name" ? "bg-emergency text-emergency-foreground animate-pulse" : "bg-secondary text-foreground"
                  }`}
                  aria-label="Speak your name"
                >
                  <Mic className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Email */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              {t("Email", "ای میل")}
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("Enter email", "ای میل درج کریں")}
                  className="w-full min-h-touch pl-11 pr-4 rounded-2xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                  aria-label="Email address"
                />
              </div>
              <button
                type="button"
                onClick={() => toggleVoice("email")}
                className={`min-h-touch min-w-touch rounded-2xl flex items-center justify-center transition-colors ${
                  isListening && activeField === "email" ? "bg-emergency text-emergency-foreground animate-pulse" : "bg-secondary text-foreground"
                }`}
                aria-label="Speak your email"
              >
                <Mic className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              {t("Password", "پاسورڈ")}
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("Enter password", "پاسورڈ درج کریں")}
                  className="w-full min-h-touch pl-11 pr-12 rounded-2xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                  minLength={6}
                  aria-label="Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5 text-muted-foreground" /> : <Eye className="w-5 h-5 text-muted-foreground" />}
                </button>
              </div>
              <button
                type="button"
                onClick={() => toggleVoice("password")}
                className={`min-h-touch min-w-touch rounded-2xl flex items-center justify-center transition-colors ${
                  isListening && activeField === "password" ? "bg-emergency text-emergency-foreground animate-pulse" : "bg-secondary text-foreground"
                }`}
                aria-label="Speak your password"
              >
                <Mic className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Forgot password */}
          {isLogin && (
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-sm text-primary font-medium hover:underline"
            >
              {t("Forgot password?", "پاسورڈ بھول گئے؟")}
            </button>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-touch bg-primary text-primary-foreground rounded-2xl font-semibold text-lg hover:bg-primary/90 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            {loading
              ? t("Please wait...", "براہ کرم انتظار کریں...")
              : isLogin
              ? t("Login / لاگ ان", "لاگ ان / Login")
              : t("Sign Up / سائن اپ", "سائن اپ / Sign Up")}
          </button>
        </form>

        {/* Toggle */}
        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-muted-foreground hover:text-foreground min-h-touch"
          >
            {isLogin
              ? t("Don't have an account? Sign up", "اکاؤنٹ نہیں ہے؟ سائن اپ کریں")
              : t("Already have an account? Login", "پہلے سے اکاؤنٹ ہے؟ لاگ ان کریں")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
