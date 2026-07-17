import { z } from "zod";

import { providerHealthSchema } from "../domain/provider/providerHealth";
import { userSettingsSchema } from "../domain/settings/userSettings";
import { nativeLifecycleResultSchema } from "../shared/contracts/nativeMessaging";
import { providerSchema } from "../shared/contracts/translation";

export const onboardingRuntimeRequestSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("onboarding.queryLifecycle") }).strict(),
  z
    .object({
      type: z.literal("onboarding.runHealthCheck"),
      provider: providerSchema,
      settings: userSettingsSchema
    })
    .strict()
]);

export const onboardingRuntimeResponseSchema = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("onboarding.queryLifecycle.result"),
      payload: nativeLifecycleResultSchema
    })
    .strict(),
  z
    .object({
      type: z.literal("onboarding.runHealthCheck.result"),
      payload: providerHealthSchema
    })
    .strict()
]);

export type OnboardingRuntimeRequest = z.infer<typeof onboardingRuntimeRequestSchema>;
export type OnboardingRuntimeResponse = z.infer<typeof onboardingRuntimeResponseSchema>;
