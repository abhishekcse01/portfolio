# Spec 01: Link & Message Shield

## 1. Purpose
Catch phishing links, malicious downloads and scam messages wherever they arrive (SMS, WhatsApp, Telegram, Instagram, email, browser, clipboard) before the user acts on them.

## 2. User stories
| ID | As a… | I want… | So that… |
|---|---|---|---|
| LM-1 | user | an automatic warning when an SMS contains a phishing link | I don't open it by mistake |
| LM-2 | user | WhatsApp/Telegram links checked as messages arrive | forwarded scams are caught |
| LM-3 | user | to share any message or screenshot to Raksha and get a verdict | I can check things myself |
| LM-4 | user | dangerous sites blocked in any browser or app | a tap on a bad link can't hurt me |
| LM-5 | user | to know *why* something is dangerous, in my language | I learn to spot scams |
| LM-6 | user | to report a scam message in one tap (also to Chakshu) | others are protected |
| LM-7 | user | to mark a false alarm | my bank's real messages aren't flagged again |

## 3. Entry points

| Entry point | Android | iOS |
|---|---|---|
| Incoming SMS | `SMS_RECEIVED` broadcast (with approved `RECEIVE_SMS`) **or** default SMS app mode | `ILMessageFilterExtension` (unknown senders only) |
| Messaging apps (WhatsApp, Telegram, Instagram, Signal, Gmail) | `NotificationListenerService` reads notification title/text | Not available, use share / copy |
| Clipboard | Check when the Raksha app or its widget is opened (Android 10+ restricts background clipboard access) | Paste button in app (iOS 16+ paste prompt) |
| Share sheet | `ACTION_SEND` intent filter for text, URLs and images | Share Extension |
| Screenshot / image | Share or pick image → on-device OCR (ML Kit Text Recognition, Devanagari + Latin; other scripts via cloud OCR with consent) | Vision `VNRecognizeTextRequest` |
| Any network request | Private DNS (DoT/DoH) resolver `dns.raksha.app` **or** local `VpnService` | `NEDNSSettingsManager` (DoH), optional Safari Web Extension |
| In-app browser | "Open safely" links in a Raksha WebView with live checks | Same, `WKWebView` |

## 4. UX flows

### 4.1 Auto-scan warning (Android, SMS or notification)
1. Message arrives → extracted URLs and text checked on device (< 150 ms).
2. If `SUSPICIOUS` or `DANGEROUS`, Raksha posts a **heads-up notification**:
   - Title: "⚠️ Dangerous link in SMS from AX-SBIBNK?" (sender shown)
   - Body: one-line reason ("Fake SBI website, created 2 days ago")
   - Actions: **Details** · **Report** · **It's safe**
3. For `DANGEROUS`, if the user taps the link anyway, the DNS shield blocks the domain and shows the Raksha block page (served by the resolver's sinkhole IP over HTTPS on our domain, or a local page in VPN mode).
4. Details screen: verdict badge, reasons (plain language + icons), "What scammers want" (e.g. "your card number and OTP"), actions: Block sender, Report to Chakshu, Delete message (default SMS app mode only), Share warning with family.

### 4.2 Manual check
Home screen → big **"Check something"** button → paste / scan / share / pick screenshot → result card within 2 s (cloud) or instantly (on-device verdict first, cloud refines it).

### 4.3 Block page (DNS shield)
Text: "Raksha blocked this website. It pretends to be **State Bank of India** to steal your login details." Buttons: **Go back** (primary) · **Report mistake** · "Open anyway" hidden behind a 5-second hold for `SUSPICIOUS` (not offered for `DANGEROUS` malware or phishing).

### 4.4 iOS SMS filter
Unknown-sender SMS → extension classifies → iOS files it under *Junk* (dangerous) or *Promotions / Transactions*. The user sees the Raksha verdict when they open the Raksha app's "Filtered messages" summary (the extension can't show notifications itself, so counts come from shared App Group storage).

## 5. Detection logic

### 5.1 Pipeline
```
input → normalise → extract (URLs, phone numbers, VPAs, amounts, sender header)
      → L1 rules (on device)
      → L2 on-device ML (text intent model + URL lexical model)
      → L3 local bloom filter (known-bad URL/domain hashes, refreshed every 30 min)
      → if not conclusive and network available: L4 cloud lookup (hash prefix) + cloud models
      → combine → verdict
```
Target latency: L1–L3 under 150 ms p95 on a budget phone; L4 under 800 ms p95.

