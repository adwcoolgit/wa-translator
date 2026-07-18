import { createSanitizedError } from "../../domain/errors/sanitizedErrors";
import { sanitizedErrorCodeSchema } from "../../shared/contracts/diagnostics";
import { presentRecoverableError } from "../../shared/errors/recoverableErrorPresenter";
import type { TranslationRequestState } from "../../domain/translation/requestState";
import type { SanitizedTranslationError } from "../../shared/contracts/translation";
import { mountTranslationPopover, type TranslationPopoverHandle } from "./translationPopover";
import {
  buildTranslationUiState,
  runTranslationAction,
  type TranslationActionHandlers
} from "./translationActions";

export interface TranslationContainerModel {
  anchorId: string;
  mode: "inline" | "tooltip" | "onDemand" | "off";
  requestState: TranslationRequestState;
  translation: string | null;
  error: SanitizedTranslationError | null;
  translationVisible: boolean;
  originalVisible: boolean;
  actions: TranslationActionHandlers;
}

export interface TranslationContainerHandle {
  readonly root: HTMLElement;
  update(model: TranslationContainerModel): void;
  remove(): void;
}

const normalizeRecoverableError = (error: SanitizedTranslationError) => {
  const parsed = sanitizedErrorCodeSchema.safeParse(error.code);
  return createSanitizedError(parsed.success ? parsed.data : "PROVIDER_INVALID_OUTPUT");
};

const appendActionButton = (options: {
  container: HTMLElement;
  label: string;
  onClick?: () => void | Promise<void>;
}): void => {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = options.label;
  button.addEventListener("click", () => {
    void runTranslationAction(options.onClick);
  });
  options.container.append(button);
};

export const createTranslationContainer = (
  messageElement: HTMLElement,
  initialModel: TranslationContainerModel
): TranslationContainerHandle => {
  const root = document.createElement("section");
  const owner = document.createElement("p");
  const status = document.createElement("p");
  const body = document.createElement("div");
  const actions = document.createElement("div");
  const popoverMountPoint = document.createElement("div");
  let popover: TranslationPopoverHandle | null = null;
  let popoverOpen = false;
  let currentTriggerButton: HTMLButtonElement | null = null;

  root.className = "wa-translator-inline-region";
  root.dataset.anchorId = initialModel.anchorId;
  root.dataset.surface = "incoming-translation";
  root.setAttribute("role", "group");
  root.setAttribute("aria-label", "Incoming translation");
  root.tabIndex = -1;
  owner.dataset.translationOwner = "true";
  status.setAttribute("aria-live", "polite");
  body.dataset.translationBody = "true";
  actions.dataset.translationActions = "true";
  popoverMountPoint.dataset.translationPopoverMount = "true";

  root.append(owner, status, body, actions, popoverMountPoint);
  messageElement.append(root);

  const restoreSurfaceFocus = (): void => {
    const fallbackButton = root.querySelector<HTMLButtonElement>("button:not([disabled])");
    const focusTarget = currentTriggerButton?.isConnected ? currentTriggerButton : fallbackButton ?? root;
    focusTarget.focus();
  };

  const ensurePopover = (model: TranslationContainerModel): void => {
    if (model.mode !== "tooltip") {
      const shouldRestoreFocus = popoverOpen;
      popover?.unmount();
      popover = null;
      popoverOpen = false;
      if (shouldRestoreFocus) {
        restoreSurfaceFocus();
      }
      return;
    }

    const popoverProps = {
      anchorId: model.anchorId,
      requestState: model.requestState,
      translation: model.translationVisible ? model.translation : null,
      error: model.error,
      open: popoverOpen,
      onClose: () => {
        popoverOpen = false;
        popover?.update({
          ...popoverProps,
          open: false
        });
        restoreSurfaceFocus();
      },
      actions: model.actions
    };

    if (!popover) {
      popover = mountTranslationPopover(popoverMountPoint, popoverProps);
      return;
    }

    popover.update(popoverProps);
  };

  const render = (model: TranslationContainerModel): void => {
    const uiState = buildTranslationUiState({
      requestState: model.requestState,
      translation: model.translation,
      error: model.error,
      mode: model.mode,
      translationVisible: model.translationVisible,
      originalVisible: model.originalVisible,
      focusRestorationKey: model.anchorId
    });

    root.dataset.mode = model.mode;
    root.dataset.requestState = model.requestState;
    root.dataset.translationVisible = String(model.translationVisible);
    root.dataset.originalVisible = String(model.originalVisible);
    owner.textContent = uiState.ownerLabel ?? "WA Translator";
    status.textContent = uiState.statusText ?? "Waiting for translation.";

    body.replaceChildren();
    actions.replaceChildren();
    currentTriggerButton = null;

    if (uiState.surfaceDescription) {
      const description = document.createElement("p");
      description.dataset.translationDescription = "true";
      description.textContent = uiState.surfaceDescription;
      body.append(description);
    }

    if (model.mode === "tooltip") {
      const trigger = document.createElement("button");
      trigger.type = "button";
      trigger.textContent = popoverOpen ? "Close translation details" : "Open translation details";
      trigger.disabled = model.requestState !== "success" && model.requestState !== "error" && model.requestState !== "stale";
      trigger.addEventListener("click", () => {
        popoverOpen = !popoverOpen;
        ensurePopover(model);
        render({
          ...model
        });
      });
      currentTriggerButton = trigger;
      body.append(trigger);
    } else if (model.translationVisible && model.translation) {
      const translationBody = document.createElement("p");
      translationBody.dataset.translationText = "true";
      translationBody.textContent = model.translation;
      body.append(translationBody);
    }

    if (model.error) {
      const presentation = presentRecoverableError(normalizeRecoverableError(model.error));
      const errorHeading = document.createElement("strong");
      errorHeading.dataset.translationErrorTitle = "true";
      errorHeading.textContent = presentation.title;
      const errorBody = document.createElement("p");
      errorBody.dataset.translationError = "true";
      errorBody.textContent = presentation.body;
      body.append(errorHeading, errorBody);
    }

    if (uiState.requestActionLabel) {
      appendActionButton({
        container: actions,
        label: uiState.requestActionLabel,
        onClick: model.actions.onRequestTranslation
      });
    }

    if (uiState.copyLabel) {
      appendActionButton({
        container: actions,
        label: uiState.copyLabel,
        onClick: model.actions.onCopy
      });
    }

    if (uiState.retryLabel) {
      appendActionButton({
        container: actions,
        label: uiState.retryLabel,
        onClick: model.actions.onRetry
      });
    }

    if (uiState.toggleLabel) {
      appendActionButton({
        container: actions,
        label: uiState.toggleLabel,
        onClick: model.actions.onToggleVisibility
      });
    }

    if (uiState.hideLabel) {
      appendActionButton({
        container: actions,
        label: uiState.hideLabel,
        onClick: model.actions.onHide
      });
    }

    ensurePopover(model);
  };

  render(initialModel);

  return {
    root,
    update(model) {
      render(model);
    },
    remove() {
      popover?.unmount();
      popover = null;
      root.remove();
    }
  };
};




