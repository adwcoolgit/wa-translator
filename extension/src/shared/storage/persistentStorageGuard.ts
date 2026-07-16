const PROHIBITED_PERSISTENT_FIELD_NAMES = new Set([
  "sourcetext",
  "translation",
  "translatedtext",
  "translationtext",
  "messagetext",
  "rawstderr",
  "conversationtext",
  "translationhistory"
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export class PersistentStorageViolationError extends Error {
  public constructor(public readonly path: string) {
    super(`Persistent storage payload contains prohibited field at ${path}`);
    this.name = "PersistentStorageViolationError";
  }
}

const assertNoSensitiveFields = (value: unknown, path: string): void => {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertNoSensitiveFields(entry, `${path}[${index}]`));
    return;
  }

  if (!isRecord(value)) {
    return;
  }

  for (const [key, entry] of Object.entries(value)) {
    const nextPath = path ? `${path}.${key}` : key;
    if (PROHIBITED_PERSISTENT_FIELD_NAMES.has(key.toLowerCase())) {
      throw new PersistentStorageViolationError(nextPath);
    }

    assertNoSensitiveFields(entry, nextPath);
  }
};

export const assertPersistentStorageSafe = (payload: Record<string, unknown>): Record<string, unknown> => {
  assertNoSensitiveFields(payload, "");
  return payload;
};

export const createPersistentStorageSetPayload = (
  payload: Record<string, unknown>
): Record<string, unknown> => assertPersistentStorageSafe(payload);
