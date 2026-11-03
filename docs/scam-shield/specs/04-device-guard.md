# Spec 04: Device Guard

## 1. Purpose
Detect when an app, a person or a scammer has gained **unwanted access** to the phone: risky permissions (Accessibility, notification access, overlays, device admin, SMS), malicious or sideloaded apps, remote-access tools, stalkerware, SIM swaps, call forwarding and weak security settings. Full detection on Android; a hygiene checklist on iOS.

## 2. User stories
| ID | As a… | I want… | So that… |
|---|---|---|---|
| DG-1 | user | to see every app that can read my screen, my notifications or my SMS | I know who can steal OTPs |
| DG-2 | user | a warning the moment a new app is installed from WhatsApp or a browser | malicious APKs are caught |
| DG-3 | user | APK files in my Downloads/WhatsApp folders scanned | I don't install "wedding_card.apk" |
| DG-4 | user | an alert if AnyDesk/TeamViewer is installed or running | screen-sharing scams fail |
| DG-5 | survivor of abuse | to check for stalkerware discreetly | I know if someone is tracking me |
| DG-6 | user | an alert if my SIM changes or is swapped | I can lock my bank quickly |
| DG-7 | user | a security score with simple fixes | my phone gets safer step by step |
| DG-8 | iPhone user | a checklist of what to secure | I get protection within iOS limits |

## 3. Android components

### 3.1 Permission auditor
Scans on app open, on `PACKAGE_ADDED`/`PACKAGE_REPLACED`, and every 6 h via WorkManager.

| Capability checked | How we read it | Risk notes |
|---|---|---|
| Accessibility services | `AccessibilityManager.getEnabledAccessibilityServiceList()` / `Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES` | The #1 banking-trojan abuse. Sideloaded app + accessibility = `DANGEROUS` |
| Notification listener | `Settings.Secure.enabled_notification_listeners` | Can read OTPs (Android < 15) and messages |
| Draw over other apps | `AppOpsManager` `OPSTR_SYSTEM_ALERT_WINDOW` | Overlay phishing on top of bank apps |
| Device admin | `DevicePolicyManager.getActiveAdmins()` | Prevents uninstall, can lock or wipe |
| SMS read/receive | `PackageManager.checkPermission(READ_SMS / RECEIVE_SMS)` | OTP theft |
| Default SMS / dialer / assistant | `RoleManager` | A hijacked default handler is critical |
| Usage access | AppOps `OPSTR_GET_USAGE_STATS` | Spying on app usage |
| Install unknown apps | `canRequestPackageInstalls` per source app | Which apps can install others |
| VPN active | `ConnectivityManager` `NetworkCapabilities.TRANSPORT_VPN` + owner package | Traffic interception |
| Call forwarding / call redirection role | `RoleManager.ROLE_CALL_REDIRECTION` | Redirecting calls |
| Camera / mic / location usage | AppOps recent-usage history (`getHistoricalOps` where allowed) and the privacy dashboard deep link | Spying |
| Contacts / call log / photos | Granted runtime permissions | Loan-app harassment |
| Certificate (user CA installed) | `KeyStore("AndroidCAStore")` user entries | TLS interception |

**Output:** "Access Map" screen grouped by capability, each app with: icon, name, installer (Play Store / browser / WhatsApp / unknown), install date, risk badge, plain-language explanation ("This app can read everything on your screen, including bank passwords") and a **Revoke** button that deep-links to the exact settings page (`Settings.ACTION_ACCESSIBILITY_SETTINGS`, `ACTION_NOTIFICATION_LISTENER_SETTINGS`, `ACTION_MANAGE_OVERLAY_PERMISSION` with package URI, device admin removal, `ACTION_APPLICATION_DETAILS_SETTINGS`).

### 3.2 App risk scoring

| Signal | Reason code | Weight |
|---|---|---|
| Hash / signing cert matches known malware (MalwareBazaar, VirusTotal partner feed, our sandbox) | `APP_KNOWN_MALWARE` | +90 |
| Installer is not a known store (`com.android.vending`, Samsung/Xiaomi/Oppo/Vivo stores, Indus Appstore) | `APP_SIDELOADED` | +15 |
| Installed from a messaging app or browser (installer package = WhatsApp, Telegram, Chrome, file manager) | `APP_FROM_MESSAGING` | +20 |
| Sideloaded + Accessibility enabled | `APP_ACCESSIBILITY_SIDELOADED` | +50 |
| Sideloaded + SMS read + notification listener | `APP_OTP_STEALER_PATTERN` | +45 |
| Hidden launcher icon (no `LAUNCHER` activity, or disabled component after first run) | `APP_HIDDEN_ICON` | +25 |
| Name/icon mimics a bank, government or utility app but the package or cert isn't the official one | `APP_IMPERSONATION` | +50 |
| Device admin + sideloaded | `APP_ADMIN_SIDELOADED` | +40 |
| Loan app not on the RBI Digital Lending Apps list but requesting contacts + photos | `APP_UNLISTED_LENDER` | +35 |
| Known remote-access tool | `APP_REMOTE_ACCESS` | +20 (amber; red during an unknown call) |
| Known stalkerware IOC (package, cert, C2 domain) | `APP_STALKERWARE` | +80 |
| Official app (package + cert pinned in our allow list) | `APP_OFFICIAL_VERIFIED` | −50 |
| Play-installed, > 1M installs, no risky combo | `APP_PLAY_REPUTABLE` | −20 |

