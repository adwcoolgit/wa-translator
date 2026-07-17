# WA Translator

WA Translator adalah Chrome Extension untuk WhatsApp Web yang membantu pengguna memahami pesan masuk dan menerjemahkan teks secara manual dengan provider AI CLI lokal melalui Windows Native Messaging Host. Prinsip produk ini tetap sama seperti di PRD dan UI/UX spec: original text harus tetap terlihat, user tetap mengirim pesan secara manual, dan konten pesan tidak boleh disimpan secara persisten.

## Status Repo

Status implementasi saat ini:

- Shared infrastructure, contracts, domain boundaries, dan baseline test harness sudah tersedia.
- First-time onboarding, privacy disclosure, local companion readiness, dan provider health check sudah diimplementasikan.
- Automatic incoming translation, manual translation, popup/options controls, privacy/diagnostics, dan Windows companion lifecycle sudah memiliki implementasi dasar dan automated validation.
- Cross-cutting validation Phase 8 sudah ditambahkan untuk lint, typecheck, build, unit/component/contract/security/performance test, serta .NET installer/integration test.
- Windows setup executable untuk local companion sudah tersedia untuk controlled validation.

Catatan release saat ini:

- Repo sudah siap untuk controlled validation.
- Harness end-to-end Chrome extension pada WhatsApp Web masih perlu diselesaikan untuk coverage browser-live penuh.
- Manual accessibility audit untuk screen reader, zoom 80%-200%, dan RTL/CJK masih merupakan release prerequisite.

## Source of Truth

Sebelum mengubah kode, review, atau membuat issue di repo ini, selalu baca dokumen berikut:

- `documents/PRD_WA_Translator_v0.2.docx`
- `documents/UIUX_Design_Specification_WA_Translator_v0.2.docx`
- `.specify/memory/constitution.md`
- `specs/001-wa-translator-extension/spec.md`
- `specs/001-wa-translator-extension/plan.md`
- `specs/001-wa-translator-extension/tasks.md`

Catatan workflow lokal:

- Planning artifacts, documents, dan beberapa hasil validasi lokal sengaja dikecualikan dari push melalui `.git/info/exclude`.
- Setiap phase implementasi wajib memiliki GitHub issue yang sesuai.
- Untuk pekerjaan yang akan dibuat PR, gunakan feature branch dan jangan langsung push ke `main`.

## Product Scope

MVP saat ini dibatasi pada:

- Google Chrome desktop
- Windows-first local companion
- WhatsApp Web di `https://web.whatsapp.com/*`
- Provider awal: Codex CLI dan Claude Code CLI

Kemampuan utama yang sudah menjadi target implementasi repo:

- First-run onboarding dengan privacy disclosure dan consent gating
- Local companion validation dan synthetic provider health check
- Automatic incoming translation untuk pesan eligible
- Incoming modes: Inline, Tooltip, On demand, dan Off
- Manual translation untuk composer dan selected text
- Preview-before-replace, direct replace, copy, insert into composer, dan undo
- Popup dan options untuk daily controls, provider status, privacy, dan diagnostics
- Recoverable error flows, diagnostics export, reset settings, dan clear local data
- Windows native host lifecycle: install, registration, version/integrity check, rollback guidance, dan uninstall

Di luar MVP:

- WhatsApp mobile app support
- Non-Chrome browser certification
- Auto-send, scheduled send, mass messaging, contact scraping, chatbot automation
- OCR, voice transcription, media translation
- Persistent translation history, account sync, billing, team admin, atau per-chat production overrides

## Safety and Privacy Invariants

Semua perubahan kode harus menjaga invariants berikut:

- Received-message translation selalu additive; original WhatsApp content tidak boleh diganti atau disembunyikan.
- Extension tidak boleh mengaktifkan tombol Send atau memicu auto-send.
- Historical sent/received message bubble tidak boleh dimutasi.
- Source text dan translated text tidak boleh masuk ke persistent storage, telemetry, diagnostics export, logs, atau installer artifact.
- Translation content hanya boleh hidup di memory/session storage sesuai perilaku session-limited.
- Provider request hanya boleh dijalankan melalui translation-only safe execution profile.
- UI harus jelas sebagai produk independen dan tidak boleh terlihat sebagai kontrol resmi WhatsApp atau Meta.