### 5.2 Normalisation
- Unicode NFKC; strip zero-width characters; map homoglyphs (Cyrillic "а" → "a", "0" vs "o" in domains) for comparison
- Punycode decode (`xn--`) and flag mixed-script domains
- Expand URL shorteners server-side (bit.ly, tinyurl, cutt.ly, is.gd, rb.gy, t.ly, shorturl.at, wa.me links, and Indian-specific ones) with a headless fetcher that follows up to 10 redirects and doesn't execute downloads
- Transliterate Hinglish/romanised Indic text to a common form for the model

### 5.3 Sender-header rules (SMS)
TRAI DLT headers look like `XY-ABCDEF-S`, where `XY` is the operator/circle prefix, `ABCDEF` the registered header and the suffix the category (`-P` promotional, `-S` service, `-T` transactional, `-G` government).

| Rule | Condition | Reason code | Weight |
|---|---|---|---|
| R1 | Message claims a bank / government / courier brand (NER match) **and** sender is a 10-digit mobile number | `SENDER_BRAND_FROM_MOBILE` | +45 |
| R2 | Header matches a verified brand's registered header list **and** links point only to that brand's allow-listed domains | `SENDER_VERIFIED_BRAND` | −40 |
| R3 | Header resembles a brand header but isn't on its list (`SBIBNK` vs `SBlBNK`) | `SENDER_HEADER_LOOKALIKE` | +35 |
| R4 | `-P` (promotional) header carries OTP, KYC or account-block content | `SENDER_CATEGORY_MISMATCH` | +20 |
| R5 | International number (`+` non-91) claiming an Indian brand | `SENDER_INTL_INDIAN_BRAND` | +40 |

Verified header lists come from public DLT data where available, bank/partner submissions and manual curation.

### 5.4 URL rules and features

| Signal | Reason code | Weight (indicative) |
|---|---|---|
| Domain on curated block list / threat feed | `URL_KNOWN_BAD` | +80 |
| Domain claims a bank but isn't on `.bank.in` and isn't the bank's legacy allow-listed domain | `URL_BANK_NOT_BANKIN` | +40 |
| Brand name in subdomain or path on an unrelated domain (`sbi.secure-login.xyz`, `xyz.com/hdfc/`) | `URL_BRAND_IN_PATH` | +30 |
| Typosquat (edit distance ≤ 2, homoglyph, added words like `-kyc`, `-update`, `-reward`) of a protected brand | `URL_TYPOSQUAT` | +40 |
| Domain age under 7 days / under 30 days (RDAP) | `URL_AGE_LT_7D` / `URL_AGE_LT_30D` | +25 / +10 |
| Cheap or abused TLD (`.top`, `.xyz`, `.icu`, `.cyou`, `.buzz`, `.shop`, `.live`, `.cc`) combined with a brand | `URL_RISKY_TLD` | +10 |
| Raw IP address URL | `URL_IP_HOST` | +20 |
| Direct `.apk` download or `Content-Type: application/vnd.android.package-archive` | `URL_APK_DOWNLOAD` | +35 (more if from a messaging context) |
| Free hosting / form builders / IPFS gateways (`*.web.app`, `*.pages.dev`, `*.vercel.app`, `*.netlify.app`, `forms.gle` with credential fields, `ipfs.io`) **and** brand cues | `URL_FREE_HOST_BRAND` | +25 |
| Landing page looks like a bank or government page (visual embedding similarity ≥ 0.85) but the domain isn't theirs | `URL_VISUAL_CLONE` | +50 |
| Page asks for card number + CVV + OTP, MPIN, or Aadhaar + OTP | `URL_CREDENTIAL_HARVEST` | +40 |
| `.gov.in` / `.nic.in` / allow-listed official domain | `URL_OFFICIAL_ALLOWLIST` | −60 |

Protected-brand list (v1, about 300 entries): all scheduled commercial banks, major small-finance and payments banks, UPI apps, card networks, IRCTC, India Post, EPFO, Income Tax, GST, UIDAI, Parivahan / e-challan, electricity boards (state DISCOMs), LPG companies, telecom operators, top e-commerce, courier companies, LIC and major insurers, top brokers.

