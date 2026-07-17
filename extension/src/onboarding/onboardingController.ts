import { createUnknownProviderHealth, providerHealthSchema, type ProviderHealth } from "../domain/provider/providerHealth";
import { createSettingsRepository, type SettingsRepository } from "../domain/settings/settingsRepository";
import { DEFAULT_PRIVACY_CONSENT_VERSION, createDefaultUserSettings, type UserSettings } from "../domain/settings/userSettings";
import { createSetupDiagnosticsRecorder, type SetupDiagnosticsRecorder } from "../diagnostics/setupDiagnostics";
import { onboardingStateSchema, onboardingStepSchema, type OnboardingState, type OnboardingStep } from "../shared/contracts/uiState";
import { nativeLifecycleResultSchema, type NativeLifecycleResult } from "../shared/contracts/nativeMessaging";
import type { ProviderId } from "../shared/contracts/translation";
import { onboardingRuntimeResponseSchema } from "./runtimeMessages";

export interface OnboardingRuntimeBridge {
  queryLifecycle(): Promise<NativeLifecycleResult>;
  runHealthCheck(provider: ProviderId, settings: UserSettings): Promise<ProviderHealth>;
}

export interface OnboardingViewModel {
  onboarding: OnboardingState;
  lifecycle: NativeLifecycleResult;
  settings: UserSettings;
  providerHealth: Record<ProviderId, ProviderHealth>;
  loading: boolean;
}

const ONBOARDING_STEPS: OnboardingStep[] = ["welcome", "privacy", "companion", "provider", "preferences", "ready"];

const createDefaultLifecycleResult = (): NativeLifecycleResult =>
  nativeLifecycleResultSchema.parse({
    type: "lifecycleResult",
    state: "notDetected",
    hostVersion: null,
    protocolVersion: null,
    extensionIdAllowlistStatus: "unknown",
    integrityStatus: "unknown",
    recoveryAction: "installCompanion"
  });

const cloneViewModel = (viewModel: OnboardingViewModel): OnboardingViewModel => ({
  onboarding: { ...viewModel.onboarding },
  lifecycle: { ...viewModel.lifecycle },
  settings: structuredClone(viewModel.settings),
  providerHealth: {
    codex: { ...viewModel.providerHealth.codex },
    claude: { ...viewModel.providerHealth.claude }
  },
  loading: viewModel.loading
});

const toCurrentProviderHealth = (
  providerHealth: Record<ProviderId, ProviderHealth>,
  provider: ProviderId
): ProviderHealth => providerHealthSchema.parse(providerHealth[provider]);

const createInitialViewModel = (): OnboardingViewModel => {
  const settings = createDefaultUserSettings();

  return {
    onboarding: onboardingStateSchema.parse({
      currentStep: "welcome",
      consentAccepted: false,
      lifecycleState: "notDetected",
      providerStatus: "unknown",
      canContinue: true,
      syntheticHealthCheckOnly: true
    }),
    lifecycle: createDefaultLifecycleResult(),
    settings,
    providerHealth: {
      codex: createUnknownProviderHealth("codex"),
      claude: createUnknownProviderHealth("claude")
    },
    loading: false
  };
};

const getPreviousStep = (step: OnboardingStep): OnboardingStep =>
  ONBOARDING_STEPS[Math.max(ONBOARDING_STEPS.indexOf(step) - 1, 0)];

const restoreOnboardingStep = (step: OnboardingStep): OnboardingStep =>
  step === "ready" ? "preferences" : step;

const canContinueForStep = (viewModel: OnboardingViewModel): boolean => {
  switch (viewModel.onboarding.currentStep) {
    case "welcome":
      return true;
    case "privacy":
      return viewModel.onboarding.consentAccepted;
    case "companion":
      return viewModel.lifecycle.state === "ready";
    case "provider":
      return toCurrentProviderHealth(viewModel.providerHealth, viewModel.settings.providerActive).state === "ready";
    case "preferences":
      return true;
    case "ready":
      return viewModel.onboarding.consentAccepted;
    default: {
      const exhaustiveCheck: never = viewModel.onboarding.currentStep;
      return exhaustiveCheck;
    }
  }
};

