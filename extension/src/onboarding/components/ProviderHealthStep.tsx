import type { ProviderHealth } from "../../domain/provider/providerHealth";
import type { ProviderId } from "../../shared/contracts/translation";

export interface ProviderHealthStepProps {
  selectedProvider: ProviderId;
  providerHealth: Record<ProviderId, ProviderHealth>;
  loading: boolean;
  onProviderChange: (provider: ProviderId) => void;
  onRunHealthCheck: () => Promise<void> | void;
}

const PROVIDER_LABELS: Record<ProviderId, string> = {
  codex: "Codex CLI",
  claude: "Claude Code CLI"
};

export function ProviderHealthStep({
  selectedProvider,
  providerHealth,
  loading,
  onProviderChange,
  onRunHealthCheck
}: ProviderHealthStepProps) {
  const currentHealth = providerHealth[selectedProvider];

  return (
    <section aria-labelledby="provider-health-title" className="onboarding-card">
      <h2 id="provider-health-title">Provider selection and health check</h2>
      <p>
        Health check ini hanya memakai synthetic sample text. Tidak ada isi chat WhatsApp yang
        dikirim selama onboarding belum selesai.
      </p>

      <fieldset>
        <legend>Select provider</legend>
        {(["codex", "claude"] as const).map((provider) => (
          <label key={provider}>
            <input
              checked={selectedProvider === provider}
              name="provider"
              onChange={() => onProviderChange(provider)}
              type="radio"
              value={provider}
            />{" "}
            {PROVIDER_LABELS[provider]}
          </label>
        ))}
      </fieldset>

      <dl>
        <div>
          <dt>Current provider</dt>
          <dd>{PROVIDER_LABELS[selectedProvider]}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{currentHealth.state}</dd>
        </div>
        <div>
          <dt>Version category</dt>
          <dd>{currentHealth.versionCategory ?? "Not checked yet"}</dd>
        </div>
        <div>
          <dt>Latency bucket</dt>
          <dd>{currentHealth.lastLatencyBucket ?? "Not checked yet"}</dd>
        </div>
      </dl>

      <button disabled={loading} onClick={() => void onRunHealthCheck()} type="button">
        {loading ? "Running synthetic health check..." : "Run synthetic health check"}
      </button>
    </section>
  );
}