### 5.5 Message-intent model
- **Model:** distilled multilingual transformer (MuRIL / IndicBERT family) fine-tuned on Indian scam data, quantised INT8, under 20 MB, TFLite on Android, Core ML on iOS.
- **Outputs:** multi-label probabilities for `URGENCY`, `AUTHORITY_IMPERSONATION`, `THREAT_LEGAL`, `REWARD_PRIZE`, `PAYMENT_REQUEST`, `CREDENTIAL_REQUEST`, `JOB_TASK_OFFER`, `INVESTMENT_PITCH`, `LOAN_OFFER`, `SEXTORTION`, `BENIGN_TRANSACTIONAL`, `BENIGN_OTP`, `BENIGN_PROMO`.
- **Scam category mapping:** e.g. `AUTHORITY_IMPERSONATION + THREAT_LEGAL` → `DIGITAL_ARREST`; `JOB_TASK_OFFER + PAYMENT_REQUEST` → `TASK_SCAM`.
- **Languages:** v1 en, hi, Hinglish, bn, mr, te, ta; others through transliteration + cloud fallback.
- **Training data:** user-donated reports (with consent), public Chakshu / cybercrime awareness samples, synthetic data generated by an LLM from templates of real campaigns (marked synthetic, capped at 30% of training data), benign SMS from consenting beta users.
- **Calibration:** temperature scaling per language; thresholds chosen for ≤ 0.5% false-positive rate on the benign test set.

### 5.6 Score combination
```
score = clamp(0, 100,
          Σ rule_weights
        + 40 * p_scam(text_model)            // max over scam labels
        + 35 * p_phish(url_model)
        + intel_bonus                         // known-bad = force ≥ 85
        - allowlist_credit)
```
Hard overrides: known-bad → `DANGEROUS`; verified brand header + all links allow-listed → `SAFE` unless a known-bad hit exists.

## 6. DNS shield

