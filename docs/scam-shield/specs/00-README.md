# Raksha: detailed module specifications

These specs expand the master plan ([`../../scam-shield-india-plan.md`](../../scam-shield-india-plan.md)) into buildable detail. Each spec covers: purpose, user stories, UX flows, detection logic, data model, APIs, platform implementation (Android / iOS), edge cases, metrics and acceptance criteria.

| # | Spec | What it covers |
|---|---|---|
| 01 | [Link & Message Shield](01-link-message-shield.md) | SMS, WhatsApp/Telegram notifications, clipboard, share sheet, DNS shield, URL and message analysis |
| 02 | [QR & UPI Guard](02-qr-upi-guard.md) | QR scanner, UPI intent parsing, VPA reputation, merchant QR registry |
| 03 | [Call Shield](03-call-shield.md) | Caller ID, spam blocking, CNAP/FRI context, digital-arrest interrupt |
| 04 | [Device Guard](04-device-guard.md) | Permission auditor, app risk, APK scanner, remote-access and stalkerware detection, SIM change, hygiene score |
| 05 | [AI Fraud Lab](05-ai-fraud-lab.md) | Voice-clone, deepfake video/image checks, Ask Raksha assistant, safe word |
| 06 | [Family Guardian](06-family-guardian.md) | Linking, guardian alerts, elderly mode, child mode |
| 07 | [SOS & Recovery](07-sos-recovery.md) | Golden-hour flow, 1930 / cybercrime.gov.in / Chakshu, evidence pack, insurance claims |
| 08 | [Telecom & Government Integrations](08-telecom-govt-integrations.md) | CAMARA APIs, CNAP, DLT, FRI/DIP, Sanchar Saathi, RBI/SEBI/NPCI lists, partner SDK |
| 09 | [Architecture & Backend](09-architecture-backend.md) | Services, data stores, threat-intel pipeline, ML lifecycle, scale, security |
| 10 | [Compliance & Privacy](10-compliance-privacy.md) | DPDP, CERT-In, IT Rules, Play/App Store declarations, grievance process |
| 11 | [Identity, Education & Scoring](11-identity-education-scoring.md) | Breach monitoring, TAFCOP reminders, education feed, safety score, gamification |

---

## Shared conventions (all modules use these)

### 1. Verdict scale

| Verdict | Score | UI colour | Default action |
|---|---|---|---|
| `SAFE` | 0–19 | Green | No interruption (shown only when the user checks manually) |
| `UNKNOWN` | 20–39 | Grey | Quiet "not verified" label |
| `SUSPICIOUS` | 40–69 | Amber | Warning notification / banner, user can proceed |
| `DANGEROUS` | 70–100 | Red | Full-screen warning, block where the platform allows, offer report + SOS |

"Warn, don't block" is the default for anything below `DANGEROUS`, to limit harm from false positives.

### 2. Common verdict object

Every check (link, message, QR, number, VPA, app, APK, media) returns the same shape, so the UI, family alerts and logs can treat them alike:

```json
{
  "check_id": "chk_01J...",
  "subject_type": "url | message | qr | phone | vpa | app | apk | media",
  "subject_ref": "sha256:… (hashed where possible)",
  "verdict": "DANGEROUS",
  "score": 92,
  "category": "PHISHING_BANK | DIGITAL_ARREST | APK_MALWARE | UPI_DEBIT_QR | ...",
  "reasons": [
    { "code": "DOMAIN_TYPOSQUAT", "weight": 40, "params": { "brand": "SBI", "domain": "sbi-kyc-update.in" } },
    { "code": "DOMAIN_AGE_LT_7D", "weight": 25, "params": { "age_days": 2 } }
  ],
  "explanation_key": "url.phishing_bank",
  "recommended_actions": ["DONT_OPEN", "REPORT", "BLOCK_SENDER"],
  "source": "on_device | cloud | rule",
  "model_versions": { "url_lex": "1.4.0", "rules": "2026.11.03" },
  "ttl_seconds": 3600
}
```

- `reasons[].code` maps to localised, plain-language strings in every supported language (e.g. `DOMAIN_TYPOSQUAT` → "यह वेबसाइट SBI जैसी दिखती है, लेकिन SBI की नहीं है").
- `explanation_key` selects a short story-style explanation plus "what to do".

### 3. Reason-code naming
`<AREA>_<SIGNAL>` in upper snake case, e.g. `SENDER_NOT_DLT`, `CALL_INTL_INDIAN_CLI`, `QR_DEBIT_INTENT`, `APP_ACCESSIBILITY_SIDELOADED`. The full catalogue lives in `reason_codes.yaml` (owned by the threat-intel team, versioned with the rules bundle).

### 4. Privacy principles (apply everywhere)
1. **On-device first.** Message content, contacts and call logs are analysed on the phone. Only hashes, URLs or user-approved samples leave the device.
2. **No contact-book upload**, ever.
3. **Hash-prefix lookups** for URLs and numbers wherever possible (k-anonymity: send the first 4 bytes of SHA-256, server returns all matching full hashes).
4. **Explicit, per-item consent** before any full message, screenshot, audio or video goes to the cloud.
5. **India data residency** for all personal data.
6. **Retention limits:** raw user-submitted samples 90 days (unless the user donates them to training), aggregated intel indefinitely.

### 5. Localisation
- String keys only in code; translations through the localisation pipeline (Crowdin / Lokalise) with native reviewers.
- Launch: `en`, `hi`, `bn`, `mr`, `te`, `ta`. Then `gu`, `kn`, `ml`, `or`, `pa`, `as`.
- Every warning also available as **voice** (pre-recorded for top 50 warnings; TTS through Bhashini or a cloud TTS for the rest).
- Numbers in Indian format (₹1,00,000), dates in DD/MM/YYYY.

### 6. Event telemetry (privacy-safe)
All modules emit events to the analytics pipeline with no PII:
`check_performed`, `warning_shown`, `warning_overridden`, `report_submitted`, `false_positive_reported`, `sos_started`, `sos_step_completed`. Each carries `module`, `verdict`, `category`, `reason_codes[]`, `latency_ms`, `app_version`, `os`, `language`, `district` (coarse, opt-in).

### 7. Definition of done (every module)
- Works offline in degraded mode (rules + on-device models)
- All strings in the 6 launch languages, with voice for red warnings
- TalkBack / VoiceOver tested, minimum 18sp text in elderly mode
- Tested on a ₹7–10k Android phone (2–3 GB RAM, Android 11+) and an iPhone running the oldest supported iOS
- Battery: under 2% per day attributable to the app in background (Android Vitals)
- False-positive feedback path ("This is safe") on every warning