## Repository Structure

```text
extension/
|-- public/                # manifest dan static extension assets
|-- src/
|   |-- background/        # service worker, routing, native host bridge
|   |-- content/           # WhatsApp DOM adapter, injected UI, composer logic
|   |-- popup/             # daily controls
|   |-- options/           # settings, privacy, diagnostics, shortcuts
|   |-- onboarding/        # consent, setup, provider health
|   |-- preview/           # manual translation preview / undo surface
|   |-- domain/            # business rules, queueing, settings, manual flows
|   |-- diagnostics/       # redaction, event shaping, export logic
|   `-- shared/            # contracts, schemas, storage guards, i18n, utilities
|-- tests/                 # extension-local unit/component tests
|-- vite.config.ts
|-- eslint.config.mjs
`-- package.json

native-host/
|-- src/
|   |-- Host/              # Native Messaging protocol and lifecycle
|   |-- Providers/         # Codex/Claude adapters and normalization
|   |-- Security/          # safe execution profile, integrity, allowlist checks
|   |-- Diagnostics/       # redacted host-side diagnostics
|   `-- Setup/             # Windows setup executable for local companion install/uninstall
`-- tests/                 # installer and integration coverage

tests/
|-- accessibility/         # root accessibility suites and audit notes
|-- contract/              # contract validation
|-- e2e/                   # Playwright placeholders / future browser-live coverage
|-- fixtures/              # WhatsApp DOM and synthetic fixture coverage
|-- performance/           # benchmark suites
`-- security/              # privacy, DOM fail-closed, diagnostics, no-auto-send
```

## Tech Stack

- Chrome Manifest V3
- TypeScript 5.x
- React 19
- Vite 7
- Vitest
- ESLint 9 flat config
- Zod 4
- C# / .NET 8
- Chrome Native Messaging
- Codex CLI dan Claude Code CLI sebagai provider eksternal

## Local Setup

### Prerequisites

Pastikan environment berikut sudah tersedia:

- Windows + Google Chrome desktop
- Node.js + npm
- .NET SDK dengan target `net8.0`
- Codex CLI dan/atau Claude Code CLI yang sudah di-install dan di-authenticate di luar extension

### Install / Setup Step by Step

#### 1. Clone repo dan masuk ke workspace

```powershell
cd D:\Personal\Programming\Vibe Engineering
git clone https://github.com/adwcoolgit/wa-translator.git
cd wa-translator
```

#### 2. Install dependency extension

```powershell
cd extension
npm install
cd ..
```

#### 3. Build extension

```powershell
cd extension
npm run build
cd ..
```

Output build extension akan tersedia di:

- `extension/dist/`

#### 4. Build native host dan setup executable

```powershell
cd native-host
dotnet build WaTranslator.Host.sln -c Release -m:1 -p:UseSharedCompilation=false
cd ..
```

Output penting setelah build:

- native host: `native-host/src/Host/bin/Release/net8.0/`
- setup executable project: `native-host/src/Setup/bin/Release/net8.0/`
- bundle setup lokal siap pakai: `artifacts/native-host/setup/` bila Anda membuat packaging lokal sendiri

#### 5. Load extension sebagai unpacked extension di Chrome

1. Buka `chrome://extensions/`
2. Aktifkan `Developer mode`
3. Klik `Load unpacked`
4. Pilih folder `extension/dist`
5. Setelah extension muncul, copy `Extension ID` yang diberikan oleh Chrome

Extension ID ini diperlukan untuk setup executable dan manifest Native Messaging.

#### 6. Jalankan setup executable

Executable setup yang bisa dipakai:

- `native-host\src\Setup\bin\Release\net8.0\WaTranslator.Setup.exe`
- `artifacts\native-host\setup\WaTranslator.Setup.exe` bila Anda sudah membuat bundle lokal sendiri

Cara pakai default:

```powershell
native-host\src\Setup\bin\Release\net8.0\WaTranslator.Setup.exe install --extension-id <CHROME_EXTENSION_ID>
```

