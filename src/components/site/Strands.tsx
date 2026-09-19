"use client";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useEffect, useMemo } from "react";

// Pseudo-aleatorio determinista para que servidor y cliente dibujen lo mismo.
// Entero puro (mulberry32) + redondeo: evita diferencias de coma flotante en la hidratación.
function rand(seed: number) {
  let t = (seed * 0x6d2b79f5) >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return Math.round((((t ^ (t >>> 14)) >>> 0) / 4294967296) * 1000) / 1000;
}
const r = (n: number) => Math.round(n * 10) / 10;

/** Hebras de cabello que se dibujan solas y reaccionan al cursor: el sello visual de la marca. */
export function Strands({ count = 34, className }: { count?: number; className?: string }) {
  const paths = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const r1 = rand(i + 1);
        const r2 = rand(i + 101);
        const r3 = rand(i + 201);
        const y0 = r(980 + r1 * 120);
        const x0 = r(-120 + i * 24 + r2 * 40);
        const x3 = r(700 + i * 34 + r3 * 120);
        const y3 = r(-80 - r1 * 120);
        const c1 = `${r(x0 + 380 + r2 * 200)} ${r(y0 - 180 - r3 * 160)}`;
        const c2 = `${r(x3 - 700 - r1 * 260)} ${r(y3 + 520 + r2 * 200)}`;
        return {
          d: `M ${x0} ${y0} C ${c1}, ${c2}, ${x3} ${y3}`,
          w: r(0.4 + r3 * 1.1),
          o: r(0.12 + r1 * 0.5),
          gold: i % 5 === 0,
          delay: 0.2 + i * 0.035,
        };
      }),
    [count]
  );

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 40, damping: 18 });
  const sy = useSpring(my, { stiffness: 40, damping: 18 });
  const tx = useTransform(sx, (v) => v * 30);
  const ty = useTransform(sy, (v) => v * 20);
  const rot = useTransform(sx, (v) => v * 2);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      mx.set(e.clientX / window.innerWidth - 0.5);
      my.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [mx, my]);

  return (
    <motion.svg
      viewBox="0 0 1600 1000"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      style={{ x: tx, y: ty, rotate: rot }}
      aria-hidden
    >
      <defs>
        <linearGradient id="strand-gold" x1="0" x2="1" y1="1" y2="0">
          <stop offset="0" stopColor="#c9a877" stopOpacity="0" />
          <stop offset="0.45" stopColor="#e2c9a0" />
          <stop offset="1" stopColor="#c9a877" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="strand-ivory" x1="0" x2="1" y1="1" y2="0">
          <stop offset="0" stopColor="#f4efe7" stopOpacity="0" />
          <stop offset="0.5" stopColor="#f4efe7" />
          <stop offset="1" stopColor="#f4efe7" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g className="strand-sway">
        {paths.map((p, i) => (
          <motion.path
            key={i}
            d={p.d}
            fill="none"
            stroke={p.gold ? "url(#strand-gold)" : "url(#strand-ivory)"}
            strokeWidth={p.gold ? p.w * 1.6 : p.w}
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: p.gold ? Math.min(1, p.o * 2) : p.o }}
            transition={{ duration: 2.6, delay: p.delay, ease: [0.22, 1, 0.36, 1] }}
          />
        ))}
      </g>
      <style>{`
        .strand-sway { transform-origin: 20% 100%; animation: sway 14s ease-in-out infinite alternate; }
        @keyframes sway { from { transform: skewX(-2deg) rotate(-.6deg); } to { transform: skewX(2.5deg) rotate(.8deg); } }
      `}</style>
    </motion.svg>
  );
}
