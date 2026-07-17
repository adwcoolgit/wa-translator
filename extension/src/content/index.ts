import { createIncomingTranslationController } from "./translation/incomingTranslationController";
import { createManualTranslationController } from "./manual/manualTranslationController";

export const bootWhatsAppContentScript = async (rootDocument: Document = document): Promise<void> => {
  if (typeof window === "undefined") {
    return;
  }

  const currentUrl = rootDocument.location?.href ?? window.location.href;
  if (!currentUrl.startsWith("https://web.whatsapp.com/")) {
    return;
  }

  const controller = createIncomingTranslationController();
  const manualController = createManualTranslationController();
  await controller.start(rootDocument);
  await manualController.start(rootDocument);
};

void bootWhatsAppContentScript();