Perintah ini akan:

- copy payload host ke `%LOCALAPPDATA%\WA Translator\host`
- membuat manifest `com.adwcoolgit.wa_translator.json`
- mendaftarkan manifest ke `HKCU\Software\Google\Chrome\NativeMessagingHosts\com.adwcoolgit.wa_translator`

Opsi penting yang didukung:

```powershell
native-host\src\Setup\bin\Release\net8.0\WaTranslator.Setup.exe install --extension-id <CHROME_EXTENSION_ID> --install-root <CUSTOM_DIR>
native-host\src\Setup\bin\Release\net8.0\WaTranslator.Setup.exe install --extension-id <CHROME_EXTENSION_ID> --host-source <HOST_BUILD_DIR>
native-host\src\Setup\bin\Release\net8.0\WaTranslator.Setup.exe uninstall
```

Catatan:

- bila `--extension-id` tidak diberikan, setup executable akan meminta input interaktif
- default install root adalah `%LOCALAPPDATA%\WA Translator`
- executable hasil build repo bisa dipakai langsung dari output `Release`
- bila Anda memakai `artifacts\native-host\setup\`, anggap itu sebagai output packaging lokal yang harus Anda generate sendiri

#### 7. Verifikasi hasil setup executable

Pastikan output setup menunjukkan:

- `Host exe`
- `Manifest`
- `Registry key`
- `Extension ID`

Quick check manual:

```powershell
Get-Item 'HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.adwcoolgit.wa_translator'
Get-Content "$env:LOCALAPPDATA\WA Translator\Google\Chrome\NativeMessagingHosts\com.adwcoolgit.wa_translator.json"
```

#### 8. Fallback manual setup (bila tidak memakai executable)

Contoh struktur install lokal:

- root install: `%LOCALAPPDATA%\WA Translator`
- executable host: `%LOCALAPPDATA%\WA Translator\host\WaTranslator.Host.exe`
- manifest path: `%LOCALAPPDATA%\WA Translator\Google\Chrome\NativeMessagingHosts\com.adwcoolgit.wa_translator.json`

Contoh penyalinan artifact native host:

```powershell
$RootDir = Join-Path $env:LOCALAPPDATA 'WA Translator'
$HostDir = Join-Path $RootDir 'host'
$ManifestDir = Join-Path $RootDir 'Google\Chrome\NativeMessagingHosts'

New-Item -ItemType Directory -Force -Path $HostDir | Out-Null
New-Item -ItemType Directory -Force -Path $ManifestDir | Out-Null
Copy-Item 'native-host\src\Host\bin\Release\net8.0\*' $HostDir -Recurse -Force
```

#### 9. Buat manifest Native Messaging secara manual

Nama manifest yang dipakai repo ini adalah:

- `com.adwcoolgit.wa_translator.json`

Isi manifest harus menunjuk ke executable host dan mengizinkan origin extension yang baru di-load.

Contoh pembuatan manifest dengan PowerShell:

```powershell
$RootDir = Join-Path $env:LOCALAPPDATA 'WA Translator'
$HostDir = Join-Path $RootDir 'host'
$ManifestDir = Join-Path $RootDir 'Google\Chrome\NativeMessagingHosts'
$ManifestPath = Join-Path $ManifestDir 'com.adwcoolgit.wa_translator.json'
$HostExe = Join-Path $HostDir 'WaTranslator.Host.exe'
$ExtensionId = 'PASTE_EXTENSION_ID_DI_SINI'

$Manifest = @{
  name = 'com.adwcoolgit.wa_translator'
  description = 'WA Translator native messaging host'
  path = $HostExe
  type = 'stdio'
  allowed_origins = @("chrome-extension://$ExtensionId/")
}

$Manifest | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $ManifestPath
```

#### 10. Register manifest ke Chrome Native Messaging (Current User)

Registry key yang dipakai:

- `HKCU\Software\Google\Chrome\NativeMessagingHosts\com.adwcoolgit.wa_translator`

Contoh registrasi dengan PowerShell:

```powershell
$ManifestPath = Join-Path (Join-Path $env:LOCALAPPDATA 'WA Translator') 'Google\Chrome\NativeMessagingHosts\com.adwcoolgit.wa_translator.json'
$RegistryPath = 'HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.adwcoolgit.wa_translator'