| Item | Spec |
|---|---|
| Resolver | Anycast DoH/DoT at `dns.raksha.app`, India PoPs (Mumbai, Chennai, Delhi, Hyderabad) |
| Upstream | Recursive resolver (Unbound/Knot) with DNSSEC validation |
| Policy | Block list (phishing, malware, scam, fake loan, fake trading), per-user allow list, optional categories (adult, gambling) for child mode |
| Block response | Sinkhole IP serving the localised block page over HTTPS (certificate for our domain; other hosts show the browser's error, so the Android VPN mode or iOS notification explains it) |
| Privacy | No query logs tied to user identity; aggregate counters only; per-device token rotates daily |
| Android setup | Guided Settings → Network → Private DNS → `dns.raksha.app` (can't be set programmatically), or VPN mode one-tap |
| iOS setup | `NEDNSSettingsManager` configuration installed by the app; user enables it in Settings → VPN & Device Management → DNS |
| Freshness | Block-list propagation under 5 minutes from verdict to resolver |

## 7. Data model

```sql
-- server
url_reputation(
  url_hash BYTEA PRIMARY KEY,      -- sha256(normalised URL)
  domain TEXT, etld1 TEXT,
  verdict TEXT, score SMALLINT, category TEXT,
  reasons JSONB, first_seen TIMESTAMPTZ, last_seen TIMESTAMPTZ,
  source TEXT[],                   -- feed names, 'user_report', 'crawler'
  report_count INT, fp_count INT
);
sender_header(
  header TEXT PRIMARY KEY, brand_id INT, category CHAR(1),
  verified BOOL, allowed_domains TEXT[]
);
brand(
  brand_id SERIAL PRIMARY KEY, name TEXT, aliases TEXT[],
  official_domains TEXT[], official_numbers TEXT[], logo_embedding VECTOR(512)
);
message_report(
  report_id UUID PRIMARY KEY, user_pseudo_id UUID, channel TEXT,
  sender TEXT, text_redacted TEXT, urls TEXT[], language TEXT,
  user_label TEXT, created_at TIMESTAMPTZ, donated_for_training BOOL
);
```

On device (encrypted SQLite / Room / Core Data): `local_verdict_cache` (subject hash → verdict, TTL), `user_allowlist`, `filtered_messages_summary` (counts only on iOS).

## 8. APIs

```
POST /v1/check/url
  { "url_hash_prefix": "a1b2c3d4", "context": "sms|whatsapp|browser|manual", "lang": "hi" }
→ { "matches": [ { "url_hash": "…", "verdict": "DANGEROUS", "score": 91, "reasons": [...] } ] }

POST /v1/check/url/full          // only if the user opted in, or for manual checks
  { "url": "https://…", "context": "manual" }
→ verdict object (spec 00)

POST /v1/check/message           // manual checks, user-initiated
  { "text": "…redacted on device…", "sender": "VM-SBIBNK-S", "lang": "hi" }
→ verdict object

POST /v1/report
  { "subject_type": "message", "payload": {...}, "label": "scam|safe", "forward_to_chakshu": true }

GET  /v1/intel/bloom?since=<version>  → binary delta of known-bad hashes
GET  /v1/rules/bundle?since=<version> → signed rules + brand list + header list
```
All requests: device attestation token (Play Integrity / App Attest), rate-limited per device.

## 9. Platform implementation notes

**Android**
- Notification listener: read `EXTRA_TEXT`, `EXTRA_BIG_TEXT` and `EXTRA_TEXT_LINES`, filtered to an allow list of packages (`com.whatsapp`, `com.whatsapp.w4b`, `org.telegram.messenger`, `com.instagram.android`, `com.google.android.apps.messaging`, `com.google.android.gm`, Samsung/Xiaomi messaging apps…). Ignore ongoing/media notifications. De-duplicate by a hash of (package, conversation, text).
- Respect Android 15+ sensitive-notification redaction (OTPs hidden); never try to work around it.
- Play declaration for SMS: "SMS-based spam/fraud protection". If rejected, ship the **default SMS app** mode ("Raksha Messages", RCS isn't available to third parties, so message as SMS only) and rely on the notification listener for Google Messages users.
- Work: `WorkManager` for bloom/rules refresh (every 30 min on unmetered, 2 h on metered networks).

**iOS**
- `ILMessageFilterExtension` with `ILMessageFilterExtensionNetworkURL` deferral to `https://sms.raksha.app/v1/ios/filter` (Apple relays the request without user identity; respond within the time limit).
- Share Extension memory limit: run OCR on a downscaled image; call the cloud for the full verdict.
- DNS settings config uses DoH; detect whether it's enabled and nudge the user if it's off.

## 10. Edge cases
- Legitimate bank emails using marketing link trackers (`click.bank.com`, `t.co`): expand and judge the final destination, but credit verified senders.
- OTP messages: never flagged just for containing an OTP; flag only if paired with "share this code with our executive".
- Government links on `*.gov.in` sub-portals hosted on unusual subdomains: allow-list via the eTLD+1 rule.
- Regional scripts mixed with English in a single message.
- Long WhatsApp forwards where the notification text is truncated: mark "check full message" and offer share-to-Raksha.
- Messages from contacts: still scanned (compromised friends' accounts forward scams) but weighted −10.
- Offline: on-device verdict only, labelled "Offline check"; re-check when back online and update the notification if it changes.

## 11. Metrics
- Phishing-link recall ≥ 95% on the Indian test set; message false-positive rate ≤ 0.5%; DNS false-positive rate ≤ 0.1% of blocked domains appealed and upheld
- p95 latency targets above
- Warning override rate (by reason code): above 30% means the rule needs review
- Time from first report to global block: median under 30 minutes

## 12. Acceptance criteria
- [ ] SMS with an `sbi-kyc-update[.]in` link from a 10-digit number → `DANGEROUS` notification in under 1 s, in the user's language
- [ ] Genuine HDFC transactional SMS from `VM-HDFCBK-T` with an `hdfcbank.com` link → no warning
- [ ] WhatsApp message "Your parcel is held, pay ₹25 customs: hxxp://indiapost-redelivery[.]top" → `DANGEROUS`, category `PARCEL_SCAM`
- [ ] With the DNS shield on, opening a known phishing domain in Chrome shows the block page
- [ ] Screenshot of a scam message shared to Raksha → OCR + verdict in under 3 s
- [ ] "It's safe" on a flagged message stops future warnings for that sender + domain pair and sends an FP report
- [ ] Works with no network (rules + on-device model), labelled as an offline check
