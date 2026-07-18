import { createSanitizedError } from "../../domain/errors/sanitizedErrors";
import type { ComposerMutationSnapshot } from "./composerMutationService";
import {
  applyComposerTargetTranslation,
  createSafeComposerInsertionTarget
} from "./composerMutationService";
import { copyWithBestEffortRestore } from "./clipboardFallback";
import { detectComposerInsertionTarget } from "./composerTargetDetector";
import { resolveActiveChatScope } from "../whatsapp/messageTextExtractor";

export const copyNonEditableTranslationResult = async (translation: string): Promise<boolean> => {
  const copied = await copyWithBestEffortRestore(translation);
  return copied.copied;
};

export const insertNonEditableTranslationIntoComposer = (input: {
  translation: string;
  sourceChatScope: string;
  rootDocument?: Document;
}): ComposerMutationSnapshot | null => {
  const rootDocument = input.rootDocument ?? document;
  if (resolveActiveChatScope(rootDocument) !== input.sourceChatScope) {
    return null;
  }

  const target = detectComposerInsertionTarget(rootDocument);
  if (!target) {
    return null;
  }

  const insertionTarget = createSafeComposerInsertionTarget(target);
  if (!insertionTarget) {
    return null;
  }

  return applyComposerTargetTranslation(insertionTarget, input.translation);
};

export const createNonEditableInsertionError = () => createSanitizedError("INSERTION_FAILED");
