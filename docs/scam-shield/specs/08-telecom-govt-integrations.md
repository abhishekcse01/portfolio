# Spec 08: Telecom & Government Integrations

## 1. Purpose
Bring in signals a scammer can't fake (operator network data, KYC-verified caller names, DoT risk ratings, regulator lists) and make reporting to official channels effortless. These integrations are Raksha's main advantage over app-only competitors.

> Each integration has a **status**: *Public* (usable now without a contract), *Partner* (needs a commercial or regulatory agreement), *Research* (depends on future policy). Check current terms with each body before building; rules change often.

## 2. Integration catalogue

| # | Integration | Owner | Status | Used by |
|---|---|---|---|---|
| T1 | CAMARA SIM Swap API | Airtel / Jio / Vi (directly or via Aduna / aggregators) | Partner | 04, 06, 07, bank SDK |
| T2 | CAMARA Number Verification | Operators | Partner | Login, merchant verification (02) |
| T3 | CAMARA KYC Match | Operators | Partner | Merchant verification, caller/payee identity checks |
| T4 | Device Status / Roaming | Operators | Partner | Digital-arrest correlation, SIM-change context |
| T5 | Call Forwarding Signal | Operators (where offered) | Partner | 04 |
| T6 | Operator scam-intel exchange (numbers, URLs, headers) | Operators | Partner | 01, 03 |
| T7 | CNAP (Calling Name Presentation) | Operators / DoT | Public (displayed by the phone's dialer) | 03 |
| T8 | TRAI DLT sender headers + suffixes, 140 / 1600 series | TRAI / RBI / SEBI | Public rules; header lists partly public | 01, 03 |
| T9 | DoT Financial Fraud Risk Indicator (FRI) / Digital Intelligence Platform (DIP) | DoT | Partner (stakeholder onboarding) | 02, 03, bank SDK |
| T10 | Sanchar Saathi: Chakshu, TAFCOP, CEIR, KYM, international-call reporting | DoT | Public (deep links) | 03, 07, 11 |
| T11 | 1930 / cybercrime.gov.in (NCRP) / CFCFRMS | I4C (MHA) | Public (guided, user-submitted) | 07 |
| T12 | RBI lists: `.bank.in` / `.fin.in` domains, Digital Lending Apps directory, regulated entities, Sachet | RBI | Public | 01, 04, 07 |
| T13 | SEBI registered intermediaries, `@valid` UPI handles | SEBI | Public | 01, 02 |
| T14 | NPCI UPI rules (payee name display, P2P collect phase-out, UPI Help) | NPCI | Public rules | 02, 07 |
| T15 | UIDAI: Aadhaar secure-QR public key, biometric lock deep links | UIDAI | Public | 02, 04 |
| T16 | CERT-In advisories and threat feeds | CERT-In | Public / partner | 09 |
| T17 | Bank / UPI-app risk SDK (Raksha → partner) | Raksha | Our product | Banks, fintechs |
| T18 | Insurer claims API | ICICI Lombard / HDFC ERGO / Bajaj Allianz / others | Partner | 07 |
| T19 | OEM system integration (pre-install, privileged call screening, in-call AI) | Samsung, Xiaomi, Vivo, Oppo, Realme, Lava, Nothing | Research / partner | 03, 05 |
| T20 | Network-side voice-scam analysis | Operators | Research | 03, 05 |

## 3. CAMARA network APIs (T1–T5)

### 3.1 Access
- India: Airtel and Jio participate in the GSMA Open Gateway initiative and the **Aduna** aggregator; Vi through its API programme. Also available through aggregators (Vonage, Sinch, Infobip, Twilio-style CPaaS). Start with one aggregator to cover all operators with one integration.
- Consent: CAMARA APIs need the user's consent (purpose = fraud prevention). Capture consent in-app and pass the consent reference.

### 3.2 SIM Swap
```
POST https://<gateway>/sim-swap/v1/check
{ "phoneNumber": "+9198xxxxxxx", "maxAge": 72 }
→ { "swapped": true }

POST https://<gateway>/sim-swap/v1/retrieve-date
→ { "latestSimChange": "2026-11-02T06:15:00Z" }
```
Raksha usage:
- At login/registration and daily (background, cheap call)
- When a banking/UPI app is opened within 24 h of a device reboot (Android)
- Result `swapped = true` and the user didn't confirm a SIM change → red alert (spec 04 §3.6) + guardian alert
- **Bank SDK:** banks call our API (which calls the operator) before high-value transfers

### 3.3 Number Verification
- Silent verification over the mobile data connection (no SMS OTP) → used for login and for proving ownership of a merchant VPA's phone number (spec 02).
- Fallback: SMS OTP through a DLT-registered template.

### 3.4 KYC Match
- With the user's consent, check that a name/DOB the user enters matches the operator KYC for a number. Use cases: merchant verification; family-member verification; *not* for looking up strangers (privacy and law don't allow it).

