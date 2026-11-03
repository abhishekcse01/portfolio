# Scam-protection app for India: research and product plan

**Working name:** *Raksha* (a placeholder; check trademarks before using it)
**Platforms:** Android and iOS
**Market:** Indian consumers, plus distribution through Indian telecom operators, banks and UPI apps
**Date:** November 2026

> This is a planning document. Market figures come from public reports, mostly government answers in Parliament and company press releases. Check each one against the primary source before putting it in a pitch deck or an investor memo.

---

> **Detailed module specs:** see [`scam-shield/specs/`](scam-shield/specs/00-README.md).

## 1. Summary

India loses tens of thousands of crores a year to cyber fraud. The scams also move fast: KYC-update SMS gave way to fake APK files on WhatsApp, then "digital arrest" video calls, then deepfake investment ads and cloned voices. Fixing one channel isn't enough, because a single scam usually runs across several (call → WhatsApp → APK → UPI).

The product is one app that:

1. **Checks everything the user receives:** links, QR codes, SMS, WhatsApp/Telegram messages, APK files, phone numbers, UPI IDs, screenshots, and audio or video clips (for deepfakes).
2. **Watches the phone for takeover:** apps abusing Accessibility, notification access, screen overlays, device admin or SMS; remote-access apps; stalkerware; SIM swaps; and call forwarding.
3. **Steps in at the moment of loss:** warns during a suspicious call, before a payment to a flagged UPI ID, and when an app is being installed or granted risky permissions.
4. **Helps after a fraud:** a one-tap 1930 / cybercrime.gov.in report inside the "golden hour", bank freeze scripts, Sanchar Saathi actions, and evidence export.
5. **Uses Indian government and telecom systems** (Sanchar Saathi/Chakshu, DoT's Financial Fraud Risk Indicator, CNAP, TRAI's DLT sender headers, the operators' network APIs) rather than relying only on its own crowdsourced data.

What sets it apart from CYBX and Truecaller: honest platform-specific design (iOS limits are very different), **network-level intelligence through telecom partnerships**, **guidance in Indian languages written for first-time smartphone users and elderly people**, a **family guardian mode**, and **AI-fraud defences** (deepfakes, voice clones, LLM-written phishing).

---

## 2. Competitor research: CYBX (63SATS Cybertech)

| Item | What is publicly known |
|---|---|
| Company | 63SATS Cybertech, a subsidiary of 63 moons technologies. Pitched as "India's first consumer cybersecurity super app". |
| Core features | Link scanning / anti-phishing for SMS, email and chat; QR code verification; real-time malware scan; spam call blocking and caller ID; data breach check; secure calling. |
| Version 2 (April 2026) | A security score out of 100 (a "credit score for digital hygiene"), Hindi support, gamification, secure group calls for up to 50 people. |
| Insurance | Embedded cyber insurance with ICICI Lombard, reported at up to ₹10 lakh depending on plan (fraud, identity theft, cyberbullying). |
| Model | 14-day free trial, then subscription plans. Protection "depends on plan, OS and permissions enabled". |
| Gaps (from public material) | No independent tests of detection quality found; iOS protection is necessarily thinner; little public detail on deepfake or voice-clone defence, telecom integration, family/elderly mode, or recovery help after a fraud. |

**Other competitors and adjacent products**

| Product | Strength | Weakness we can use |
|---|---|---|
| Truecaller | Huge caller-ID database, SMS filtering | Privacy concerns (crowdsourced contact upload); CNAP now gives KYC-verified names free at network level; weak on links, APKs and device takeover |
| Google Play Protect / Android Scam Detection / Google Messages | Built into the OS, high trust | Generic, not India-specific in UX; doesn't do recovery, family mode or regional languages deeply |
| Airtel / Jio network spam and link blocking | Works with no app; sees all traffic | Only for that operator's customers; no explanation, education or recovery for the user |
| Sanchar Saathi (DoT) | Official: Chakshu reporting, TAFCOP, CEIR | A government utility, not a real-time protector; little proactive scanning |
| Quick Heal, K7, Norton, McAfee, Bitdefender | Mature antivirus engines | Built around malware; weak on social-engineering scams like digital arrest, task scams and UPI tricks |
| Bank / UPI app warnings | At the point of payment | Covers that one app only |

**Positioning:** "The one app that protects your whole family from every kind of scam, in your language, working with your telecom operator and bank."

---

## 3. The Indian threat landscape

### 3.1 Scale (check figures before publishing)
- The government told Parliament there were **17,718 digital-arrest incidents in Jan–Feb 2025 alone (₹210 crore lost)**, and about **₹2,576 crore lost to digital arrest and related scams between 2022 and Feb 2025**.
- I4C projected worst-case total cyber-fraud losses of around **₹1.2 lakh crore for 2025**. That is a projection, not an actual figure.
- I4C reportedly linked **about 45% of 2025 cyber-fraud complaints** to organised networks in Southeast Asia (scam compounds in Cambodia, Myanmar and Laos).
- A McAfee survey reported that **47% of Indian adults** had been a victim of, or knew a victim of, an AI voice-clone or deepfake scam.
- Airtel reports blocking **more than 82.5 billion spam calls and 3.4 billion spam SMS** in about 18 months, plus lakhs of fraud links.
- DoT says its **Financial Fraud Risk Indicator (FRI)** helped avert about **₹475 crore** in fraud, and that **2.84 crore fraudulent connections** were disconnected through Sanchar Saathi tools.

### 3.2 Scam types the app must detect (India-specific)

| # | Scam type | Channel | How the app detects or prevents it |
|---|---|---|---|
| 1 | **Digital arrest** (fake CBI/ED/police/customs/TRAI on a video call) | Call → WhatsApp/Skype video | International or VoIP number with an Indian-looking caller ID; keywords ("arrest", "money laundering", "parcel", "Aadhaar misuse"); long video call followed by a large payment attempt; a full-screen "Police never arrest over video call" warning; family guardian alert |
| 2 | **KYC / account-block / electricity disconnection SMS** | SMS, WhatsApp | Sender header validation (DLT headers and the new -S/-T/-P/-G suffixes), link reputation, urgency language model |
| 3 | **Malicious APK** ("wedding invite.apk", "RTO challan.apk", "PM Kisan.apk", "SBI reward points.apk") | WhatsApp, Telegram, SMS | APK scanning on download or share (permissions, certificate, packer, known malware families such as SMS stealers and banking trojans); block install from messaging apps |
| 4 | **Fake customer care** (search ads or Google Maps listings with fake numbers) | Web search → call | Check numbers against official brand helplines; warn when a "bank" calls from a 10-digit mobile number instead of the RBI-mandated **1600-series** |
| 5 | **UPI QR "scan to receive money"** and fake collect requests | QR, UPI | QR parser: a `upi://pay` intent with an amount means *you are paying*; payee VPA vs name mismatch; VPA reputation; FRI lookups for the linked number |
| 6 | **Task / part-time job scams** (YouTube likes, hotel reviews, Telegram "tasks") | WhatsApp, Telegram, Instagram | Message classifier; Telegram group reputation; payout-then-deposit pattern education |
| 7 | **Stock / IPO / crypto investment groups**, fake trading apps | WhatsApp groups, ads, deepfake celebrity videos | SEBI-registered entity check; app reputation; deepfake ad detection; "guaranteed returns" language |
| 8 | **Predatory loan apps** (harassment, contact scraping) | Play Store / APK | Permission audit (contacts, SMS, photos); RBI-listed lender check (Digital Lending Apps directory) |
| 9 | **Sextortion video calls** | WhatsApp video | Unknown international video call warning; guidance and a help line |
| 10 | **Parcel / courier / customs** (FedEx, DHL, India Post) | Call, SMS | Number and link reputation; brand typosquat detection |
| 11 | **Screen-sharing takeover** (AnyDesk, TeamViewer, RustDesk, QuickSupport) | Call + app install | Detect remote-access apps; warn if one is installed or launched during or just after a call with an unknown number; detect active screen capture or MediaProjection |
| 12 | **SIM swap / eSIM swap** | Telecom | Detect SIM change (Android); operator **SIM Swap API**; alert the user and family; prompt a bank lock |
| 13 | **Call-forwarding USSD tricks** | Call | Educate and show forwarding status (the user dials `*#21#`); DoT has disabled USSD forwarding activation, but variants persist |
| 14 | **AePS biometric fraud** (cloned fingerprints) | Aadhaar | Prompt to **lock Aadhaar biometrics** in mAadhaar / UIDAI; monitor for AePS SMS |
| 15 | **OLX / "army officer" buyer scams** | Marketplaces | Pattern education plus UPI collect checks |
| 16 | **Romance / matrimonial / pig-butchering** | Dating and matrimonial apps, WhatsApp | Conversation-risk signals in shared text, image reverse-search for fake profile photos |
| 17 | **Fake e-challan, gas, IRCTC, income-tax refund, PM schemes** | SMS | Official domain allow-list (`.gov.in`, `.nic.in`, `parivahan.gov.in`), typosquat detection |
| 18 | **Fake bank sites** | Links | RBI's **`.bank.in` domain** and **`.fin.in`** for NBFCs: anything claiming to be a bank on another domain is high-risk |
| 19 | **Job offers abroad (cyber slavery)** | WhatsApp, LinkedIn, agents | MEA registered-recruiting-agent check, keyword warnings |
| 20 | **Lottery / KBC / prize** | WhatsApp voice notes | Classifier plus a KBC-specific signature |
| 21 | **Public Wi-Fi / juice jacking** | Physical | Wi-Fi risk check; USB-data warning (Android) |

### 3.3 AI-driven fraud (a growing category)

| Threat | Example | Defence in the app |
|---|---|---|
| **Voice cloning** | "Papa, I've been arrested, send ₹50,000" in the child's voice | Family **safe word**; one-tap "call them back on their saved number"; on Android, a synthetic-voice detector on recorded voice notes or on-speaker audio the user chooses to analyse; urgency-scam pattern education |
| **Deepfake video calls** | Fake police officer or relative on a video call | Frame analysis through Android screen capture (MediaProjection, with the user's consent) for face-swap artefacts and lip-sync mismatch; liveness challenge prompts ("ask them to turn their head sideways and wave a hand in front of their face") |
| **Deepfake ads and celebrity endorsements** | Fake videos of famous business people or news anchors promoting trading apps | Analyse shared videos and links; known deepfake-campaign hash database; brand/celebrity impersonation list |
| **LLM-written phishing** | Perfect Hindi or Tamil messages with no spelling mistakes | Models trained on intent and structure (urgency + authority + payment/credential request + link), not on grammar mistakes |
| **AI chatbot scammers** | Scripted "customer care" or "investment advisor" on WhatsApp | Conversation-pattern scoring on text the user shares or that notification access captures |
| **Fake AI apps** | "ChatGPT Pro.apk", "AI photo editor" carrying malware | APK and app-store reputation checks |
| **Synthetic identity / doctored documents** | Fake Aadhaar or PAN, fake police letters on WhatsApp | Image forensics on shared documents (QR on Aadhaar verified offline with UIDAI's signed QR; letterhead/seal checks; "government never sends arrest warrants on WhatsApp") |
| **AI-generated QR / poster scams** | Fake QR stickers at shops and petrol pumps | QR scanner with merchant VPA verification |

**Honest limit:** neither iOS nor Android gives third-party apps live access to call audio (Android has blocked call recording for third-party apps since Android 10). Real-time deepfake detection *inside* a call therefore needs either **(a) an OEM partnership** (Samsung, Xiaomi, Vivo, Oppo, Realme, Lava, which ship pre-installed system apps), **(b) a telecom partnership** (network-side analysis), or **(c) user-initiated analysis** (speakerphone capture, voice notes, screen capture). The plan uses all three, in that order of ambition.

---

## 4. What each platform allows (this drives the design)

### 4.1 Android (about 95% of Indian smartphones, so this is the main platform)

| Capability | Android API | Google Play policy notes |
|---|---|---|
| Call spam identification and blocking | `CallScreeningService` (the Call Screening role) | Allowed; the user grants the role |
| Read SMS for scanning | `READ_SMS` / `RECEIVE_SMS`, **or** become the default SMS app | Restricted permission. Needs a Play declaration; spam protection is a recognised use, but approval isn't guaranteed. **Plan B:** ship as an optional default SMS app ("Raksha Messages") |
| Read WhatsApp, Telegram and SMS previews | `NotificationListenerService` | Allowed with a prominent disclosure. Android 15+ hides OTPs from untrusted listeners, which is fine for us because we don't need OTPs |
| Scan links system-wide | Local `VpnService` with DNS/SNI filtering, **or** a Private DNS (DoH/DoT) resolver run by us | VPN use is allowed for security apps with a declaration. Private DNS is easiest and uses no battery |
| Scan installed apps | `QUERY_ALL_PACKAGES`, `PackageManager`, installer source, signatures | Allowed for antivirus and security apps (needs a declaration) |
| Detect risky permission grants | `PackageManager` checks for Accessibility, Notification Listener, overlays (`SYSTEM_ALERT_WINDOW`), Device Admin, Usage Access, Install Unknown Apps, default SMS/dialer | Read-only checks; allowed |
| Detect new installs and permission changes | `PACKAGE_ADDED` broadcast; periodic `WorkManager` scans | Allowed |
| Detect remote-access or screen-sharing apps | Package list plus foreground-service and MediaProjection signals | Allowed |
| SIM change | `TelephonyManager` / `SubscriptionManager` (subscription ID changes) | Allowed with phone-state permission |
| Accessibility service (to read on-screen text in payment apps) | `AccessibilityService` | **High rejection risk**: Play only allows it for real accessibility tools or with strict justification. **Avoid it in the Play build**; offer it only in an OEM build |
| Overlay warnings | `SYSTEM_ALERT_WINDOW` or full-screen notifications | Use high-priority notifications plus in-app full-screen activities |
| Root / tamper detection | Play Integrity API | Recommended |
| QR scanning | CameraX + ML Kit barcode scanning, on the device | No issue |

Android platform features to build on, not duplicate: Play Protect live threat detection, India's enhanced fraud-protection pilot (blocks sideloaded apps that ask for SMS or notification permissions), Restricted Settings for sideloaded apps, Android 16's in-call protections and Advanced Protection mode, and Google's developer-verification rules for sideloaded apps. The app should **check that these are switched on** and guide the user to turn them on.

### 4.2 iOS (smaller share but higher-value users)

| Capability | iOS API | Notes |
|---|---|---|
| Caller ID / blocking | **Call Directory Extension** (a static block list) and **Live Caller ID Lookup** (iOS 18+, a privacy-preserving server query using homomorphic encryption) | Live Caller ID Lookup lets us check numbers in real time without seeing who the user is |
| SMS filtering | **`ILMessageFilterExtension`** (unknown senders only; can defer to our server; sorts into Transactions/Promotions/Junk) | Can't read iMessage from contacts or WhatsApp |
| Link protection | **DNS settings** (`NEDNSSettingsManager`, a DoH resolver we run), a Safari content blocker / web extension, or a packet-tunnel VPN | DNS is the cleanest choice |
| App scanning | **Not possible** (sandbox) | Instead: an iOS hygiene checklist (OS version, Lockdown Mode suggestion, configuration profiles, Screen Time / passcode) |
| Message scanning | Share Extension ("Share to Raksha"), screenshot or photo OCR, copy-paste check | User-initiated |
| QR | In-app scanner (AVFoundation / Vision) plus App Clip | Good |
| Jailbreak | Heuristics only | Limited |
| Family | Sharing through our account system | |

**Design rule:** the iOS app is a **"checker + caller ID + SMS filter + DNS shield + family + recovery"** app. The Android app adds **device-takeover detection and APK scanning**. Marketing must not promise iOS features that iOS doesn't allow (App Store guideline 2.3.1 and consumer-protection risk).

---

## 5. Telecom operator and SIM integration (India-specific advantage)

This is the strongest part of the plan, and where CYBX and others are weakest.

### 5.1 Public or regulated infrastructure to use

| System | Owner | How Raksha uses it |
|---|---|---|
| **Sanchar Saathi**: *Chakshu* (report suspected fraud calls, SMS and WhatsApp), *TAFCOP* (connections in your name), *CEIR* (block a lost or stolen phone), *KYM* (verify an IMEI), report international calls showing an Indian number | DoT | Deep-link and pre-fill reports from inside the app; monthly "check how many SIMs are in your name" reminder; device-theft flow |
| **Financial Fraud Risk Indicator (FRI)**, part of DoT's Digital Intelligence Platform | DoT | Apply to be a DIP stakeholder (as a fintech partner, or through partner banks or UPI apps) so we can check a number's Medium / High / Very High risk before the user pays |
| **CNAP** (Calling Name Presentation: KYC-verified caller names, default-on from November 2026 on 4G/5G) | DoT / TRAI / operators | Compare the CNAP name with the claimed identity ("This number is registered to an individual, not SBI") |
| **TRAI TCCCPR / DLT** sender headers and suffixes (-P promotional, -S service, -T transactional, -G government); **140-series** (telemarketing) and **1600-series** (banks, financial institutions, regulated entities) | TRAI / RBI / SEBI | Strong rules: an SMS claiming to be a bank from a 10-digit number = high risk; a call claiming to be a bank from a non-1600 number = warn |
| **1930 helpline** and **cybercrime.gov.in**; **CFCFRMS** (Citizen Financial Cyber Fraud Reporting & Management System) | I4C / MHA | "Golden hour" button: call 1930, prepare transaction details and evidence, generate a complaint draft |
| **RBI**: `.bank.in` / `.fin.in` domains, Digital Lending Apps directory, Sachet portal (unregistered deposit schemes), MuleHunter.AI (for bank partners) | RBI | Domain allow-lists; lender verification |
| **SEBI**: registered intermediaries, investment advisers, "Validated UPI handles" (`@valid`) for brokers | SEBI | Investment scam checks; pay only to validated handles |
| **NPCI**: UPI rules (P2P collect requests being phased out, payee name display) | NPCI | QR and UPI checks |
| **UIDAI**: biometric lock, Aadhaar authentication history | UIDAI | Prompts and deep links |
| **CERT-In**: advisories and threat feeds | MeitY | Threat intel ingestion; CERT-In empanelment adds credibility |
| **SIM binding for messaging apps** (DoT direction, November 2025) | DoT | Explain it to users; detect scams that exploit the transition ("verify your WhatsApp SIM binding" phishing) |

### 5.2 Telecom operator partnerships (Airtel, Jio, Vi, BSNL)

**Network APIs (GSMA Open Gateway / CAMARA, offered in India through Aduna and the operators' own API platforms):**
- **SIM Swap API:** "Was this SIM swapped in the last 72 hours?" Use it at app login and when a SIM change is detected, and offer it to bank partners.
- **Number Verification API:** silent, OTP-free verification of the user's own number (no SMS OTP to phish).
- **KYC Match API:** confirm a caller's or payee's claimed identity against operator KYC (with consent).
- **Device Status / Roaming:** a "phone is roaming abroad" signal (useful against digital-arrest gangs calling from abroad).
- **Call Forwarding Signal API** (where offered): detect unconditional forwarding.

**Commercial models with operators:**
1. **Bundled value-added service:** "Raksha Premium free with ₹399+ plans" (operators already bundle OTT apps). This could be the largest acquisition channel.
2. **Data exchange:** we send anonymised, user-confirmed scam reports (numbers, URLs, sender headers) to the operator's anti-fraud systems; they share risk scores with us. Needs careful DPDP and TRAI compliance.
3. **White-label:** "Airtel Safe powered by Raksha" for operators without their own app-side product (Vi and BSNL are the likeliest).
4. **Pre-installs through OEMs and operators** on budget Android phones (JioBharat, Lava, Itel, Redmi) to reach first-time users.

### 5.3 Banks, UPI apps and insurers
- **SDK for banks and UPI apps:** "Raksha Pay-Check" calls our risk API (VPA + number + device + FRI) before a high-value transfer.
- **Embedded cyber insurance** (like CYBX with ICICI Lombard): partner with an IRDAI-licensed insurer as a **corporate agent** or through a group-policy model; cover UPI fraud, identity theft and cyberbullying.
- **Mule-account intelligence** shared back with banks (through a regulated partner).

---

## 6. Features

### 6.1 Protection modules

**A. Scam Shield (messages and links)**
- Real-time link scanning: SMS, notifications (WhatsApp, Telegram, Instagram, Gmail), clipboard, the share sheet, and the in-app browser
- DNS shield (Private DNS on Android, DNS settings on iOS) blocks known phishing and malware domains system-wide
- URL analysis: reputation feeds, domain age (RDAP/WHOIS), certificate transparency, typosquats of Indian brands (`sbi`, `hdfc`, `icici`, `irctc`, `npci`, `indiapost`, `incometax`, `parivahan`, `uidai`), visual similarity of the landing page to bank and government pages, redirect chains, URL shorteners, and IPFS / free-hosting abuse
- Message classifier: multilingual and code-mixed (Hinglish, Tanglish, Benglish), trained on intent signals: urgency, authority, threat, reward, payment or credential request
- DLT header checks plus 1600 / 140-series rules

**B. QR Guard**
- Scan any QR before the UPI app opens it; decode `upi://pay?pa=&pn=&am=&tn=`
- Flags: "This QR will **debit** ₹X from you", payee name vs VPA mismatch, newly created or flagged VPA, non-merchant VPA on a "shop" sticker, URL QRs pointing to phishing pages, Wi-Fi QR traps
- Merchant mode: shop owners register their genuine QR so customers can verify it ("sticker swap" protection)

**C. Call Shield**
- Caller ID and spam labels: our database + CNAP name + operator risk score + FRI (where allowed)
- Context warnings: "International call showing an Indian number", "Claims to be a bank but isn't calling from the 1600-series", "Number reported 120 times for digital arrest this week"
- **Digital-arrest interrupt:** if a call or video call with an unknown number runs more than N minutes *and* a remote-access app opens, a payment app opens, or a large UPI attempt follows, show a full-screen warning and notify the family guardian
- Post-call "Was this a scam?" one-tap report (also forwarded to Chakshu with consent)

**D. Device Guard (Android)**
- **Permission auditor:** lists every app with Accessibility, Notification Access, Overlay, Device Admin, SMS, Call Log, Usage Access, Install Unknown Apps, VPN, or Default SMS/Dialer, with an explanation in plain language and a one-tap path to revoke
- **New-app watch:** risk-score every newly installed app (installer source, signature, permissions, known malware hashes, server-side static analysis of APKs)
- **APK scanner:** scan APKs in Downloads and WhatsApp/Telegram media folders, and APKs shared to Raksha
- **Remote-access detector:** AnyDesk, TeamViewer, RustDesk, AirDroid and similar; active screen capture; hidden-icon apps
- **Stalkerware detection:** indicators from the Coalition Against Stalkerware and Echap stalkerware IOC lists
- **SIM-change alert** and SIM Swap API check
- **Hygiene score:** OS patch level, screen lock, Play Protect on, unknown sources off, Google account 2-step verification, backup on, WhatsApp two-step PIN on, Aadhaar biometric lock on
- **Unsafe Wi-Fi check** (open, captive, evil-twin heuristics)

**E. Identity and data**
- Data-breach monitoring (email and phone) using breach feeds and dark-web monitoring partners
- "SIMs in my name" (TAFCOP) reminders, PAN/Aadhaar misuse guidance, CIBIL check for loans you didn't take

**F. AI Fraud Lab**
- Upload or share a **voice note, audio clip, image or video** → deepfake / synthetic-voice / manipulated-image score with an explanation
- **Ask Raksha:** a chat assistant in 12+ Indian languages. Paste any message, screenshot or story and it says whether it looks like a scam and what to do. LLM-backed, with guardrails, PII redaction and on-device pre-filtering
- **Family safe word** setup and voice-clone awareness drills

**G. Family Guardian**
- Link elderly parents or children; guardians get alerts on high-risk events (digital-arrest pattern, remote-access install, large payment after a suspicious call, SIM change)
- **Elderly mode:** big text, voice-led UI in the regional language, one big "Is this a scam?" button, auto-block unknown international calls
- Child mode: sextortion and gaming-scam education, app-install alerts

**H. Help after fraud ("Raksha SOS")**
- Golden-hour flow: call 1930 → help the user find the transaction ID, UTR and amount → bank freeze numbers → cybercrime.gov.in complaint draft (auto-filled) → evidence pack (screenshots, call log, SMS) as a PDF → Chakshu report → police FIR guidance
- Insurance claim filing (if covered)
- Follow-up reminders and tracking

**I. Education**
- 60-second scam-of-the-week stories in regional languages (video and voice)
- Simulated phishing drills (opt-in), streaks and badges (CYBX-style gamification)
- Community alerts by city/district ("New electricity-bill SMS scam in Pune")

### 6.2 Feature matrix by platform

| Feature | Android | iOS |
|---|---|---|
| Link scan: SMS | ✅ auto (permission or default SMS app) | ✅ unknown senders through the SMS filter extension |
| Link scan: WhatsApp / Telegram | ✅ auto (notification access) | ⚠️ share / copy-paste |
| DNS / web shield | ✅ | ✅ |
| QR Guard | ✅ | ✅ |
| Caller ID / spam blocking | ✅ | ✅ (Call Directory + Live Caller ID Lookup) |
| Device / permission audit | ✅ | ⚠️ hygiene checklist only |
| APK scan | ✅ | n/a |
| SIM change detection | ✅ | ⚠️ via operator SIM Swap API |
| AI Fraud Lab (uploads) | ✅ | ✅ |
| Live video deepfake check | ⚠️ screen capture with consent | ❌ |
| Family Guardian | ✅ | ✅ (fewer signals) |
| SOS / recovery | ✅ | ✅ |

---

## 7. Technical architecture

### 7.1 Overview

```
┌──────────────────────────── Device ─────────────────────────────┐
│ Android (Kotlin, Jetpack Compose)   iOS (Swift, SwiftUI)        │
│   CallScreeningService               Call Directory / LiveCallerID│
│   NotificationListener / SMS         ILMessageFilterExtension    │
│   Private DNS / local VPN            DNS Settings / Safari ext   │
│   Package & permission scanner       Share ext, App Clip (QR)    │
│   CameraX + ML Kit QR                Vision QR                   │
│ ── Shared core (Kotlin Multiplatform) ─────────────────────────  │
│   Rules engine (DLT, 1600, UPI QR, domain lists)                 │
│   On-device ML: TFLite / Core ML (text intent, URL, APK features)│
│   Local encrypted cache: bloom filters for bad URLs / numbers    │
│   Privacy layer: hash/redact before network calls                │
└───────────────┬─────────────────────────────────────────────────┘
                │ TLS 1.3 + cert pinning, Play Integrity / App Attest
┌───────────────▼──────────── Cloud (India region) ───────────────┐
│ API gateway → Risk APIs (URL, number, VPA, APK, media)           │
│ Threat-intel pipeline: feeds, crawlers, CT logs, sandbox         │
│ ML services: URL/visual phishing, message intent (multilingual), │
│   APK static/dynamic analysis, deepfake audio/video/image        │
│ LLM assistant (multilingual, RAG on scam knowledge base)         │
│ Reputation DB (numbers, URLs, VPAs, headers, APK hashes)         │
│ Partner connectors: Telco APIs (CAMARA), DIP/FRI, Chakshu, banks │
│ Family/alerts service, SOS/complaint generator, admin & analyst  │
│ console, grievance portal (for mislabelled numbers)              │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Technology choices
- **Mobile:** native shells (Kotlin/Compose, Swift/SwiftUI) because security APIs are deeply native, with a **Kotlin Multiplatform** shared core for rules, models and networking. Flutter for the UI is acceptable if the team is Flutter-first, but every protection component must still be native.
- **On-device ML:** small distilled multilingual transformer (based on MuRIL or IndicBERT, quantised to under 20 MB) for message intent; gradient-boosted URL lexical model; APK permission/feature model. Works offline. This matters for spotty connectivity and for privacy.
- **Server ML:** larger models for URL screenshot similarity (vision embeddings vs a gallery of brand pages), APK sandboxing (emulator farm, Androguard / Frida-based analysis), deepfake detection (audio anti-spoofing models in the ASVspoof style; video face-forgery models; C2PA / content-credential checks), and continuous retraining from labelled reports.
- **LLM assistant:** use a hosted frontier model through an API for explanations and the chat assistant, with PII redaction before sending, plus a RAG knowledge base of Indian scam patterns and official procedures. Consider an Indic open model (e.g. Sarvam or AI4Bharat models) for low-cost classification in regional languages.
- **Threat intel sources:** Google Web Risk (commercial), PhishTank/OpenPhish, URLhaus/MalwareBazaar, CERT-In advisories, CT log streams, our own crawler of newly registered domains with Indian-brand keywords, user reports, and telecom/bank partner feeds.
- **Backend:** Go or Kotlin microservices, PostgreSQL + Redis + ClickHouse (analytics), Kafka for event streams, object storage for samples; hosted in **Indian cloud regions** (Mumbai/Hyderabad) for data localisation and lower latency.
- **Privacy design:** check URLs with hash prefixes (Safe Browsing style); numbers through Live Caller ID-style private lookups where possible; **never upload the contact book** (a deliberate difference from Truecaller); message content analysed on the device by default, with cloud analysis only when the user opts in per message.

### 7.3 Detection approach (layered)
1. **Deterministic rules** (fast, explainable): DLT header format, 1600/140 series, `.bank.in` / `.gov.in` allow-lists, UPI QR debit intent, known-bad lists.
2. **On-device ML** (offline, private).
3. **Cloud reputation and ML** (fresh intel, heavy models).
4. **Behavioural correlation** (the real differentiator): sequences such as *unknown call → remote-access app install → UPI app opened → large transfer* trigger the digital-arrest interrupt, even when no single signal is conclusive.
5. **Human analyst loop:** a SOC-style team reviews reported items, trending campaigns and appeals.

---

## 8. Legal, regulatory and compliance

| Area | Requirement | Action |
|---|---|---|
| **DPDP Act 2023 + DPDP Rules 2025** (notified 13 Nov 2025; most obligations phase in by about May 2027; consent-manager provisions from Nov 2026) | Notice and consent, purpose limitation, deletion, breach notification, children's data (verifiable parental consent), grievance redressal | Privacy by design, a DPO, consent logs, data minimisation, a DPIA. Family/child features need parental-consent flows. Plan for "Significant Data Fiduciary" obligations if we get big |
| **IT Act 2000 / IT Rules 2021** | Intermediary due diligence (if we host user reports or labels), grievance officer | Grievance portal; **appeal process for wrongly labelled numbers, businesses and URLs** (defamation risk) |
| **CERT-In Directions (2022)** | Report cyber incidents within 6 hours, keep logs for 180 days, sync clocks | Incident response runbook |
| **Telecom Act 2023 / Telecom Cyber Security Rules 2024 and 2025 amendment** | Rules on telecom identifiers and data sharing with operators | Legal review before operator data exchange |
| **TRAI TCCCPR** | Rules for any messaging we send (alerts) | Use DLT-registered headers for SMS alerts |
| **RBI / NPCI** | If we touch payments or bank SDKs: outsourcing, data localisation (payment data stored in India) | Partner through regulated entities |
| **IRDAI** | Embedded insurance needs a licensed intermediary | Corporate agent registration or a partner insurer's group policy |
| **Google Play policies** | SMS/Call Log permissions, Accessibility, VPN, QUERY_ALL_PACKAGES, prominent disclosure, Data Safety form | Prepare declaration videos; fallback designs (default SMS app, notification listener, DNS) |
| **Apple App Store** | Accurate claims, privacy nutrition labels, extension rules | No exaggerated "full antivirus" claims on iOS |
| **Accessibility (GIGW / WCAG)** | Elderly and differently-abled users | Large text, TalkBack/VoiceOver, voice UI |

---

## 9. Go-to-market (India)

### 9.1 Target segments
1. **Families with elderly parents** (the paying decision-maker is the 25–45-year-old child): Family plan.
2. **Mass-market first-time smartphone users** (Bharat, tier 2/3): free tier, distributed through operators and OEM pre-installs, voice-first regional UX.
3. **Small merchants** (QR sticker-swap, fake payment screenshots, "refund" scams): merchant mode.
4. **Enterprises / employers** (employee protection bundles), **banks** (SDK), **telecom operators** (white-label).

### 9.2 Pricing (indicative)
| Plan | Price | Includes |
|---|---|---|
| Free | ₹0 | Link/QR/message check, caller ID, SOS, education |
| Premium | ₹49/month or ₹399/year | Auto-scanning, device guard, DNS shield, AI Fraud Lab, breach monitoring |
| Family (up to 6) | ₹699/year | Premium for all + guardian alerts + elderly mode |
| Family + Insurance | ₹999–1,499/year | + cyber insurance cover (₹50k–₹2 lakh tiers via partner insurer) |
| B2B / operator / bank | Per-user per-month or per-API-call | White-label, SDK, risk API |

### 9.3 Channels
- Operator bundles (largest), OEM pre-install, bank/UPI app co-marketing
- Regional-language short video (YouTube Shorts, Instagram Reels, ShareChat/Moj), WhatsApp channel with daily scam alerts
- Partnerships with state police cyber cells and I4C "Cyber Dost"-style awareness campaigns, RWAs, senior-citizen associations, colleges
- Referral program ("Protect your parents")

### 9.4 Languages (phased)
- **Launch:** English, Hindi, Bengali, Marathi, Telugu, Tamil
- **+3 months:** Gujarati, Kannada, Malayalam, Odia, Punjabi, Assamese
- **Later:** Urdu, Bhojpuri (voice), and the remaining scheduled languages, using AI4Bharat / Bhashini translation and speech

---

## 10. Roadmap

### Phase 0: Foundations (Month 0–1)
- Company setup, legal counsel (DPDP, telecom, IRDAI), trademark search
- Threat-intel pipeline v0 (feeds + Indian-brand typosquat crawler)
- Collect and label datasets: Indian scam SMS/WhatsApp in 6 languages (crowdsourced plus public reports)
- Start Play policy pre-assessment; register with Sanchar Saathi / DIP partner programmes; approach CERT-In empanelment partners

### Phase 1: MVP (Month 1–4)
- **Both platforms:** link/QR/message checker (manual + share sheet), caller ID and spam blocking, DNS shield, SOS flow (1930 / cybercrime.gov.in / Chakshu), education feed, Hindi + English
- **Android:** SMS + notification auto-scan, permission auditor, new-app risk check, remote-access detector, SIM-change alert
- **iOS:** SMS filter extension, Call Directory, Live Caller ID Lookup server
- Backend: URL/number/VPA reputation APIs, on-device text model v1
- **Beta:** 5,000 users across 3 cities; measure false-positive rates

### Phase 2: v1 public launch (Month 4–8)
- Family Guardian + elderly mode; 6 languages
- APK scanner + server sandbox; stalkerware detection
- Behavioural digital-arrest interrupt
- Ask Raksha assistant (LLM)
- Premium subscriptions; first insurance partner
- First telecom pilot (SIM Swap + Number Verification APIs)

### Phase 3: Scale and AI defence (Month 8–14)
- AI Fraud Lab: voice-clone and deepfake detection for uploads; Android screen-capture video-call check
- Bank/UPI SDK and risk API; FRI integration through partners
- Operator bundle launch; OEM pre-install deal
- 12 languages; merchant mode; community district alerts
- Get independent testing and certification (e.g. AV-TEST / AV-Comparatives mobile tests, and a CERT-In empanelled auditor's report). Publish transparency reports

### Phase 4: Ecosystem (Month 14–24)
- Network-side voice-scam detection with an operator (real-time call analysis at the network, with consent and lawful basis)
- OEM system-level integration (real-time in-call deepfake / scam-conversation warning)
- Enterprise and government-employee programmes
- Expansion to Bangladesh, Nepal, Sri Lanka and Indonesia (similar scam patterns)

---

## 11. Team (first 12 months, about 20–28 people)

| Role | Count |
|---|---|
| Android engineers (security APIs) | 4 |
| iOS engineers | 2 |
| Backend / platform engineers | 4 |
| ML engineers (NLP Indic, URL/vision, audio deepfake) | 4 |
| Threat-intel analysts / malware reversers | 3 |
| Product designer (voice/regional UX) + UX researcher | 2 |
| Product manager | 1–2 |
| Legal / compliance / DPO (part-time + counsel) | 1 |
| Partnerships (telecom, banks, insurers) | 2 |
| Growth / content (regional languages) | 3 |
| Customer support / SOS desk | 2–4 |

**Indicative year-1 budget:** about ₹8–15 crore, depending on salaries, paid acquisition and threat-intel licences. The biggest variable is marketing; operator bundles lower acquisition costs a lot.

---

## 12. Success metrics

| Metric | Target (end of year 1) |
|---|---|
| Installs / MAU | 2M installs / 600k MAU (much higher with an operator bundle) |
| Scam detection rate (on a labelled Indian test set) | ≥ 95% for links, ≥ 90% for messages |
| False-positive rate | ≤ 0.5% for messages, ≤ 0.1% for blocked domains |
| Time from a new phishing domain appearing to being blocked | under 30 minutes (median) |
| SOS completions within the golden hour | ≥ 60% of fraud reports |
| ₹ fraud prevented (estimated) | Report quarterly, with a published method |
| Paid conversion | 3–5% of MAU |
| Play Store rating | ≥ 4.4 |

---

## 13. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Google Play rejects the SMS or Accessibility permissions | Design around the notification listener + DNS + default-SMS-app option; no Accessibility in the Play build; OEM channel for deeper features |
| False positives (blocking real banks or businesses) → anger, legal action | Allow-lists of verified senders (DLT, 1600, `.bank.in`); "warn, don't block" by default; a fast appeal portal |
| Scammers adapt quickly | Behavioural correlation + daily retraining + a human analyst team |
| Battery / performance complaints on budget phones | DNS-based shield, on-device models under 20 MB, WorkManager batching, test on ₹7–10k phones |
| Privacy backlash | No contact upload, on-device analysis by default, published privacy and transparency report, DPDP compliance |
| OS vendors build the same features (Google, Apple, operators) | Position as the India-specific layer that brings everything together: recovery, family, languages, telecom/bank/government links. Partner, don't compete |
| Insurance claims cost | Strict partner underwriting; cover limits; claims fed back into detection improvement |
| Over-claiming deepfake detection | Show probabilities with explanations; tell users "if in doubt, call back on a saved number" |

---

## 14. Next steps (next 2–4 weeks)
1. Validate demand: 30 interviews (families with elderly parents, small merchants, tier-2 users) + a landing page with a waitlist.
2. Build a **scam dataset**: collect 10k+ real Indian scam messages, numbers and URLs (with consent) in Hindi, English and 2 more languages.
3. Prototype the Android **permission auditor + QR Guard + link checker** (a 4–6 week spike) to test the core value.
4. Legal consult on DPDP, Play policy and telecom data sharing.
5. Open conversations with one operator API team (Airtel or Jio through their CAMARA/Open Gateway programmes), one bank's fraud team, and one insurer.
6. Apply to relevant government programmes (DoT DIP stakeholder onboarding through a regulated partner, MeitY Startup Hub, CERT-In awareness partnerships).

---

## Sources

- [CYBX official site](https://cybx.in/) · [CYBX on Google Play](https://play.google.com/store/apps/details?id=com.moons63.cybx&hl=en_IN)
- [Free Press Journal: Inside CYBX Version 2](https://www.freepressjournal.in/latest-news/inside-cybx-version-2-how-63sats-is-building-a-cybersecurity-super-app-that-speaks-indias-language)
- [ANI: 63SATS unveils CYBX Version 2](https://aninews.in/news/business/63sats-cybertech-unveils-cybx-version-2-to-empower-nextgen-digital-safety20260422142011/)
- [Digit: CYBX offers ₹10 lakh insurance against financial scams](https://www.digit.in/features/general/cybx-smartphone-security-offers-10-lakh-insurance-against-financial-scam.html)
- [DoT: Financial Fraud Risk Indicator (PDF)](https://www.sancharsaathi.gov.in/SancharSaathiDocuments/ImportantDocuments/DoT%20Introduces%20Financial%20Fraud%20Risk%20Indicator%20(FRI)%20to%20strengthen%20Cyber%20Fraud%20Prevention.pdf)
- [DoT–FIU-India MoU (PDF)](https://www.sancharsaathi.gov.in/SancharSaathiDocuments/ImportantDocuments/DoT%20and%20Financial%20Intelligence%20Unit-%20India%20Sign%20Landmark%20MoU%20to%20Combat%20Cyber%20Crimes%20and%20Financial%20Frauds.pdf)
- [MediaNama: FRI and UPI](https://www.medianama.com/2025/05/223-dot-financial-fraud-risk-indicator-upi/)
- [The Week: digital-arrest crimes tripled 2022–24](https://www.theweek.in/wire-updates/national/2025/03/12/del54-rsq-cybercrime.html)
- [Moneylife: India losing over ₹22,000 crore a year to cyber scams](https://moneylife.in/article/fraud-alert-india-is-losing-over-22000-crore-a-year-in-cyber-scams-and-the-worst-is-yet-to-come/80612.html)
- [MediaNama: India blocks WhatsApp and Skype IDs over digital arrests](https://www.medianama.com/2025/03/223-india-blocks-whatsapp-skype-ids-sims-to-tackle-digital-arrests/)
- [ORF: Deepfakes and financial cybercrime in India](https://orfonline.org/research/deepfakes-and-financial-cybercrime-india-s-multi-layered-response)
- [GSMA: Bharti Airtel spam and scam prevention with AI](https://www.gsma.com/solutions-and-impact/technologies/security/scams/general/bharti-airtel-spam-and-scam-prevention-with-ai/)
- [TRAI: Airtel response to draft TCCCP (3rd Amendment) 2026 (PDF)](https://www.trai.gov.in/sites/default/files/2026-04/Airtels%20Response%20to%20Draft%20TCCCP%20%283rd%20Amendment%29%20Regulations%2C%202026.pdf)
- [Inc42: Centre directs telcos to display caller names from November 1](https://inc42.com/buzz/centre-directs-telcos-to-display-caller-names-from-november-1/)
- [ThePrint: Caller name display mandatory](https://theprint.in/india/no-more-unknown-callers-govt-makes-caller-name-display-mandatory-from-1-november/3072774/)
- [SCC Online: DPDP Rules 2025 highlights](https://www.scconline.com/blog/post/2025/12/26/digital-personal-data-protection-rules-2025-key-highlights/)
- [KPMG: DPDP Rules 2025 guidance (PDF)](https://assets.kpmg.com/content/dam/kpmgsites/in/pdf/2025/11/dpdp-rules-2025-guidance-to-dpdp-act-implementation.pdf)
- [Google: Enhanced fraud protection pilot in India](https://blog.google/intl/en-in/products/launching-enhanced-fraud-protection-pilot-in-india/)
- [TechCrunch: Google pilots blocking some sideloaded apps in India](https://techcrunch.com/2024/10/03/google-pilots-blocking-some-sideloaded-apps-in-india)
- [Inc42: DoT mandates SIM binding for WhatsApp, Telegram](https://inc42.com/buzz/dot-mandates-sim-binding-for-whatsapp-telegram)
- [Scroll: Why DoT mandated SIM binding](https://scroll.in/article/1088890/why-indias-telecom-department-has-mandated-sim-binding-for-whatsapp-some-other-app-services)
- [IFF: Recall the SIM binding direction](https://www.internetfreedom.in/iff-calls-on-dot-to-recall-the-sim-binding-direction/)

*Some statements about platform APIs (Android `CallScreeningService`, `NotificationListenerService`, Android 15 OTP redaction, iOS `ILMessageFilterExtension`, Live Caller ID Lookup), RBI's `.bank.in` domains, the 1600-series numbers, SEBI's `@valid` UPI handles, NPCI's P2P-collect phase-out and DoT's USSD call-forwarding change are from background knowledge. Check them against the current official documentation before building.*
