import { PLAYBACK_RATES } from "@/lib/constants";

interface SpeedControlProps {
  rate: number;
  onChange: (rate: number) => void;
}

export default function SpeedControl({ rate, onChange }: SpeedControlProps) {
  return (
    <div className="flex gap-2 rounded-full bg-(--color-track) p-1">
      {PLAYBACK_RATES.map((r) => {
        const active = r === rate;
        return (
          <button
            key={r}
            type="button"
            onClick={() => onChange(r)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              active
                ? "bg-(--color-orange) text-(--color-card)"
                : "text-(--color-text-muted)"
            }`}
          >
            {r}×
          </button>
        );
      })}
    </div>
  );
}
