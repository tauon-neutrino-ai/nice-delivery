export type Step = "pick" | "mark" | "compare";

export type VideoSlot = "model" | "own";

export type MarkTarget = VideoSlot | "both";

export interface SlotState {
  file: File | null;
  src: string | null;
  marker: number | null;
}

export interface AppState {
  step: Step;
  markTarget: MarkTarget;
  model: SlotState;
  own: SlotState;
}

export type AppAction =
  | { type: "PICK_FILE"; slot: VideoSlot; file: File; src: string }
  | { type: "GO_TO_MARK" }
  | { type: "SET_MARKER"; slot: VideoSlot; time: number }
  | { type: "GO_TO_COMPARE" }
  | { type: "ADJUST_MARKER"; slot: VideoSlot }
  | { type: "CHANGE_VIDEO"; slot: VideoSlot; file: File; src: string };