Cloud lookup: send `package_name` + `SHA-256 of signing cert` + `APK SHA-256` (no user data). Unknown APK hashes from sideloaded apps may be uploaded for sandbox analysis **only with user consent** (APK files only, never user data).

### 3.3 APK scanner
- Watches: `Download/`, `WhatsApp/Media/WhatsApp Documents` (scoped storage: through the user picking the folder with SAF `ACTION_OPEN_DOCUMENT_TREE` once), Telegram downloads, and APKs shared to Raksha.
- On device: parse the manifest (permissions, components, `targetSdk`, accessibility service declaration, SMS receivers, device-admin receivers), signing cert, file size, packer signatures; compute a static risk score.
- Cloud: hash lookup → if unknown, consented upload → sandbox (emulator farm + Frida instrumentation; capture network, overlay attempts, SMS access, accessibility abuse) → verdict pushed back within ~5 minutes.
- UX: "⚠️ 'RTO_Challan.apk' in WhatsApp Documents is a banking trojan. Delete it?" → Delete (SAF delete) / Keep.

### 3.4 Remote-access & screen-sharing detector
- Package list of remote-access tools: AnyDesk, TeamViewer + QuickSupport, RustDesk, AirDroid (+ AirMirror), Splashtop, Chrome Remote Desktop, Zoho Assist, Supremo, UltraViewer, and others (updated in the rules bundle).
- Signals: installed (amber), foreground service running, MediaProjection / screen-capture active (status-bar cast icon; detected through `MediaProjectionManager` callbacks where available and the running foreground-service type), accessibility enabled for the tool.
- If installed or launched **during or within 30 min of a call with a non-contact** → feeds the digital-arrest correlation (spec 03) and shows: "Someone may be trying to control your phone. Close AnyDesk now?"