const createChromeOnboardingRuntimeBridge = (): OnboardingRuntimeBridge => {
  const sendMessage = async (message: unknown): Promise<unknown> => {
    if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage) {
      throw new Error("chrome.runtime.sendMessage is not available in this environment");
    }

    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        const runtimeError = chrome.runtime.lastError;
        if (runtimeError) {
          reject(new Error(runtimeError.message));
          return;
        }

        resolve(response);
      });
    });
  };

  return {
    async queryLifecycle() {
      const response = onboardingRuntimeResponseSchema.parse(await sendMessage({ type: "onboarding.queryLifecycle" }));

      if (response.type !== "onboarding.queryLifecycle.result") {
        throw new Error(`Unexpected runtime response: ${response.type}`);
      }

      return response.payload;
    },
    async runHealthCheck(provider, settings) {
      const response = onboardingRuntimeResponseSchema.parse(
        await sendMessage({
          type: "onboarding.runHealthCheck",
          provider,
          settings
        })
      );

      if (response.type !== "onboarding.runHealthCheck.result") {
        throw new Error(`Unexpected runtime response: ${response.type}`);
      }

      return response.payload;
    }
  };
};

export class OnboardingController {
  private viewModel = createInitialViewModel();

  public constructor(
    private readonly settingsRepository: SettingsRepository = createSettingsRepository(),
    private readonly runtimeBridge: OnboardingRuntimeBridge = createChromeOnboardingRuntimeBridge(),
    private readonly diagnostics: SetupDiagnosticsRecorder = createSetupDiagnosticsRecorder()
  ) {}

  public snapshot(): OnboardingViewModel {
    return cloneViewModel(this.viewModel);
  }

  public async initialize(): Promise<void> {
    const settings = await this.settingsRepository.initialize();
    const isComplete = settings.onboardingStatus === "complete";
    const isNotStarted = settings.onboardingStatus === "notStarted";
    const currentStep = isComplete
      ? "ready"
      : isNotStarted
        ? "welcome"
        : restoreOnboardingStep(settings.onboardingProgress.currentStep);
    const consentAccepted = isComplete ? true : isNotStarted ? false : settings.onboardingProgress.consentAccepted;

    this.viewModel.settings = settings;
    this.viewModel.onboarding.currentStep = currentStep;
    this.viewModel.onboarding.consentAccepted = consentAccepted;
    this.viewModel.onboarding.syntheticHealthCheckOnly = true;
    this.viewModel.providerHealth[settings.providerActive] = createUnknownProviderHealth(settings.providerActive);
    this.viewModel.onboarding.providerStatus = this.viewModel.providerHealth[settings.providerActive].state;
    this.viewModel.onboarding.lifecycleState = this.viewModel.lifecycle.state;
    this.viewModel.onboarding.canContinue = canContinueForStep(this.viewModel);

    if (!isComplete) {
      this.diagnostics.recordSetupStarted(this.viewModel.onboarding.currentStep);
    }
  }

  public setConsentAccepted(accepted: boolean): void {
    this.viewModel.onboarding.consentAccepted = accepted;
    void this.saveOnboardingProgress();
    this.recomputeState();
  }

  public setProvider(provider: ProviderId): void {
    this.viewModel.settings.providerActive = provider;
    this.viewModel.onboarding.providerStatus = this.viewModel.providerHealth[provider].state;
    this.recomputeState();
  }

  public updatePreference<K extends keyof Pick<
    UserSettings,
    "sourceLanguage" | "targetLanguage" | "styleId" | "incomingMode" | "manualMode"
  >>(key: K, value: UserSettings[K]): void {
    this.viewModel.settings = {
      ...this.viewModel.settings,
      [key]: value
    };
    this.recomputeState();
  }

  public goBack(): void {
    this.viewModel.onboarding.currentStep = getPreviousStep(this.viewModel.onboarding.currentStep);
    void this.saveOnboardingProgress();
    this.recomputeState();
  }