### 3.5 Cost control
API calls cost money per request. Cache results (SIM Swap: 6 h unless an event triggers a re-check), batch daily checks, and include the cost in plan pricing / B2B fees.

## 4. CNAP (T7)
- CNAP shows the **KYC-registered name** of the caller on the receiving phone, network-delivered (DoT directed default-on rollout on 4G/5G from 1 Nov 2026; handset support required).
- Third-party apps can't read the CNAP name directly on most devices (it's shown by the system dialer). Options:
  - Android: `Call.Details.getCallerDisplayName()` and `getCallerDisplayNamePresentation()` in `CallScreeningService` may contain the network-provided name on some devices and networks; read it where present (test across OEMs).
  - Educate users: "Look at the name your phone shows under the number. If it's a person's name but they say they are 'SBI' or 'CBI', it's a scam."
  - OEM partners (T19) can pass the CNAP name to Raksha's system component.
- Rule (spec 03): impersonation reports + CNAP individual name → stronger warning.

## 5. TRAI DLT, 140 & 1600 series (T8)
- **SMS headers:** commercial senders must register headers and templates on operator DLT platforms. Suffixes added in 2025: `-P` promotional, `-S` service, `-T` transactional, `-G` government. Raksha stores verified headers per brand (from partner submissions, public sources and crowd verification of genuine messages).
- **140-series:** registered telemarketers (promotional voice).
- **1600-series:** regulated BFSI entities (banks, insurers, brokers, mutual funds, pension funds) for service/transactional calls, mandated by RBI/SEBI/IRDAI/PFRDA on a phased timeline.
- Raksha keeps a **number-series table** (series → category, owner type) updated from DoT/TRAI notifications, and a brand → official numbers map for the top 300 brands.

