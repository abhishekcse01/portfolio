# Spec 10: Compliance & Privacy

> Not legal advice. This spec lists what the product must support. Engage Indian counsel (data protection, telecom, insurance, IT law) before launch and re-check dates; several rules phase in during 2026–2027.

## 1. Applicable laws and rules

| Law / rule | Why it applies | Key obligations for Raksha |
|---|---|---|
| **Digital Personal Data Protection Act 2023 + DPDP Rules 2025** (notified Nov 2025; most obligations phase in over 18 months, about May 2027; consent-manager provisions from Nov 2026) | We process personal data of Indian users | Clear notice in English + scheduled languages; consent that is free, specific, informed and as easy to withdraw as to give; purpose limitation; data minimisation; security safeguards; breach notification to the Data Protection Board and affected users; erasure on request / when purpose ends; grievance redressal (respond within the prescribed time); **verifiable parental consent** for children (< 18); possible **Significant Data Fiduciary** status at scale (DPIA, audits, DPO in India) |
| **Information Technology Act 2000** + **IT (Intermediary Guidelines) Rules 2021** | Hosting user reports, labels, community alerts | Due diligence, grievance officer, takedown on lawful orders, publish rules and privacy policy |
| **IT (Reasonable Security Practices) Rules 2011** (until fully replaced by DPDP) | Sensitive data (passwords, financial info) | ISO 27001-style security programme |
| **CERT-In Directions (April 2022)** | Service provider in India | Report cyber incidents within 6 hours; keep logs for 180 days in India; sync clocks with NTP (NIC/NPL) |
| **Telecommunications Act 2023**, **Telecom Cyber Security Rules 2024** + **2025 amendment** | Using telecom identifiers, operator APIs, number data | Contract and legal review for data exchange with operators; follow DoT directions on misuse of telecom identifiers |
| **TRAI TCCCPR 2018 (as amended)** | Sending SMS alerts | DLT registration (entity, headers, templates) for our own SMS |
| **RBI / NPCI rules** (if we partner with banks or touch payment data) | Bank SDK, payment-risk API | Outsourcing guidelines (as a service provider to banks), payment data localisation, audits by partner banks |
| **IRDAI regulations** | Embedded insurance | Sell only through a licensed insurer as corporate agent / group policy; disclosures; no misselling |
| **Consumer Protection Act 2019** + **E-commerce / Dark Patterns Guidelines 2023** | Consumer subscriptions | No misleading claims ("100% protection"), no dark patterns in subscription, easy cancellation, clear auto-renewal |
| **Bharatiya Nyaya Sanhita / defamation law** | Labelling numbers/businesses as scams | Evidence-based labels, appeal process, careful wording ("Reported as scam by X users") |
| **Google Play Developer Policies** | Android distribution | Permission declarations, prominent disclosure, Data Safety form, financial-features declaration if applicable |
| **Apple App Store Review Guidelines** | iOS distribution | Accurate metadata (2.3), privacy labels, extension-specific rules, no claims of features iOS doesn't allow |
| **GIGW / accessibility norms (RPwD Act 2016)** | Inclusive product | WCAG 2.1 AA target |

## 2. Data inventory

| Data | Source | Purpose | Where processed | Retention | Legal basis |
|---|---|---|---|---|---|
| Phone number (hashed for lookups; plain for account) | User | Account, Number Verification, SIM swap checks | Server (India) | Account lifetime + 30 days | Consent |
| SMS / notification content | Device | Scam detection | **On device only** (cloud only on per-item consent) | Not stored on server; on-device cache 7 days | Consent |
| URLs from messages | Device | Link checks | Hash prefix to server; full URL only on consent / manual check | Hash logs 30 days | Consent |
| Incoming numbers | Device | Caller ID | Hash prefix / PIR | Not stored per user | Consent |
| Installed app list | Device | Device Guard | Package + cert hashes to server | Not linked to identity beyond 24 h | Consent |
| APK files (sideloaded, unknown) | Device | Malware analysis | Server sandbox | 90 days (samples; no personal data) | Consent per upload |
| Voice/video/images for AI checks | User upload | Deepfake detection | Server (India) | 24 h unless donated | Consent per upload |
| Voice enrolment embeddings | Family members | Speaker comparison | Server, encrypted | Until deleted | Explicit consent |
| Reports (numbers, links, text redacted) | User | Community protection, Chakshu forwarding | Server | Reputation indefinite (de-identified); raw 90 days | Consent |
| Family relationships, alert history | Users | Guardian alerts | Server | Membership lifetime; alerts 12 months | Consent of each adult; parental consent for minors |
| SOS case data | User | Recovery help | **On device**; optional encrypted backup | User-controlled | Consent |
| Payment/subscription | Payment provider | Billing | Payment provider (PCI-DSS) | As required by tax law | Contract |
| Telemetry (no PII) | Device | Product quality | Server | 13 months | Legitimate use / consent per DPDP rules |

