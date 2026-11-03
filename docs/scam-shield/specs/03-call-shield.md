# Spec 03: Call Shield

## 1. Purpose
Identify and block scam calls, add context that a caller can't fake (KYC-verified CNAP name, number series, operator and DoT risk data), and break the script of long-running phone scams like **digital arrest** before money moves.

## 2. User stories
| ID | As a… | I want… | So that… |
|---|---|---|---|
| CS-1 | user | to see "Likely scam: digital arrest (reported 340 times)" while the phone rings | I don't pick up or I'm on guard |
| CS-2 | user | calls claiming to be my bank checked against the 1600-series rule | fake bank calls are obvious |
| CS-3 | user | international calls showing Indian numbers flagged | I spot spoofed calls |
| CS-4 | elderly user | unknown international calls blocked automatically | I'm not targeted at all |
| CS-5 | user | an alert to my family if I'm on a long call with an unknown number and then open a payment app | someone can step in |
| CS-6 | user | to report a call in one tap after hanging up (also to Chakshu) | the number gets blocked faster |
| CS-7 | business owner | to appeal a wrong spam label | my business isn't harmed |

## 3. Platform capabilities

| Function | Android | iOS |
|---|---|---|
| Identify incoming caller | `CallScreeningService` (Call Screening role, Android 10+): `onScreenCall()` must respond within ~5 s; can block, silence or allow, and post a notification with the label | **Live Caller ID Lookup** (iOS 18+): private server query with homomorphic encryption returns label + block; **Call Directory Extension**: static list of up to millions of numbers with labels, refreshed in the background |
| Block | `CallResponse.setDisallowCall/setRejectCall/setSkipCallLog` | Live Caller ID "block" or Call Directory blocking entries |
| Detect call state and duration | `TelephonyCallback` (`READ_PHONE_STATE`) and call log (`READ_CALL_LOG`, restricted permission: caller-ID / spam use case) | Only inside our app (CallKit observer sees calls but not numbers) |
| Video calls on WhatsApp/Skype | Notification listener sees "Incoming video call" from package + contact name/number | Not available |
| Overlay during call | Notification + heads-up; full-screen intent for `DANGEROUS` | Live Caller ID label only |

## 4. UX flows

### 4.1 Ringing
- **Android:** `onScreenCall` → local lookup (bloom + cache) → optional cloud lookup within budget (≤ 1.5 s, else local only) → response + a heads-up notification:
  - Red: "🚫 Scam likely: *Digital arrest / fake police*. Reported 342 times this week." (auto-blocked if the user enabled auto-block for `DANGEROUS`)
  - Amber: "⚠️ Claims to be a bank? Banks call from 1600-numbers. This is a mobile number." (only when we know the number is impersonating, e.g. reported)
  - Blue info: "CNAP: Rajesh K. | Jio | Delhi | New number (no reports)"
- **iOS:** label from Live Caller ID ("Raksha: Scam likely") or from Call Directory.

### 4.2 During a call (Android only, opt-in "Call Coach")
After 3 minutes on a call or video call with a non-contact, a low-key ongoing notification: "On a call with an unknown number. Remember: police and banks never ask you to pay or stay on video call." Tap → checklist of red flags.

### 4.3 Digital-arrest interrupt (Android)
Behavioural correlation; see section 5.3. When triggered:
1. Full-screen activity (full-screen intent) in the user's language with voice: **"STOP. This looks like a 'digital arrest' scam. Police, CBI, ED, customs and TRAI NEVER arrest anyone on a video call or ask for money to 'verify' accounts."**
2. Buttons: **Call my family member** (guardian) · **Call 1930** · **I'm safe, dismiss** (requires a 10-second hold + a quiz question to prevent coached dismissal).
3. The guardian gets a push + SMS: "Amma may be on a scam call (unknown number, 25 min, opened PhonePe). Call her now."

### 4.4 After the call
If the call was with a non-contact for > 30 s, a quiet notification: "Was this call a scam?" → 👍 Safe / 🚩 Scam (choose type: digital arrest, fake bank, loan, investment, courier, sextortion, other) → optional forward to **Chakshu** (pre-filled; the user confirms on the Sanchar Saathi page or app).