New-Item -Path $RegistryPath -Force | Out-Null
Set-Item -Path $RegistryPath -Value $ManifestPath
```

#### 11. Verifikasi file dan registry

Pastikan:

- file manifest ada di lokasi yang diregister
- path executable di manifest menunjuk ke `WaTranslator.Host.exe`
- registry default value menunjuk ke manifest path yang benar

Quick check:

```powershell
Get-Item 'HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.adwcoolgit.wa_translator'
Get-Content "$env:LOCALAPPDATA\WA Translator\Google\Chrome\NativeMessagingHosts\com.adwcoolgit.wa_translator.json"
```

#### 12. Jalankan onboarding di extension

1. Buka extension WA Translator di Chrome
2. Masuk ke onboarding
3. Baca privacy disclosure
4. Berikan consent
5. Pilih provider: Codex CLI atau Claude Code CLI
6. Jalankan synthetic health check
7. Simpan preferensi awal sampai status lifecycle dan provider readiness berada di kondisi siap

### Quick Setup Checklist

Sebelum extension dianggap siap dipakai, checklist minimum berikut harus lolos:

- `extension/dist` berhasil dibuild
- `WaTranslator.Host.exe` tersedia dari build Release
- extension sudah di-load di `chrome://extensions/`
- `WaTranslator.Setup.exe` tersedia di `native-host/src/Setup/bin/Release/net8.0/` atau pada bundle lokal yang Anda generate sendiri
- manifest `com.adwcoolgit.wa_translator.json` sudah dibuat
- registry `HKCU\Software\Google\Chrome\NativeMessagingHosts\com.adwcoolgit.wa_translator` sudah terisi
- provider CLI sudah ter-install dan login
- onboarding consent selesai
- synthetic provider health check sukses

### Catatan Penting Setup

- Health check hanya memakai synthetic text, bukan isi chat WhatsApp.
- Extension ID Chrome bisa berubah bila extension di-load ulang dari profile atau environment yang berbeda; bila ID berubah, update `allowed_origins` di manifest.
- Bila host status menunjukkan `notDetected`, `registrationFailed`, `incompatible`, atau `integrityFailed`, periksa lagi folder host, manifest path, registry, dan versi artifact yang dipakai.
- Setup executable ini adalah helper install untuk controlled validation, belum installer production one-click penuh.

## Validation Commands

Extension validation:

```powershell
cd extension
npm run lint
npm run typecheck
npm run test
npm run build
```

Native host validation:

```powershell
cd native-host
dotnet test tests/installer/WaTranslator.NativeHost.InstallerTests.csproj
dotnet test tests/integration/WaTranslator.NativeHost.IntegrationTests.csproj
```

Validation focus yang wajib dijaga:

- contract boundaries
- DOM extraction and fail-closed behavior
- no auto-send
- no persistent message-content storage
- diagnostics redaction
- provider-safe execution
- keyboard and focus accessibility
- Windows host lifecycle and integrity validation

## Current Manifest Scope

Manifest extension saat ini dibatasi ke kebutuhan MVP:

- `permissions`: `storage`, `nativeMessaging`, `commands`
- `host_permissions`: `https://web.whatsapp.com/*`
- shortcut default manual translation: `Ctrl+Shift+Y`

Perubahan permission harus dianggap high-risk dan perlu justifikasi terhadap PRD, UI/UX spec, dan constitution.

## Cara Penggunaan

### 1. First-time Setup

1. Build extension dan native host terlebih dahulu.
2. Load extension hasil build ke Chrome sebagai unpacked extension.
3. Jalankan `WaTranslator.Setup.exe` atau lakukan setup companion secara manual bila diperlukan.
4. Buka onboarding WA Translator.
5. Baca privacy disclosure dan berikan consent.
6. Pilih provider yang ingin dipakai: Codex CLI atau Claude Code CLI.
7. Jalankan synthetic health check.
8. Simpan preferensi awal sampai status setup berada di kondisi ready.

Catatan:

