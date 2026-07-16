# WA Translator

WA Translator adalah project Chrome Extension untuk membantu pengguna memahami dan menulis pesan lintas bahasa di WhatsApp Web. Produk ini menerjemahkan pesan masuk dan teks manual menggunakan AI CLI lokal melalui Native Messaging Host, dengan prinsip utama: original text tetap terlihat, user tetap mengirim secara manual, dan konten pesan tidak disimpan secara persisten.

Status project saat ini: tahap Spec Kit planning sudah dibuat. Implementasi kode inti extension dan native host belum dimulai.

## Source of Truth

Setiap pengerjaan di repository ini harus mengacu ke dokumen berikut sebelum menulis atau mengubah kode:

- `documents/PRD_WA_Translator_v0.2.docx`
- `documents/UIUX_Design_Specification_WA_Translator_v0.2.docx`
- `.specify/memory/constitution.md`
- `specs/001-wa-translator-extension/spec.md`
- `specs/001-wa-translator-extension/plan.md`
- `specs/001-wa-translator-extension/tasks.md`

Catatan Git lokal: dokumen, spec, dan tooling planning disimpan sebagai konteks kerja lokal dan dikecualikan dari push melalui `.git/info/exclude`.

## Product Scope

MVP berfokus pada Google Chrome desktop di Windows dan WhatsApp Web (`https://web.whatsapp.com/*`). Provider awal yang didukung adalah Codex CLI dan Claude Code CLI, dijalankan melalui local companion berbasis Chrome Native Messaging.

Kemampuan utama MVP:

- Automatic incoming translation untuk pesan teks WhatsApp Web yang eligible.
- Display mode: Inline, Tooltip, On demand, dan Off.
- Manual translation untuk teks composer dan selected text.
- Preview-before-replace dan direct replace untuk composer yang valid.
- Undo untuk composer replacement atau insertion yang masih aman diidentifikasi.
- Copy Translation, Retry, Hide, Show Original/Translation, dan Insert into Composer sesuai konteks.
- First-run onboarding, privacy disclosure, local companion validation, provider health check, dan default preferences.
- Clear local data, Reset settings, diagnostics export, dan error recovery yang dapat dipahami user.

Di luar MVP:

- WhatsApp mobile, Firefox, Safari, Edge certification.
- Auto-send, scheduled send, mass messaging, contact scraping, chatbot automation.
- OCR, voice transcription, media translation.
- Persistent translation history, per-chat overrides, glossary management, account sync, billing, atau SaaS multi-tenant.

## Safety and Privacy Rules

Project ini wajib mengikuti aturan berikut:

- Received-message translation harus additive. Original WhatsApp message tidak boleh diganti atau disembunyikan.
- Extension tidak boleh pernah mengaktifkan tombol Send.
- Historical sent/received message bubble tidak boleh dimutasi.
- Source text dan translated text tidak boleh masuk ke persistent extension storage, diagnostics, telemetry, logs, atau installer artifact.
- Translation content hanya boleh berada di memory/session storage untuk perilaku short-lived session.
- Provider request hanya boleh lewat translation-only safe execution profile.
- Prompt injection, command injection, DOM rendering, storage, permission, dan provider execution harus divalidasi dengan test.
- UI harus jelas sebagai produk independen dan tidak boleh terlihat seperti kontrol resmi WhatsApp/Meta.

## Architecture

Project dirancang sebagai Chrome extension plus Windows-first local companion. Pembagian tanggung jawab harus tetap modular dan tidak saling bocor.

```text
extension/
|-- src/
|   |-- background/   # service worker, message routing, native host bridge
|   |-- content/      # WhatsApp DOM adapter, injected UI, composer handling
|   |-- popup/        # daily controls and provider summary
|   |-- options/      # settings, shortcuts, privacy, diagnostics
|   |-- onboarding/   # first-run setup, consent, provider health
|   |-- preview/      # manual translation preview and undo surfaces
|   |-- domain/       # pure business rules and state transitions
|   |-- diagnostics/  # event mapping, redaction, export presentation
|   `-- shared/       # contracts, schemas, i18n, reusable utilities
|
native-host/
|-- src/
|   |-- Host/         # Native Messaging protocol and lifecycle handshake
|   |-- Providers/    # Codex and Claude adapters
|   |-- Security/     # safe execution profile and allowlists
|   `-- Diagnostics/  # redacted host/provider status
|
tests/
|-- contract/
|-- fixtures/
|-- security/
|-- accessibility/
|-- e2e/
`-- performance/
```

## Technology Plan

- Chrome Manifest V3 extension APIs.
- TypeScript 5.x for extension surfaces, domain logic, and shared contracts.
- React + TypeScript for popup, options, onboarding, and preview surfaces.
- Vite for extension build packaging.
- Zod or equivalent schema validation for contract boundaries.
- C# with .NET 8 for the Windows local companion.
- Chrome Native Messaging for extension-to-host communication.
- Codex CLI and Claude Code CLI as externally installed providers.

## Development Workflow

Recommended flow:

1. Read the source-of-truth documents listed above.
2. Check `specs/001-wa-translator-extension/tasks.md`.
3. Implement tasks phase by phase, starting from Setup and Foundational.
4. Deliver US1 first as MVP setup/trust slice.
5. Continue with automatic incoming translation, manual translation, daily controls, then diagnostics/privacy hardening.
6. Run validation for contracts, DOM fixtures, unit tests, component tests, accessibility, Playwright E2E, .NET integration, security, installer lifecycle, and performance gates.

Do not implement features that are outside MVP unless they are explicitly hidden behind disabled development flags.

## Quality Gates

Before a feature is considered complete:

- Contract tests must cover request/response, native messaging, DOM adapter, diagnostics, and UI state boundaries.
- DOM fixture tests must prove WhatsApp Web extraction, anchor handling, stale-result handling, and fail-closed behavior.
- Security tests must prove no persistent message-content storage and no unsafe provider execution.
- Accessibility tests must cover keyboard, focus, screen-reader labels, status labels, theme, zoom, and localization-sensitive content.
- Manual translation tests must prove composer safety, target revalidation, draft preservation, and Undo behavior.
- Diagnostics export must contain no source text, translated text, contact identity, account identifiers, credentials, raw provider stderr, or reversible hashes.

## Current Planning Artifacts

- Feature specification: `specs/001-wa-translator-extension/spec.md`
- Implementation plan: `specs/001-wa-translator-extension/plan.md`
- Research decisions: `specs/001-wa-translator-extension/research.md`
- Data model: `specs/001-wa-translator-extension/data-model.md`
- Contracts: `specs/001-wa-translator-extension/contracts/`
- Task list: `specs/001-wa-translator-extension/tasks.md`

Use these artifacts as planning references. The implementation should still be driven by the source PRD, UI/UX specification, and constitution.
