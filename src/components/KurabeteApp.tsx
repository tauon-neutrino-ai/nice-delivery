"use client";

import { useEffect, useReducer } from "react";
import { AppAction, AppState, SlotState, VideoSlot } from "@/lib/types";
import SquiggleUnderline from "./SquiggleUnderline";
import PickStep from "./PickStep";
import MarkerStep from "./MarkerStep";
import ComparePanel from "./ComparePanel";

const emptySlot: SlotState = { file: null, src: null, marker: null };

const initialState: AppState = {
  step: "pick",
  markTarget: "both",
  model: emptySlot,
  own: emptySlot,
};

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "PICK_FILE":
      return {
        ...state,
        [action.slot]: { file: action.file, src: action.src, marker: null },
      };
    case "GO_TO_MARK":
      return { ...state, step: "mark", markTarget: "both" };
    case "SET_MARKER":
      return {
        ...state,
        [action.slot]: { ...state[action.slot], marker: action.time },
      };
    case "GO_TO_COMPARE":
      return { ...state, step: "compare" };
    case "ADJUST_MARKER":
      return { ...state, step: "mark", markTarget: action.slot };
    case "CHANGE_VIDEO":
      return {
        ...state,
        [action.slot]: { file: action.file, src: action.src, marker: null },
        step: "mark",
        markTarget: action.slot,
      };
    default:
      return state;
  }
}

function useRevokeOnChange(src: string | null) {
  useEffect(() => {
    return () => {
      if (src) URL.revokeObjectURL(src);
    };
  }, [src]);
}

export default function KurabeteApp() {
  const [state, dispatch] = useReducer(reducer, initialState);

  useRevokeOnChange(state.model.src);
  useRevokeOnChange(state.own.src);

  const handlePick = (slot: VideoSlot, file: File) => {
    dispatch({ type: "PICK_FILE", slot, file, src: URL.createObjectURL(file) });
  };

  const handleSetMarker = (slot: VideoSlot, time: number) => {
    dispatch({ type: "SET_MARKER", slot, time });
  };

  const handleAdjustMarker = (slot: VideoSlot) => {
    dispatch({ type: "ADJUST_MARKER", slot });
  };

  const handleChangeVideo = (slot: VideoSlot, file: File) => {
    dispatch({ type: "CHANGE_VIDEO", slot, file, src: URL.createObjectURL(file) });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[--color-bg] p-4">
      <div className="w-full max-w-md rounded-3xl border border-[--color-card-border] bg-[--color-card] p-5 shadow-xl">
        <div className="mb-5 flex flex-col items-center gap-1">
          <h1 className="text-xl font-bold text-[--color-text-primary]">ナイスデリバリー</h1>
          <SquiggleUnderline />
        </div>

        {state.step === "pick" && (
          <PickStep
            model={state.model}
            own={state.own}
            onPick={handlePick}
            onNext={() => dispatch({ type: "GO_TO_MARK" })}
          />
        )}

        {state.step === "mark" && (
          <MarkerStep
            target={state.markTarget}
            model={state.model}
            own={state.own}
            onSetMarker={handleSetMarker}
            onNext={() => dispatch({ type: "GO_TO_COMPARE" })}
          />
        )}

        {state.step === "compare" &&
          state.model.src &&
          state.own.src &&
          state.model.marker !== null &&
          state.own.marker !== null && (
            <ComparePanel
              modelSrc={state.model.src}
              ownSrc={state.own.src}
              modelMarker={state.model.marker}
              ownMarker={state.own.marker}
              onAdjustMarker={handleAdjustMarker}
              onChangeVideo={handleChangeVideo}
            />
          )}
      </div>
    </div>
  );
}