- Provider CLI harus sudah ter-install dan sudah login di luar extension.
- Health check hanya memakai synthetic text, bukan isi chat WhatsApp.

### 2. Penggunaan Harian untuk Incoming Translation

1. Buka `https://web.whatsapp.com/*` di Chrome.
2. Pastikan extension dalam keadaan enabled.
3. Atur incoming mode dari popup: `Inline`, `Tooltip`, `On demand`, atau `Off`.
4. Buka chat aktif yang ingin dipantau.
5. Saat pesan masuk yang eligible terdeteksi:
   - mode `Inline`: hasil terjemahan ditampilkan sebagai area tambahan di bawah atau dekat pesan
   - mode `Tooltip`: hasil muncul melalui affordance/popover
   - mode `On demand`: tidak ada request provider sampai user memicu action manual
   - mode `Off`: incoming translation dimatikan

Perilaku yang wajib dipahami:

- Original text selalu tetap terlihat.
- Extension tidak mengganti bubble asli WhatsApp.
- Extension tidak pernah mengirim pesan otomatis.

### 3. Penggunaan Manual Translation

Manual translation dipakai untuk dua jenis target:

- text di composer yang editable
- selected text non-editable dari bubble/chat area

#### Composer / Editable Target

1. Fokus ke composer WhatsApp.
2. Ketik teks atau pilih sebagian teks di composer.
3. Jalankan manual translation lewat shortcut `Ctrl+Shift+Y` atau action yang tersedia.
4. Jika mode manual adalah preview:
   - review hasil terjemahan
   - pilih `Copy`, `Cancel`, atau apply result
5. Jika mode manual adalah direct replace, sistem akan tetap menjaga target validity sebelum replace.
6. Jika apply berhasil, user bisa memakai Undo selama target masih aman dikenali.

#### Selected Text Non-Editable

1. Pilih teks dari pesan yang ingin diterjemahkan.
2. Jalankan manual translation.
3. Hasil akan ditampilkan di preview.
4. Action yang aman untuk target ini adalah:
   - `Copy Translation`
   - `Insert into Composer`

Batasan penting:

- Historical message bubble tidak dimodifikasi.
- Jika target berubah atau composer sudah tidak valid, apply harus diblok atau dialihkan ke flow yang aman.

### 4. Popup dan Options

Popup dipakai untuk kontrol cepat:

- enable/disable extension
- pilih target language
- pilih incoming mode
- lihat provider status singkat

Options page dipakai untuk konfigurasi yang lebih lengkap:

- provider preferences
- privacy dan diagnostics controls
- shortcut status
- reset settings
- clear local data

### 5. Error dan Recovery

Jika extension menampilkan status error atau paused:

1. Baca plain-language recovery action yang muncul.
2. Periksa apakah local companion terdeteksi dan compatible.
3. Periksa apakah provider CLI tersedia dan masih authenticated.
4. Jika DOM WhatsApp berubah dan adapter incompatible, tunggu perbaikan adapter; extension harus fail closed.
5. Jika perlu, gunakan diagnostics export yang sudah disanitasi untuk investigasi.

### 6. Privasi yang Harus Dipahami User

- Isi pesan sumber dan hasil terjemahan tidak boleh disimpan ke persistent storage.
- Diagnostics export tidak boleh berisi source text, translated text, contact identity, credential, atau raw stderr provider.
- Semua send action tetap dilakukan manual oleh user di WhatsApp.

## Development Notes

Saat menambah atau mengubah fitur:

1. pastikan perubahan tetap sesuai SoC, clear, dan modular
2. jangan campurkan DOM logic, business rule, UI state, dan provider execution ke modul yang salah
3. tambah atau update automated validation bila contract atau behavior berubah
4. jangan claim release-ready bila browser-live E2E dan manual release prerequisites belum selesai
5. update issue, task status, dan dokumentasi yang relevan bila scope implementasi berubah

README ini adalah ringkasan implementasi repo. Untuk detail perilaku produk dan acceptance criteria, tetap gunakan PRD, UI/UX specification, constitution, dan artifacts di `specs/001-wa-translator-extension/` sebagai referensi utama.

