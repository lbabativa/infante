/** Título en varias líneas (sin animación). */
export function MaskText({ lines, className }: { lines: React.ReactNode[]; className?: string }) {
  return (
    <span className={`block ${className ?? ""}`}>
      {lines.map((l, i) => (
        <span key={i} className="block">
          {l}
        </span>
      ))}
    </span>
  );
}
