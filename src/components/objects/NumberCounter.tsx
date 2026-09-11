import { useEffect, useRef, useState } from "react";
import { Star, Users, Gem, type LucideIcon } from "lucide-react";

type Stat = {
  icon: LucideIcon;
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
  bg: string;
  iconRing: string;
  iconColor: string;
};

const stats: Stat[] = [
  {
    icon: Star,
    value: 97,
    suffix: "%",
    label: "Of our clients recommend us",
    bg: "bg-[#5a1e1c]",
    iconRing: "bg-[#7a2b28]",
    iconColor: "text-[#f5b94a]",
  },
  {
    icon: Users,
    value: 10000,
    suffix: "+",
    label: "Customers we have served",
    bg: "bg-[#1f4a2b]",
    iconRing: "bg-[#2c6238]",
    iconColor: "text-[#f0c08a]",
  },
  {
    icon: Gem,
    value: 30,
    suffix: "+",
    label: "Years of meeting client needs",
    bg: "bg-[#0f3a66]",
    iconRing: "bg-[#1a4d80]",
    iconColor: "text-[#5ec1ff]",
  },
];

function useCountUp(target: number, durationMs = 1800, start = true) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!start) return;
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / durationMs);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, durationMs, start]);

  return value;
}

const StatCard = ({ stat }: { stat: Stat }) => {
  const Icon = stat.icon;
  const count = useCountUp(stat.value);
  return (
    <div
      className={`${stat.bg} rounded-md px-6 py-5 flex items-center gap-4 shadow-sm`}
    >
      <div
        className={`${stat.iconRing} h-14 w-14 rounded-full flex items-center justify-center shrink-0`}
      >
        <Icon className={`${stat.iconColor} h-7 w-7`} strokeWidth={2} />
      </div>
      <div className="text-white">
        <div className="font-sans font-semibold text-3xl leading-none tracking-tight">
          {stat.prefix}
          {count.toLocaleString()}
          {stat.suffix}
        </div>
        <div className="font-sans text-sm font-light text-white/85 mt-1.5">
          {stat.label}
        </div>
      </div>
    </div>
  );
};

const NumberCounter = () => {
  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-5">
      {stats.map((s) => (
        <StatCard key={s.label} stat={s} />
      ))}
    </div>
  );
};

export default NumberCounter;
