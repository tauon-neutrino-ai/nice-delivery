"use client";

import { ChangeEvent } from "react";
import { SlotState, VideoSlot } from "@/lib/types";

interface PickStepProps {
  model: SlotState;
  own: SlotState;
  onPick: (slot: VideoSlot, file: File) => void;
  onNext: () => void;
}

function SlotPicker({
  slot,
  label,
  accent,
  state,
  onPick,
}: {
  slot: VideoSlot;
  label: string;
  accent: "cyan" | "orange";
  state: SlotState;
  onPick: (slot: VideoSlot, file: File) => void;
}) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onPick(slot, file);
  };

  const borderClass = accent === "cyan" ? "border-[--color-cyan]" : "border-[--color-orange]";
  const textClass = accent === "cyan" ? "text-[--color-cyan]" : "text-[--color-orange]";

  return (
    <label
      className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed ${borderClass} bg-black/20 px-4 py-8 text-center`}
    >
      <span className={`text-sm font-bold ${textClass}`}>{label}</span>
      <span className="text-xs text-[--color-text-muted]">
        {state.file ? state.file.name : "動画を選択してください"}
      </span>
      <input type="file" accept="video/*" className="hidden" onChange={handleChange} />
    </label>
  );
}

export default function PickStep({ model, own, onPick, onNext }: PickStepProps) {
  const canProceed = Boolean(model.file && own.file);

  return (
    <div className="flex flex-col gap-4">
      <SlotPicker slot="model" label="お手本" accent="cyan" state={model} onPick={onPick} />
      <SlotPicker slot="own" label="参加者" accent="orange" state={own} onPick={onPick} />
      <button
        type="button"
        onClick={onNext}
        disabled={!canProceed}
        className="rounded-full bg-[--color-play-blue] py-3 text-sm font-bold text-white disabled:opacity-30"
      >
        次へ
      </button>
    </div>
  );
}
