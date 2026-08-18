'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

interface StatItem {
  label: string;
  value: number;
  suffix?: string;
  href: string;
  color: 'basket' | 'renang';
}

interface CounterStatsProps {
  stats: StatItem[];
}

function useCountUp(target: number, duration: number = 1800, trigger: boolean = false) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!trigger || target === 0) {
      if (target === 0) setCurrent(0);
      return;
    }

    let startTime: number | null = null;
    const startValue = 0;

    function easeOutCubic(t: number) {
      return 1 - Math.pow(1 - t, 3);
    }

    function step(timestamp: number) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);
      setCurrent(Math.round(startValue + (target - startValue) * easedProgress));
      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }, [target, duration, trigger]);

  return current;
}

function StatCard({ item, trigger }: { item: StatItem; trigger: boolean }) {
  const count = useCountUp(item.value, 1800, trigger);
  const glowClass = item.color === 'basket' ? 'scoreboard-glow-basket' : 'scoreboard-glow-renang';
  const textClass = item.color === 'basket' ? 'text-basket' : 'text-renang';

  return (
    <Link href={item.href} className="scoreboard-card text-center group block cursor-pointer hover:-translate-y-1 transition-transform duration-300">
      <div className={`${glowClass} opacity-0 group-hover:opacity-50 transition-opacity duration-500`} />
      <div className="text-neutral-light/40 text-[10px] font-bold uppercase tracking-[0.25em] mb-3 relative z-10">
        {item.label}
      </div>
      <div className={`scoreboard-value text-5xl md:text-6xl ${textClass} relative z-10`}>
        {count}{item.suffix || ''}
      </div>
    </Link>
  );
}

export default function CounterStats({ stats }: CounterStatsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [triggered, setTriggered] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !triggered) {
          setTriggered(true);
        }
      },
      { threshold: 0.3 }
    );

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [triggered]);

  return (
    <div
      ref={containerRef}
      className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mt-16 md:mt-24 relative z-20"
    >
      {stats.map((item, i) => (
        <StatCard key={i} item={item} trigger={triggered} />
      ))}
    </div>
  );
}
