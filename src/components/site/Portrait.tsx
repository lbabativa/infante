import { initials } from "@/lib/format";

/** Foto del especialista; si aún no hay foto, un retrato tipográfico generativo. */
export function Portrait({
  name,
  photo,
  index = 0,
  className = "",
}: {
  name: string;
  photo?: string | null;
  index?: number;
  className?: string;
}) {
  if (photo)
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photo}
        alt={name}
        className={`h-full w-full object-cover grayscale transition duration-700 group-hover:scale-105 group-hover:grayscale-0 ${className}`}
      />
    );
  const hue = [28, 18, 36, 12, 40][index % 5];
  return (
    <div
      className={`@container relative flex h-full w-full items-center justify-center overflow-hidden transition duration-700 group-hover:scale-105 ${className}`}
      style={{
        background: `radial-gradient(120% 90% at ${30 + ((index * 17) % 40)}% 20%, hsl(${hue} 30% 26%), hsl(${hue} 18% 9%) 70%)`,
      }}
    >
      <svg viewBox="0 0 300 400" className="absolute inset-0 h-full w-full opacity-40" preserveAspectRatio="none" aria-hidden>
        {Array.from({ length: 14 }, (_, i) => (
          <path
            key={i}
            d={`M ${-20 + i * 26} 420 C ${80 + i * 10} ${300 - (index % 3) * 40}, ${120 + i * 6} ${120 + i * 4}, ${210 + i * 12} -20`}
            fill="none"
            stroke={i % 4 === 0 ? "#c9a877" : "#f4efe7"}
            strokeOpacity={0.15 + (i % 3) * 0.12}
            strokeWidth={0.6}
          />
        ))}
      </svg>
      <span className="text-outline relative font-display text-[44cqw] italic leading-none">{initials(name)}</span>
    </div>
  );
}