  public async advance(): Promise<void> {
    switch (this.viewModel.onboarding.currentStep) {
      case "welcome":
        this.viewModel.onboarding.currentStep = "privacy";
        break;
      case "privacy":
        if (!this.viewModel.onboarding.consentAccepted) {
          return;
        }

        this.viewModel.onboarding.currentStep = "companion";
        break;
      case "companion":
        if (this.viewModel.lifecycle.state !== "ready") {
          return;
        }

        this.viewModel.onboarding.currentStep = "provider";
        break;
      case "provider":
        if (toCurrentProviderHealth(this.viewModel.providerHealth, this.viewModel.settings.providerActive).state !== "ready") {
          return;
        }

        this.viewModel.onboarding.currentStep = "preferences";
        break;
      case "preferences":
        this.viewModel.settings = await this.settingsRepository.save({
          providerActive: this.viewModel.settings.providerActive,
          sourceLanguage: this.viewModel.settings.sourceLanguage,
          targetLanguage: this.viewModel.settings.targetLanguage,
          styleId: this.viewModel.settings.styleId,
          incomingMode: this.viewModel.settings.incomingMode,
          manualMode: this.viewModel.settings.manualMode
        });
        this.viewModel.onboarding.currentStep = "ready";
        break;
      case "ready":
        await this.complete();
        return;
      default: {
        const exhaustiveCheck: never = this.viewModel.onboarding.currentStep;
        throw new Error(`Unsupported onboarding step: ${String(exhaustiveCheck)}`);
      }
    }

    await this.saveOnboardingProgress();
    this.recomputeState();
  }

  public async refreshLifecycle(): Promise<void> {
    this.viewModel.loading = true;
    this.recomputeState();

    try {
      this.viewModel.lifecycle = await this.runtimeBridge.queryLifecycle();
      this.viewModel.onboarding.lifecycleState = this.viewModel.lifecycle.state;
    } finally {
      this.viewModel.loading = false;
      this.recomputeState();
    }
  }

  public async runSelectedProviderHealthCheck(): Promise<void> {
    this.viewModel.loading = true;
    this.viewModel.providerHealth[this.viewModel.settings.providerActive] = providerHealthSchema.parse({
      ...this.viewModel.providerHealth[this.viewModel.settings.providerActive],
      state: "checking"
    });
    this.recomputeState();

    try {
      const result = await this.runtimeBridge.runHealthCheck(
        this.viewModel.settings.providerActive,
        this.viewModel.settings
      );

      this.viewModel.providerHealth[result.provider] = providerHealthSchema.parse(result);
      this.viewModel.onboarding.providerStatus = result.state;
      this.diagnostics.recordProviderHealthCheck(result);
    } finally {
      this.viewModel.loading = false;
      this.recomputeState();
    }
  }

  public async complete(): Promise<void> {
    const providerHealth = this.viewModel.providerHealth[this.viewModel.settings.providerActive];
    if (providerHealth.state !== "ready") {
      return;
    }

    this.viewModel.settings = await this.settingsRepository.save({
      onboardingStatus: "complete",
      onboardingProgress: {
        currentStep: "ready",
        consentAccepted: true
      },
      privacyConsentVersion: DEFAULT_PRIVACY_CONSENT_VERSION,
      providerActive: this.viewModel.settings.providerActive,
      sourceLanguage: this.viewModel.settings.sourceLanguage,
      targetLanguage: this.viewModel.settings.targetLanguage,
      styleId: this.viewModel.settings.styleId,
      incomingMode: this.viewModel.settings.incomingMode,
      manualMode: this.viewModel.settings.manualMode
    });

    this.viewModel.onboarding.currentStep = onboardingStepSchema.parse("ready");
    this.viewModel.onboarding.consentAccepted = true;
    this.diagnostics.recordSetupCompleted(providerHealth, this.viewModel.lifecycle);
    this.recomputeState();
  }

  private recomputeState(): void {
    this.viewModel.onboarding.lifecycleState = this.viewModel.lifecycle.state;
    this.viewModel.onboarding.providerStatus =
      this.viewModel.providerHealth[this.viewModel.settings.providerActive].state;
    this.viewModel.onboarding.canContinue = canContinueForStep(this.viewModel);
  }

  private async saveOnboardingProgress(): Promise<void> {
    const onboardingStatus =
      this.viewModel.onboarding.currentStep === "welcome" && !this.viewModel.onboarding.consentAccepted
        ? "notStarted"
        : "inProgress";
    const persistedStep =
      this.viewModel.onboarding.currentStep === "ready"
        ? onboardingStepSchema.parse("ready")
        : this.viewModel.onboarding.currentStep;

    this.viewModel.settings = await this.settingsRepository.save({
      onboardingStatus,
      onboardingProgress: {
        currentStep: persistedStep,
        consentAccepted: this.viewModel.onboarding.consentAccepted
      }
    });
  }
}

export const createOnboardingController = (
  settingsRepository?: SettingsRepository,
  runtimeBridge?: OnboardingRuntimeBridge,
  diagnostics?: SetupDiagnosticsRecorder
): OnboardingController => new OnboardingController(settingsRepository, runtimeBridge, diagnostics);