### 4.5 Settings
- Auto-block: off / `DANGEROUS` only (default) / `DANGEROUS` + `SUSPICIOUS`
- Block all international calls (elderly mode default)
- Block hidden/private numbers
- Silence unknown callers (sends to voicemail / call log)
- Call Coach on/off; Digital-arrest interrupt on/off (default on)

## 5. Detection logic

### 5.1 Number signals

| Signal | Reason code | Weight |
|---|---|---|
| Number in reputation DB with confirmed scam reports (weighted by reporter trust, recency) | `CALL_REPORTED_SCAM` | +30 to +80 |
| DoT FRI Medium / High / Very High (via a partner; see spec 08) | `CALL_FRI_MED/HIGH/VHIGH` | +25 / +50 / +70 |
| International number (`+` non-91) that shows up as `+91` because of spoofing, i.e. operator flags "International call" (DoT-mandated international incoming spoofed call prevention displays these) | `CALL_INTL_INDIAN_CLI` | +40 |
| International number from a high-risk country code list (scam-compound regions, premium-rate codes) | `CALL_INTL_HIGH_RISK` | +25 |
| 140-series (registered telemarketer) | `CALL_TELEMARKETER_140` | label "Telemarketing", score +5 |
| 1600-series (regulated BFSI entity) | `CALL_BFSI_1600` | label "Verified financial institution series", −30 |
| CNAP name present and **matches** the brand the caller claims (from a reported context) | `CALL_CNAP_MATCH` | −20 |
| CNAP shows an individual's name but the number is reported as impersonating a bank/government | `CALL_CNAP_INDIVIDUAL_IMPERSONATION` | +20 |
| Number very new (first seen < 7 days) + high call fan-out reported by operator partner | `CALL_NEW_HIGH_VOLUME` | +30 |
| Number is in the user's contacts | `CALL_CONTACT` | −50 (never block contacts) |
| Number is a verified business (brand directory) | `CALL_VERIFIED_BUSINESS` | −40 |

**Reporter trust:** each user has a trust score (account age, past report accuracy, device attestation). A number needs reports from ≥ N distinct trusted reporters (N scales with reporter trust) before it's labelled, which protects against brigading.

### 5.2 Number lookup privacy
- Android: hash-prefix lookup (first 4 bytes of SHA-256 of the E.164 number) → server returns all matching records; device checks the full hash.
- iOS: Live Caller ID Lookup uses Apple's PIR protocol (homomorphic encryption). We run the PIR server (Apple's open-source `live-caller-id-lookup-example` / `swift-homomorphic-encryption` stack) with the label database, through Apple's required privacy-pass / relay setup.
- Never upload the call log or contacts.

### 5.3 Digital-arrest / remote-coaching correlation (Android)
State machine running on device:

```
State IDLE
  └─ call/video-call with NON-CONTACT starts  → state ON_UNKNOWN_CALL(t0)

ON_UNKNOWN_CALL
  signals (each adds points, decays over 60 min after call ends):
    duration > 10 min                                  +15
    duration > 30 min                                  +15
    video call via WhatsApp/Skype/Telegram from non-contact  +15
    caller number score ≥ 40                           +20
    remote-access app installed or opened (AnyDesk…)    +35
    screen sharing / MediaProjection active             +25
    UPI / banking app opened during or ≤ 30 min after call  +20
    user scanned a UPI QR / checked a VPA during call   +15
    new app installed from a messaging app during call  +25
    incoming SMS with "arrest", "warrant", "CBI", "ED", "narcotics", "money laundering" +20
  threshold ≥ 60 → DIGITAL_ARREST_INTERRUPT (once per call; again if score +30 more)
```
Thresholds are tuned with beta data; the target is ≤ 1 false interrupt per user per 6 months.

