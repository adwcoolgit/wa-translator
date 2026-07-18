import React, { useEffect, useState } from "react";

import {
  getLocalDataActionDefinition,
  type LocalDataActionId
} from "../../domain/settings/localDataActions";

export interface DestructiveActionDialogProps {
  actionId: LocalDataActionId;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DestructiveActionDialog({
  actionId,
  onCancel,
  onConfirm
}: DestructiveActionDialogProps) {
  const [confirmed, setConfirmed] = useState(false);
  const definition = getLocalDataActionDefinition(actionId);

  useEffect(() => {
    setConfirmed(false);
  }, [actionId]);

  return (
    <div aria-labelledby="destructive-action-title" aria-modal="true" className="options-dialog" role="dialog">
      <div className="onboarding-card">
        <h2 id="destructive-action-title">{definition.title}</h2>
        <p>{definition.description}</p>
        <ul>
          {definition.impactSummary.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <label>
          <input
            checked={confirmed}
            onChange={(event) => {
              setConfirmed(event.currentTarget.checked);
            }}
            type="checkbox"
          />
          {definition.confirmationLabel}
        </label>
        <div>
          <button onClick={onCancel} type="button">
            Cancel
          </button>
          <button disabled={!confirmed} onClick={onConfirm} type="button">
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
