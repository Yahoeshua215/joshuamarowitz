import { useSyncExternalStore } from "react";

type GlobeState = {
  /** Drives camera focus + pause; set immediately on select. */
  selectedSlug: string | null;
  /** Drives the modal; opens after the camera fly-to completes. */
  modalSlug: string | null;
  hoveredSlug: string | null;
  paused: boolean;
};

let state: GlobeState = {
  selectedSlug: null,
  modalSlug: null,
  hoveredSlug: null,
  paused: false,
};

const listeners = new Set<() => void>();

// Delay between focusing a satellite and revealing its modal, so the
// camera fly-to animation is visible first.
const MODAL_DELAY_MS = 1500;
let modalTimer: ReturnType<typeof setTimeout> | null = null;

function clearModalTimer() {
  if (modalTimer) {
    clearTimeout(modalTimer);
    modalTimer = null;
  }
}

function emit() {
  for (const listener of listeners) listener();
}

function setState(next: Partial<GlobeState>) {
  state = { ...state, ...next };
  emit();
}

export const globeStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot() {
    return state;
  },
  select(slug: string) {
    clearModalTimer();
    // Focus + pause immediately so the camera starts flying to the satellite.
    setState({ selectedSlug: slug, modalSlug: null, paused: true });
    // Reveal the modal once the fly-to has had time to play out.
    modalTimer = setTimeout(() => {
      if (state.selectedSlug === slug) {
        setState({ modalSlug: slug });
      }
      modalTimer = null;
    }, MODAL_DELAY_MS);
  },
  clear() {
    clearModalTimer();
    setState({ selectedSlug: null, modalSlug: null, paused: false });
  },
  setHovered(slug: string | null) {
    if (state.hoveredSlug === slug) return;
    setState({ hoveredSlug: slug });
  },
};

export function useGlobeStore(): GlobeState {
  return useSyncExternalStore(
    globeStore.subscribe,
    globeStore.getSnapshot,
    globeStore.getSnapshot
  );
}
