import { useEffect, useMemo, useRef, useState } from "react";
import { Eye, Clock, Repeat, CalendarDays, Sparkles } from "lucide-react";

const STORAGE_KEY = "nova:page-counter";
const SESSION_KEY = "nova:page-counter:session";
const FIRST_KEY = "nova:page-counter:first";
const LAST_KEY = "nova:page-counter:last";

type Stat = {
  icon: typeof Eye;
  value: number;
  display?: (n: number) => string;
  label: string;
  suffix?: string;
};

const useCountUp = (target: number, duration = 1200) => {
  const [value, setValue] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    let raf = 0;
    startRef.current = null;
    const step = (t: number) => {
      if (startRef.current === null) startRef.current = t;
      const p = Math.min(1, (t - startRef.current) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
};

const StatCard = ({ stat }: { stat: Stat }) => {
  const animated = useCountUp(stat.value);
  const text = stat.display ? stat.display(animated) : animated.toLocaleString();
  return (
    <div className="bg-cream border border-sand rounded-md px-6 py-7 flex flex-col gap-3 shadow-[0_2px_18px_-12px_hsl(var(--ink)/0.25)]">
      <div className="h-10 w-10 rounded-full bg-sand/60 flex items-center justify-center">
        <stat.icon className="h-5 w-5 text-brass" strokeWidth={1.75} />
      </div>
      <div className="font-serif text-4xl text-ink tabular-nums leading-none">
        {text}
        {stat.suffix && <span className="text-2xl text-stone ml-1">{stat.suffix}</span>}
      </div>
      <p className="font-sans text-xs uppercase tracking-[0.18em] text-stone">
        {stat.label}
      </p>
    </div>
  );
};

const formatDate = (ts: number) =>
  new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });

const PageCounter = () => {
  const [stats, setStats] = useState<{
    views: number;
    sessions: number;
    first: number;
    last: number;
    daysSinceFirst: number;
  } | null>(null);

  useEffect(() => {
    const now = Date.now();
    const views = Number(localStorage.getItem(STORAGE_KEY) ?? "0") + 1;
    localStorage.setItem(STORAGE_KEY, String(views));

    let sessions = Number(localStorage.getItem(SESSION_KEY) ?? "0");
    const hasSession = sessionStorage.getItem("nova:page-counter:active");
    if (!hasSession) {
      sessions += 1;
      localStorage.setItem(SESSION_KEY, String(sessions));
      sessionStorage.setItem("nova:page-counter:active", "1");
    }

    let first = Number(localStorage.getItem(FIRST_KEY) ?? "0");
    if (!first) {
      first = now;
      localStorage.setItem(FIRST_KEY, String(first));
    }
    localStorage.setItem(LAST_KEY, String(now));

    const daysSinceFirst = Math.max(
      1,
      Math.floor((now - first) / (1000 * 60 * 60 * 24)) + 1,
    );

    setStats({ views, sessions, first, last: now, daysSinceFirst });
  }, []);

  const cards: Stat[] = useMemo(() => {
    if (!stats) return [];
    return [
      { icon: Eye, value: stats.views, label: "Page Views" },
      { icon: Repeat, value: stats.sessions, label: "Sessions" },
      {
        icon: Sparkles,
        value: Math.round((stats.views / stats.sessions) * 10) / 10,
        display: (n) => n.toFixed(1),
        label: "Views / Session",
      },
      {
        icon: CalendarDays,
        value: stats.daysSinceFirst,
        label: "Days Visiting",
      },
      {
        icon: Clock,
        value: 100,
        display: () => formatDate(stats.last),
        label: "Last Visit",
      },
    ];
  }, [stats]);

  return (
    <div className="w-full bg-sand/30 rounded-md p-8 md:p-12">
      <div className="text-center mb-10">
        <p className="font-sans text-xs uppercase tracking-[0.25em] text-stone mb-3">
          Local Activity
        </p>
        <h2 className="font-serif text-3xl md:text-4xl text-ink">
          Tour Visits to Nova
        </h2>
      </div>

      {stats ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {cards.map((s) => (
            <StatCard key={s.label} stat={s} />
          ))}
        </div>
      ) : (
        <div className="h-40 flex items-center justify-center text-stone font-sans text-sm">
          Loading…
        </div>
      )}

      <p className="text-center font-sans text-xs text-stone/70 mt-8">
        Tracked locally in this browser. Refresh to increment.
      </p>
    </div>
  );
};

export default PageCounter;
