import { createIncomingTranslationController } from "./translation/incomingTranslationController";

export const bootWhatsAppContentScript = async (rootDocument: Document = document): Promise<void> => {
  if (typeof window === "undefined") {
    return;
  }

  const currentUrl = rootDocument.location?.href ?? window.location.href;
  if (!currentUrl.startsWith("https://web.whatsapp.com/")) {
    return;
  }

  const controller = createIncomingTranslationController();
  await controller.start(rootDocument);
};

void bootWhatsAppContentScript();