### 5.4 Scam-call categories for labels
`DIGITAL_ARREST`, `FAKE_BANK_KYC`, `FAKE_CUSTOMER_CARE`, `COURIER_CUSTOMS`, `LOAN_RECOVERY_HARASSMENT`, `INVESTMENT_TRADING`, `TASK_JOB`, `SEXTORTION`, `LOTTERY_KBC`, `TELECOM_DISCONNECTION` ("your number will be blocked by TRAI"), `ELECTRICITY_DISCONNECTION`, `ROBOCALL_PROMO`, `TELEMARKETING`.

## 6. Data model
```sql
number_reputation(
  number_hash BYTEA PRIMARY KEY,           -- sha256(E.164)
  country_code TEXT, series TEXT,          -- '1600', '140', 'mobile', 'landline', 'intl'
  operator TEXT, circle TEXT,              -- from number-series data (MNP-aware via partner where possible)
  verdict TEXT, score SMALLINT, category TEXT,
  report_count INT, trusted_report_count INT, fp_count INT,
  fri_level TEXT, fri_updated_at TIMESTAMPTZ,
  verified_business_id INT,
  first_seen TIMESTAMPTZ, last_seen TIMESTAMPTZ
);
call_report(
  report_id UUID PRIMARY KEY, number_hash BYTEA, reporter_pseudo_id UUID,
  category TEXT, call_duration_s INT, direction TEXT,
  forwarded_to_chakshu BOOL, created_at TIMESTAMPTZ
);
business_directory(
  business_id SERIAL PRIMARY KEY, name TEXT, numbers_hash BYTEA[],
  verification TEXT, appeal_contact TEXT
);
label_appeal(
  appeal_id UUID PRIMARY KEY, number_hash BYTEA, claimant TEXT,
  evidence_url TEXT, status TEXT, decided_at TIMESTAMPTZ, decision_reason TEXT
);
```

## 7. APIs
```
POST /v1/check/number { "number_hash_prefix": "…", "context": "incoming_call|manual" }
→ { "matches": [ { "number_hash": "…", "verdict": "...", "label": "...", "category": "...", "reasons": [...] } ] }
POST /v1/report/call  { "number": "+91…", "category": "DIGITAL_ARREST", "duration_s": 1420, "forward_to_chakshu": true }
GET  /v1/ios/calldirectory/delta?since=<ver>   // for the Call Directory extension
PIR  https://pir.raksha.app/…                  // Live Caller ID Lookup endpoint
POST /v1/appeal/number { "number": "…", "business_name": "…", "proof": "…" }
POST /v1/guardian/alert { "event": "DIGITAL_ARREST_INTERRUPT", "summary": {...} }   // see spec 06
```

## 8. Edge cases
- Delivery agents, cab drivers and doctors call from unknown numbers: never auto-block `UNKNOWN`; only label.
- Shared numbers (call centres reused by scammers after churn): reputation decays with a 30-day half-life when reports stop; numbers recycled after disconnection get a fresh record when the operator partner signals reallocation.
- Dual SIM: identify which SIM received the call; respect per-SIM settings.
- Roaming abroad: international-call rules disabled while the user is roaming.
- Emergency numbers (100, 101, 102, 108, 112, 1930, 1098) are never blocked or labelled negatively.
- `onScreenCall` timeout: if the cloud is slow, respond with the local verdict and update the notification later.

## 9. Metrics
- Scam-call label precision ≥ 98% (checked by appeals + analyst sampling)
- Coverage: % of reported scam calls that were labelled before the user picked up (target ≥ 70% within 6 months)
- Digital-arrest interrupts: confirmed-scam ratio (target ≥ 50%), false interrupt rate
- Appeal resolution time ≤ 72 h

## 10. Acceptance criteria
- [ ] A number with 50 trusted scam reports shows a red label while ringing on Android and iOS
- [ ] A call from a 1600-series number shows "Verified financial institution series"
- [ ] A contact is never blocked even if the number is reported
- [ ] Simulated scenario: 25-minute unknown WhatsApp video call + AnyDesk opened → interrupt shown and guardian alerted within 10 s
- [ ] Post-call report → visible in the report history; the Chakshu pre-fill opens correctly
- [ ] An upheld appeal removes the label within 15 minutes everywhere