## 3. Consent design
- **Layered onboarding:** one screen per protection, each explaining what's read, what leaves the phone and why, with a toggle. No bundled "accept all".
- **Prominent disclosures** before each Android special access (notification access, SMS, call screening, VPN, `QUERY_ALL_PACKAGES`), as required by Play.
- **Consent receipts** stored (timestamp, version, purposes); exportable by the user.
- **Withdrawal:** Settings → Privacy → per-purpose toggles; "Delete my account and data" (completes within 30 days; immediate for on-device data).
- **Languages:** notices in all supported languages; audio version for elderly mode.
- **Consent managers** (DPDP Rules): support integration with registered consent managers once that ecosystem is live.

## 4. Children
- Users under 18 only through a family where a verified parent gives consent (DPDP verifiable parental consent: parent's identity verified through DigiLocker-based age/identity tokens or an equivalent method allowed by the Rules).
- No behavioural tracking or targeted advertising for minors (we don't run ads at all).
- Child mode alerts share categories only, never message content (spec 06 §8).

## 5. Labelling, appeals and grievance
- **Label wording:** factual and attributable ("Reported as fraud by 214 users this week"; "Flagged by Raksha analysis: impersonates SBI"), never "This person is a criminal".
- **Appeal portal** (web + in-app): anyone can contest a number, domain, VPA, app or business label; identity/ownership proof; decision within 72 h; reasons given; second-level review on request.
- **Grievance Officer** (named, India-based) for IT Rules and DPDP; published contact; acknowledgement within 24 h; resolution within the timeline the rules require (publish it in the policy).
- **Transparency report** every 6 months: labels created/removed, appeals, government requests, data requests.

## 6. Security programme
- ISO/IEC 27001 certification target within 18 months; SOC 2 Type II if selling to global partners
- CERT-In empanelled auditor review before launch and annually
- DPIA for each major feature (especially AI media, family alerts, telco data)
- Data Processing Agreements with all vendors (cloud, LLM API, SMS, push, insurer); LLM vendors contractually barred from training on our data; prefer vendors with India-region processing
- Encryption: TLS 1.3 in transit; AES-256 at rest; field-level encryption for case data and embeddings; keys in KMS/HSM

## 7. Store declarations checklist

**Google Play**
- [ ] SMS & Call Log permission declaration form (core functionality: spam/fraud protection; caller ID), demo video
- [ ] `QUERY_ALL_PACKAGES` declaration (device security)
- [ ] `VpnService` declaration (if VPN mode ships): local filtering only, no traffic monetisation
- [ ] Notification listener prominent disclosure
- [ ] No `AccessibilityService` in the Play build (or the accessibility-tool declaration with a valid use case)
- [ ] Data Safety form matching §2
- [ ] Subscriptions through Play Billing (or user-choice billing where allowed in India)
- [ ] Prominent disclosure + consent for uploads of APKs and media

**Apple App Store**
- [ ] Privacy nutrition labels matching §2
- [ ] SMS filter extension network deferral domain listed; Live Caller ID Lookup entitlement requested
- [ ] DNS settings / content filter usage explained in review notes
- [ ] No claims of malware scanning on iOS
- [ ] Subscriptions through StoreKit; restore purchases; easy cancellation info

## 8. Marketing claims policy
- Allowed: "Warns you about scam links, calls and QR codes", "Detects risky app permissions on Android", "Helps you report fraud fast".
- Not allowed: "100% protection", "Guaranteed money back" (unless insured, and then with limits), "Government approved" (unless formally true), "Detects all deepfakes", using government logos or implying official status.
- Every number in marketing (e.g. "₹X crore saved") must have a documented method.

## 9. Acceptance criteria
- [ ] Privacy policy and terms in 6 launch languages reviewed by counsel
- [ ] Data-deletion request completes end-to-end within 30 days and is verified by audit log
- [ ] Consent receipts recorded for every purpose toggle
- [ ] Appeal decided within 72 h in a test run of 50 appeals
- [ ] CERT-In incident drill: report drafted within 6 hours
- [ ] Store declarations approved on first or second submission