## 6. FRI and DIP (T9)
- DoT's Digital Intelligence Platform (DIP) shares the **Financial Fraud Risk Indicator** (Medium / High / Very High) for mobile numbers with stakeholders: banks, NBFCs, payment providers and other agencies.
- **Path for Raksha:**
  1. Phase 1: no direct access. Use our own reputation + partner-bank signals.
  2. Phase 2: through a **regulated partner** (bank or payment provider that's a DIP stakeholder) via the bank SDK (T17): the bank queries FRI itself; Raksha shows a combined warning inside a co-branded flow.
  3. Phase 3: apply to DoT for stakeholder onboarding as a fraud-prevention platform (needs legal entity, security audit, CERT-In empanelled audit report, data-handling undertakings).
- Usage rules: FRI is used to **warn and add friction**, never to label a person publicly; show "Flagged by government fraud-risk systems" without exposing the level to users if the agreement requires it.

## 7. Sanchar Saathi (T10)
| Service | Raksha feature |
|---|---|
| **Chakshu**: report suspected fraud communication (call, SMS, WhatsApp) | Post-call / post-message "Report to Chakshu": opens the Sanchar Saathi app or web form with what can be pre-filled (number, date/time, category, text); the user completes and submits. No automated submissions |
| **TAFCOP**: mobile connections in your name | Monthly reminder (spec 11) with a deep link; explain how to report numbers that aren't yours |
| **CEIR**: block lost/stolen phone | SOS lost-phone playbook (spec 07 §5.6) |
| **KYM**: check IMEI before buying a used phone | Tool under "Check something" |
| Report international calls showing an Indian number | Call Shield's post-call report option |

Partnership target: an official MoU for (a) bulk, user-consented report forwarding through an API, and (b) receiving confirmed fraud numbers to block faster.

## 8. Regulator lists (T12–T15)
| List | Refresh | Use |
|---|---|---|
| RBI `.bank.in` / `.fin.in` registered domains | Weekly | Bank-domain allow-list (spec 01 rule `URL_BANK_NOT_BANKIN`) |
| RBI Digital Lending Apps directory (lender → apps) | Weekly | Loan-app checks (spec 04) |
| RBI regulated entities / NBFC list, Sachet alerts | Weekly | Investment/deposit scam checks |
| SEBI registered intermediaries (brokers, RIAs, research analysts), `@valid` handles | Weekly | Investment scam checks (spec 01, 02) |
| IRDAI insurers and agents | Monthly | Insurance-scam checks |
| MEA registered recruiting agents (eMigrate) | Monthly | Overseas job scams |
| CERT-In advisories | Daily | Threat-intel pipeline (spec 09) |
| Government domain list (`.gov.in`, `.nic.in`) | Daily | Allow-list |

Ingestion jobs: scrape or download published lists (respecting terms of use), normalise, diff, require analyst approval for removals from allow-lists.

## 9. Bank / UPI-app SDK (T17)
**Raksha Pay-Check** for banks, UPI apps and fintechs:
```
POST /partner/v1/payment-risk
{
  "payer_msisdn_token": "…",            // tokenised
  "payee": { "vpa": "…", "account_hash": "…", "msisdn": "+91…" },
  "amount_paise": 4999900,
  "context": { "device_rooted": false, "remote_access_active": true, "on_call_with_unknown": true }
}
→ {
  "risk": "HIGH",
  "signals": ["PAYEE_VPA_REPORTED", "PAYER_SIM_SWAP_48H", "REMOTE_ACCESS_ACTIVE"],
  "recommended_action": "DELAY_AND_CONFIRM"
}
```
- An **on-device SDK** (Android AAR / iOS XCFramework) gives partners Raksha's device signals (remote-access app active, screen sharing, call with unknown number, sideloaded accessibility apps) without the user needing the Raksha app. The partner shows the warning in its own app.
- Commercials: per-API-call or per-active-user pricing; SLAs (p99 < 300 ms, 99.95% uptime).
- Compliance: partner is the data fiduciary for its customers; Raksha acts as a processor under a DPA; data stays in India.

## 10. Operator partnership models (T6, T19, T20)
| Model | What Raksha gives | What the operator gives | Revenue |
|---|---|---|---|
| Bundle | Premium/Family for plan subscribers | Distribution, billing | Wholesale per subscriber |
| White-label | App under operator brand | Distribution, network APIs at cost | Licence + per user |
| Intel exchange | User-confirmed scam reports (numbers, URLs, headers), anonymised | Network risk scores, spam labels, blocked-domain lists | Cost-neutral / strategic |
| Network voice-scam analysis (research) | Scam-conversation and deepfake-voice models | Network-side audio analysis infrastructure under a lawful framework and with explicit customer opt-in | Joint product |

All data exchange needs: DPDP compliance (purpose, consent), TRAI/DoT rules review, and contracts that forbid using the data for marketing.

## 11. OEM integration (T19)
- Pre-install on budget phones (with an opt-in setup screen, not silent activation)
- Privileged system app build (signed by the OEM): system-level call screening, CNAP name access, in-call scam-conversation warnings using on-device ASR (with explicit user opt-in), accessibility-level detection of overlay attacks on payment apps
- Revenue share per activated user

## 12. Acceptance criteria
- [ ] SIM Swap check through the aggregator sandbox returns correct results for test numbers on Airtel, Jio and Vi
- [ ] Number Verification login works on mobile data, with OTP fallback on Wi-Fi
- [ ] Chakshu deep link opens with pre-filled fields where supported
- [ ] Regulator list ingestion runs on schedule with diff reports and analyst approval
- [ ] Partner Pay-Check API meets p99 < 300 ms in load tests at 2,000 rps
