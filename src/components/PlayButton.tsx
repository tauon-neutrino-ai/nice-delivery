interface PlayButtonProps {
  isPlaying: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export default function PlayButton({ isPlaying, onToggle, disabled }: PlayButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-label={isPlaying ? "一時停止" : "再生"}
      className="flex h-16 w-16 items-center justify-center rounded-full bg-(--color-play-blue) text-white shadow-lg shadow-blue-500/30 transition-transform active:scale-95 disabled:opacity-40 disabled:active:scale-100"
    >
      {isPlaying ? (
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
          <rect x="6" y="5" width="4" height="14" rx="1" />
          <rect x="14" y="5" width="4" height="14" rx="1" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-6 w-6 translate-x-0.5" fill="currentColor">
          <path d="M7 4.5v15l13-7.5-13-7.5z" />
        </svg>
      )}
    </button>
  );
}
