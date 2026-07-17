import type { TranslationRequestState } from "../../domain/translation/requestState";
import type { SanitizedTranslationError } from "../../shared/contracts/translation";
import { mountTranslationPopover, type TranslationPopoverHandle } from "./translationPopover";
import { buildTranslationActionState, runTranslationAction, type TranslationActionHandlers } from "./translationActions";

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

const describeState = (model: TranslationContainerModel): string => {
  switch (model.requestState) {
    case "queued":
      return "Translation queued.";
    case "processing":
      return "Translating message.";
    case "validating":
      return "Validating translation output.";
    case "success":
      return model.mode === "tooltip"
        ? "Translation ready. Open details to inspect it."
        : "Translation ready.";
    case "error":
      return model.error ? `Translation failed: ${model.error.code}.` : "Translation failed.";
    case "stale":
      return "Translation result is stale.";
    case "cancelled":
      return "Translation cancelled.";
    case "dropped":
      return "Translation dropped because the queue is full.";
    default:
      return model.mode === "onDemand"
        ? "Translate this message only when you ask."
        : model.mode === "off"
          ? "Incoming translation is disabled."
          : "Waiting for translation.";
  }
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
  const status = document.createElement("p");
  const body = document.createElement("div");
  const actions = document.createElement("div");
  const popoverMountPoint = document.createElement("div");
  let popover: TranslationPopoverHandle | null = null;
  let popoverOpen = false;

  root.className = "wa-translator-inline-region";
  root.dataset.anchorId = initialModel.anchorId;
  root.dataset.surface = "incoming-translation";
  root.setAttribute("role", "group");
  root.setAttribute("aria-label", "Incoming translation");
  status.setAttribute("aria-live", "polite");
  body.dataset.translationBody = "true";
  actions.dataset.translationActions = "true";
  popoverMountPoint.dataset.translationPopoverMount = "true";

  root.append(status, body, actions, popoverMountPoint);
  messageElement.append(root);

  const ensurePopover = (model: TranslationContainerModel): void => {
    if (model.mode !== "tooltip") {
      popover?.unmount();
      popover = null;
      popoverOpen = false;
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
    const actionState = buildTranslationActionState({
      requestState: model.requestState,
      translation: model.translation,
      error: model.error,
      mode: model.mode
    });

    root.dataset.mode = model.mode;
    root.dataset.requestState = model.requestState;
    root.dataset.translationVisible = String(model.translationVisible);
    root.dataset.originalVisible = String(model.originalVisible);
    status.textContent = describeState(model);

    body.replaceChildren();
    actions.replaceChildren();

    if (model.mode === "tooltip") {
      const trigger = document.createElement("button");
      trigger.type = "button";
      trigger.textContent = popoverOpen ? "Hide translation" : "Show translation";
      trigger.disabled = model.requestState !== "success" && model.requestState !== "error";
      trigger.addEventListener("click", () => {
        popoverOpen = !popoverOpen;
        ensurePopover(model);
        render({
          ...model
        });
      });
      body.append(trigger);
    } else if (model.translationVisible && model.translation) {
      const translationBody = document.createElement("p");
      translationBody.dataset.translationText = "true";
      translationBody.textContent = model.translation;
      body.append(translationBody);
    }

    if (model.error) {
      const errorBody = document.createElement("p");
      errorBody.dataset.translationError = "true";
      errorBody.textContent = `Recovery: ${model.error.recoveryAction}`;
      body.append(errorBody);
    }

    if (actionState.canRequestTranslation) {
      appendActionButton({
        container: actions,
        label: "Translate",
        onClick: model.actions.onRequestTranslation
      });
    }

    if (actionState.canCopy) {
      appendActionButton({
        container: actions,
        label: "Copy translation",
        onClick: model.actions.onCopy
      });
    }

    if (actionState.canRetry) {
      appendActionButton({
        container: actions,
        label: "Retry",
        onClick: model.actions.onRetry
      });
    }

    if (actionState.canToggleVisibility) {
      appendActionButton({
        container: actions,
        label: model.translationVisible ? "Show original only" : "Show translation",
        onClick: model.actions.onToggleVisibility
      });
    }

    if (actionState.canHide) {
      appendActionButton({
        container: actions,
        label: "Hide",
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
