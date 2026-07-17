import type { NativeLifecycleResult } from "../../shared/contracts/nativeMessaging";

export interface CompanionStatusCardProps {
  lifecycle: NativeLifecycleResult;
  loading: boolean;
  onRefresh: () => Promise<void> | void;
}

const LIFECYCLE_COPY: Record<NativeLifecycleResult["state"], { label: string; description: string }> = {
  notDetected: {
    label: "Companion not detected",
    description: "Install the Windows local companion before any provider can be used."
  },
  downloadAvailable: {
    label: "Download available",
    description: "Companion package is available and waiting for installation."
  },
  downloadStarted: {
    label: "Download started",
    description: "Companion download has started. Wait until installation completes."
  },
  waitingForInstallation: {
    label: "Waiting for installation",
    description: "Installer has not completed yet. Continue after the companion is registered."
  },
  ready: {
    label: "Companion ready",
    description: "The local companion is detected, compatible, and ready for synthetic provider checks."
  },
  incompatible: {
    label: "Companion outdated",
    description: "Update the local companion so the protocol and extension version match."
  },
  registrationFailed: {
    label: "Registration failed",
    description: "Chrome could not validate the native host registration for this extension."
  },
  permissionIssue: {
    label: "Permission issue",
    description: "Chrome can see the companion, but permission or access checks blocked the connection."
  },
  integrityFailed: {
    label: "Integrity failed",
    description: "Companion integrity verification failed. Reinstall or update the signed package."
  },
  uninstallRequired: {
    label: "Uninstall required",
    description: "A clean uninstall is required before the companion can be reinstalled safely."
  }
};

export function CompanionStatusCard({
  lifecycle,
  loading,
  onRefresh
}: CompanionStatusCardProps) {
  const copy = LIFECYCLE_COPY[lifecycle.state];

  return (
    <section aria-labelledby="companion-status-title" className="onboarding-card">
      <h2 id="companion-status-title">Local companion readiness</h2>
      <p>{copy.description}</p>
      <dl>
        <div>
          <dt>Status</dt>
          <dd>{copy.label}</dd>
        </div>
        <div>
          <dt>Host version</dt>
          <dd>{lifecycle.hostVersion ?? "Not available"}</dd>
        </div>
        <div>
          <dt>Protocol version</dt>
          <dd>{lifecycle.protocolVersion ?? "Not available"}</dd>
        </div>
        <div>
          <dt>Recovery action</dt>
          <dd>{lifecycle.recoveryAction ?? "None"}</dd>
        </div>
      </dl>
      <button disabled={loading} onClick={() => void onRefresh()} type="button">
        {loading ? "Checking companion..." : "Refresh companion status"}
      </button>
    </section>
  );
}
