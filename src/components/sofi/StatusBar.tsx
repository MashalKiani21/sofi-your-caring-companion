import type { SofiState } from "@/types/sofi";

interface StatusBarProps {
  state: SofiState;
  userName: string;
}

const StatusBar = ({ state, userName }: StatusBarProps) => {
  return (
    <header className="flex items-center justify-between px-6 py-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">SOFI</h1>
        <p className="text-sm text-muted-foreground">Hello, {userName}</p>
      </div>
      <div className="flex items-center gap-3">
        <div
          className={`w-3 h-3 rounded-full ${
            state === "idle"
              ? "bg-muted-foreground"
              : state === "emergency"
              ? "bg-emergency animate-pulse"
              : "bg-success"
          }`}
        />
        <span className="text-sm font-medium text-muted-foreground capitalize">{state}</span>
      </div>
    </header>
  );
};

export default StatusBar;
