import { z } from "zod";

export const translationRequestStateSchema = z.enum([
  "idle",
  "queued",
  "processing",
  "validating",
  "success",
  "error",
  "stale",
  "cancelled",
  "dropped"
]);

export const requestPrioritySchema = z.enum(["manual", "visibleIncoming", "backgroundIncoming"]);

export type TranslationRequestState = z.infer<typeof translationRequestStateSchema>;
export type RequestPriority = z.infer<typeof requestPrioritySchema>;

const transitionMap: Record<TranslationRequestState, readonly TranslationRequestState[]> = {
  idle: ["queued"],
  queued: ["processing", "stale", "cancelled", "dropped", "error"],
  processing: ["validating", "stale", "cancelled", "error"],
  validating: ["success", "stale", "cancelled", "error"],
  success: [],
  error: [],
  stale: [],
  cancelled: [],
  dropped: []
};

export const terminalRequestStates = new Set<TranslationRequestState>([
  "success",
  "error",
  "stale",
  "cancelled",
  "dropped"
]);

export const requestPriorityWeights: Record<RequestPriority, number> = {
  manual: 3,
  visibleIncoming: 2,
  backgroundIncoming: 1
};

export const canTransitionRequestState = (
  current: TranslationRequestState,
  next: TranslationRequestState
): boolean => transitionMap[current].includes(next);

export const transitionRequestState = (
  current: TranslationRequestState,
  next: TranslationRequestState
): TranslationRequestState => {
  if (!canTransitionRequestState(current, next)) {
    throw new Error(`Invalid translation request state transition: ${current} -> ${next}`);
  }

  return next;
};

export const isTerminalRequestState = (state: TranslationRequestState): boolean =>
  terminalRequestStates.has(state);

export const getRequestPriority = (input: {
  mode: "incoming" | "manual";
  isVisibleChatRequest: boolean;
}): RequestPriority => {
  if (input.mode === "manual") {
    return "manual";
  }

  return input.isVisibleChatRequest ? "visibleIncoming" : "backgroundIncoming";
};

export const shouldDropOldestAutomaticRequest = (queueLength: number, maxPending: number): boolean =>
  queueLength >= maxPending;
