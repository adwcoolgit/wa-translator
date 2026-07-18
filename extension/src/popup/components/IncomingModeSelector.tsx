import React from "react";

import type { UserSettings } from "../../domain/settings/userSettings";
import { incomingModeOptions } from "../../domain/settings/settingsViewModel";
import { en } from "../../shared/i18n/en";

export interface IncomingModeSelectorProps {
  disabled?: boolean;
  value: UserSettings["incomingMode"];
  onChange: (value: UserSettings["incomingMode"]) => void;
}

const moveSelection = (
  currentValue: UserSettings["incomingMode"],
  direction: "next" | "previous" | "first" | "last"
): UserSettings["incomingMode"] => {
  const options = incomingModeOptions.map((option) => option.value as UserSettings["incomingMode"]);
  const currentIndex = options.indexOf(currentValue);

  switch (direction) {
    case "first":
      return options[0] ?? currentValue;
    case "last":
      return options[options.length - 1] ?? currentValue;
    case "next":
      return options[(currentIndex + 1 + options.length) % options.length] ?? currentValue;
    case "previous":
      return options[(currentIndex - 1 + options.length) % options.length] ?? currentValue;
    default:
      return currentValue;
  }
};

export function IncomingModeSelector({
  disabled = false,
  value,
  onChange
}: IncomingModeSelectorProps) {
  return (
    <section aria-labelledby="popup-incoming-mode-title">
      <h2 id="popup-incoming-mode-title">{en.popup.incomingModeLabel}</h2>
      <div aria-label={en.popup.incomingModeLabel} role="radiogroup">
        {incomingModeOptions.map((option) => {
          const optionValue = option.value as UserSettings["incomingMode"];
          const selected = optionValue === value;

          return (
            <button
              aria-checked={selected}
              disabled={disabled}
              key={option.value}
              onClick={() => {
                onChange(optionValue);
              }}
              onKeyDown={(event) => {
                if (disabled) {
                  return;
                }

                switch (event.key) {
                  case "ArrowRight":
                  case "ArrowDown":
                    event.preventDefault();
                    onChange(moveSelection(value, "next"));
                    break;
                  case "ArrowLeft":
                  case "ArrowUp":
                    event.preventDefault();
                    onChange(moveSelection(value, "previous"));
                    break;
                  case "Home":
                    event.preventDefault();
                    onChange(moveSelection(value, "first"));
                    break;
                  case "End":
                    event.preventDefault();
                    onChange(moveSelection(value, "last"));
                    break;
                  case " ":
                  case "Enter":
                    event.preventDefault();
                    onChange(optionValue);
                    break;
                  default:
                    break;
                }
              }}
              role="radio"
              tabIndex={selected ? 0 : -1}
              type="button"
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
