interface MuteButtonProps {
  muted: boolean;
  onToggle: () => void;
}

export default function MuteButton({ muted, onToggle }: MuteButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={muted ? "音声をオンにする" : "音声をオフにする"}
      className="flex items-center gap-1.5 rounded-full bg-[--color-track] px-3 py-2 text-xs font-semibold text-[--color-text-primary]"
    >
      {muted ? (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
          <path d="M4 9v6h4l5 5V4L8 9H4z" />
          <path
            d="M16.5 8.5l4 4m0-4l-4 4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
          <path d="M4 9v6h4l5 5V4L8 9H4z" />
          <path
            d="M16 8.5a5 5 0 010 7M18.5 6a8.5 8.5 0 010 12"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      )}
      {muted ? "ミュート中" : "音声オン"}
    </button>
  );
}