### 3.5 Stalkerware check ("Private check")
- Discreet mode: neutral app icon option ("Raksha" → "Tools"), no notifications for this check, results shown only inside the app.
- IOCs from the Coalition Against Stalkerware / Echap stalkerware-indicators repository (packages, certs, domains), plus heuristics: hidden icon + location + mic + SMS + call log + accessibility + device admin.
- Safety-first guidance: removing stalkerware can alert the abuser. Show options (document evidence, contact the women's helpline 181, cybercrime.gov.in, NCW) before the "Remove" button.

### 3.6 SIM & telecom checks
- **SIM change:** store a hash of `SubscriptionInfo` (ICCID where readable, carrier ID, slot, number when available). On change → "Your SIM changed. Was this you?" → if not, guide through blocking the SIM (operator helpline), locking banking (bank helplines), and checking linked accounts.
- **SIM Swap API** (operator partner, spec 08): check at app start, daily, and whenever a bank/UPI app is opened after a reboot. Swap in the last 72 h without the user confirming → red alert + guardian alert.
- **Call forwarding:** Android doesn't expose forwarding status to apps reliably. Guide the user to dial `*#21#` (unconditional) and `*#62#`/`*#67#`/`*#61#`, then explain the results; disable with `##002#`. Use the operator's call-forwarding signal API where available.
- **eSIM:** warn about "eSIM activation" SMS and calls; explain that eSIM transfer requests should only be made through the operator's own app or store.

### 3.7 Hygiene score (0–100)

| Check | Points | Detection |
|---|---|---|
| Screen lock set (PIN/pattern/biometric) | 10 | `KeyguardManager.isDeviceSecure()` |
| Security patch level ≤ 90 days old | 10 | `Build.VERSION.SECURITY_PATCH` |
| Play Protect on | 8 | `SafetyNet/Play Protect` verify-apps API (`isVerifyAppsEnabled`) |
| No app allowed to install unknown apps (except stores) | 8 | 3.1 |
| No sideloaded app with Accessibility | 10 | 3.1 |
| No unknown device admin | 6 | 3.1 |
| No user-installed CA certificate | 4 | 3.1 |
| Not rooted / Play Integrity passes | 6 | Play Integrity API |
| Google account 2-step verification on | 6 | User confirms (deep link to myaccount.google.com) |
| WhatsApp two-step PIN on | 6 | User confirms (guided) |
| Aadhaar biometrics locked | 6 | User confirms (mAadhaar / UIDAI deep link) |
| UPI apps: app lock on, transaction limit set | 5 | User confirms |
| DNS shield active | 5 | Private DNS / VPN state |
| Raksha SMS + call protection on | 5 | Role / permission state |
| Backups on | 5 | User confirms |

Score shown as a ring with the top 3 fixes. Self-reported items marked "confirmed by you" and re-asked every 90 days.

### 3.8 Wi-Fi check
- Open network, WEP/WPA1, captive portal on a brand-named SSID, an SSID matching a known evil-twin pattern, gateway MAC changes between visits → warning "Avoid banking on this Wi-Fi" and offer the VPN mode.

## 4. iOS: Security Checklist
iOS doesn't allow scanning other apps. Instead:

| Check | Detection |
|---|---|
| iOS version up to date | `UIDevice.current.systemVersion` vs the latest from our server |
| Passcode set | `LAContext.canEvaluatePolicy(.deviceOwnerAuthentication)` |
| Configuration profiles / MDM installed | Can't be read: guided check (Settings → General → VPN & Device Management) with screenshots |
| Lockdown Mode suggested for high-risk users | Guidance |
| Apple ID 2FA, recovery contacts, Stolen Device Protection | Guided + user confirmation |
| Jailbreak heuristics | File/URL-scheme checks (best effort, not shown as definitive) |
| DNS shield on | `NEDNSSettingsManager.isEnabled` |
| SMS filter & caller ID on | Extension state via `CXCallDirectoryManager.getEnabledStatusForExtension` |
| Aadhaar biometric lock, WhatsApp two-step PIN, UPI app lock | Same as Android (user confirmation) |

## 5. Data model
```sql
app_intel(
  package_name TEXT, cert_sha256 BYTEA, apk_sha256 BYTEA,
  verdict TEXT, score SMALLINT, family TEXT,            -- malware family
  official_brand_id INT, play_installs BIGINT,
  sandbox_report_url TEXT, first_seen TIMESTAMPTZ,
  PRIMARY KEY (package_name, cert_sha256)
);
remote_access_tools(package_name TEXT PRIMARY KEY, vendor TEXT, risk TEXT);
stalkerware_ioc(ioc_type TEXT, value TEXT, family TEXT, source TEXT);
```
On device: `app_snapshot` (package, installer, cert hash, permissions bitmap, first seen, last scanned verdict), `sim_snapshot_hash`, `hygiene_answers`.

## 6. APIs
```
POST /v1/check/apps   { "apps": [ { "pkg": "…", "cert": "…", "apk": "…", "installer": "…" } ] }   // batched, ≤ 200
POST /v1/apk/upload   multipart (consent token required) → { "job_id": "…" }
GET  /v1/apk/job/{id} → verdict object
GET  /v1/rules/bundle  (includes remote-access list, official-app allow list, stalkerware IOCs)
POST /v1/telco/sim-swap-check  { "msisdn_token": "…" }   // spec 08
```

## 7. Play policy
- `QUERY_ALL_PACKAGES`: declared under "antivirus / device security"; core feature, with a prominent disclosure.
- No `AccessibilityService` in the Play build; the OEM build may use it for on-screen scam detection in payment apps (with OEM sign-off).
- `READ_PHONE_STATE` for SIM change; no `READ_PRIVILEGED_PHONE_STATE`.
- Prominent disclosure screens before each special access request, with a video for the Play declaration.

## 8. Edge cases
- OEM accessibility services (Samsung Voice Assistant, TalkBack, Xiaomi's services) and legitimate tools (password managers, automation apps such as Tasker): allow-listed; legitimate but powerful apps get an amber "trusted but powerful" label, not red.
- Enterprise devices with MDM device admin: recognise known MDM packages (Intune, Workspace ONE, Google Device Policy) as legitimate.
- Dual apps / work profile: scan each user profile the app can see; explain what can't be scanned.
- Very large app lists (300+ apps): batch cloud lookups; cache verdicts by cert hash.

## 9. Metrics
- Malware detection rate on an Indian sample set (SMS stealers, banking trojans, fake loan apps) ≥ 97%; false positives on top 1,000 Play apps = 0
- % of users who revoked at least one risky permission after the first scan
- Median hygiene score improvement after 30 days
- Background battery under 1% / day for Device Guard

## 10. Acceptance criteria
- [ ] A test APK requesting SMS + Accessibility, installed from WhatsApp → `DANGEROUS` alert within 10 s of install, with a working "Revoke / Uninstall" path
- [ ] AnyDesk installed → amber; AnyDesk opened during an unknown call → interrupt (spec 03)
- [ ] SIM swapped (test: change SIM) → alert on next boot
- [ ] Known stalkerware sample → detected in Private check without a notification
- [ ] iOS checklist completes and shows a score with steps for each failed item
