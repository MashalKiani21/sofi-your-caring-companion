import { Phone, Bell, AlertTriangle, Moon } from "lucide-react";

interface QuickActionsProps {
  onEmergency: () => void;
  onSleep: () => void;
}

const actions = [
  { icon: Phone, label: "Call", labelUrdu: "کال", color: "bg-primary/10 text-primary" },
  { icon: Bell, label: "Reminder", labelUrdu: "یاد دہانی", color: "bg-success/10 text-success" },
];

const QuickActions = ({ onEmergency, onSleep }: QuickActionsProps) => {
  return (
    <div className="grid grid-cols-4 gap-3 px-6">
      {actions.map(({ icon: Icon, label, labelUrdu, color }) => (
        <button
          key={label}
          className={`flex flex-col items-center justify-center gap-2 min-h-touch rounded-2xl ${color} p-4 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2`}
        >
          <Icon className="w-6 h-6" />
          <span className="text-xs font-semibold">{label}</span>
        </button>
      ))}
      <button
        onClick={onEmergency}
        className="flex flex-col items-center justify-center gap-2 min-h-touch rounded-2xl bg-emergency/10 text-emergency p-4 focus:outline-none focus:ring-2 focus:ring-emergency focus:ring-offset-2"
      >
        <AlertTriangle className="w-6 h-6" />
        <span className="text-xs font-semibold">SOS</span>
      </button>
      <button
        onClick={onSleep}
        className="flex flex-col items-center justify-center gap-2 min-h-touch rounded-2xl bg-secondary text-foreground p-4 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        <Moon className="w-6 h-6" />
        <span className="text-xs font-semibold">Sleep</span>
      </button>
    </div>
  );
};

export default QuickActions;
