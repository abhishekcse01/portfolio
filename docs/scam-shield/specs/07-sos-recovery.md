# Spec 07: SOS & Recovery

## 1. Purpose
When fraud has already happened, speed decides whether money comes back. India's **1930 helpline** and the **CFCFRMS** system (Citizen Financial Cyber Fraud Reporting and Management System) can put a hold on money in the receiving accounts if the complaint arrives quickly (the "golden hour"). Raksha SOS guides a panicking person through every step, in their language, in the right order, and produces a complete evidence pack.

## 2. User stories
| ID | As a… | I want… | So that… |
|---|---|---|---|
| SOS-1 | victim | one button that tells me exactly what to do now | I don't waste the golden hour |
| SOS-2 | victim | help finding the transaction ID / UTR, amount and the scammer's UPI ID | the complaint is complete |
| SOS-3 | victim | my bank's fraud number and the exact words to say | my bank blocks the card / account fast |
| SOS-4 | victim | a filled-in complaint I can submit on cybercrime.gov.in | I don't struggle with forms |
| SOS-5 | victim | all evidence collected into one PDF | police and the bank have everything |
| SOS-6 | victim | reminders and a tracker for follow-ups | I don't give up on recovery |
| SOS-7 | insured user | to file an insurance claim from the same flow | I get compensated |
| SOS-8 | someone not yet paid but being threatened | to know I'm safe and what to do | I stop the scam before paying |

## 3. Entry points
- Home: **"I've been cheated / I think I'm being scammed"** (big red button; in elderly mode one of the 3 tiles)
- Digital-arrest interrupt (spec 03) → "Get help"
- Ask Raksha assistant (spec 05) when it detects "I already paid"
- Notification after a high-value payment that followed a `DANGEROUS` warning: "Did you just get scammed? Get help now"
- Guardian can start SOS on behalf of the protected member (spec 06)

## 4. Triage (first screen, ≤ 3 questions)
1. **What happened?** Money was taken · I shared OTP/PIN/password · Someone has access to my phone · I'm being threatened (digital arrest / sextortion / loan recovery) · My SIM / phone stopped working · Lost or stolen phone · Other
2. **When?** In the last hour · Today · Earlier
3. **How much?** (if money) amount + method: UPI · card · net banking · wallet · cash deposit · crypto · gift cards

Triage selects a playbook. Every playbook starts with the steps that stop further loss, then reporting, then recovery.

## 5. Playbooks

### 5.1 Money lost through UPI / bank transfer (golden hour)
| Step | Action | App support |
|---|---|---|
| 1 | **Call 1930 now** | One-tap dial; while ringing, the screen shows "What they will ask you" with fields already filled in (name, phone, bank, amount, time, UTR, scammer VPA/account) |
| 2 | Find transaction details | Guided screens per UPI app (screenshots showing where the UTR is in PhonePe, GPay, Paytm, BHIM, bank apps); OCR from a screenshot of the transaction; on Android with SMS access, parse the bank debit SMS (amount, UTR, time, account) |
| 3 | Call your bank's fraud line and block | Bank directory with 24×7 fraud numbers; script in the user's language ("I want to report unauthorised transaction of ₹X, UTR …, please block my debit card / UPI / net banking"); RBI's rule: report within 3 working days for zero/limited liability (link to RBI customer-protection circular summary) |
| 4 | File on **cybercrime.gov.in** (Report financial fraud) | Pre-filled draft with all fields; copy-paste helpers for each field; a step-by-step overlay explaining each page of the portal; the user submits themselves (no automation of a government portal) |
| 5 | Save the acknowledgement number | Field to save it; reminder to track |
| 6 | Report the numbers/links/VPAs to **Chakshu** and Raksha | One tap (pre-filled) |
| 7 | Secure accounts | Change UPI PIN, net-banking password, email password; log out other sessions; check linked devices on WhatsApp |
| 8 | FIR / police station | Nearest cyber police station (district list); FIR template with the complaint number |
| 9 | Insurance claim (if covered) | Spec 5.7 |
| 10 | Follow-up | Reminders at 24 h, 3 days, 7 days, 30 days: check the complaint status, contact the bank's nodal officer, escalate to the RBI Ombudsman (cms.rbi.org.in) after 30 days without resolution |

### 5.2 OTP / PIN / password shared (no money lost yet)
1. Call bank → block card / UPI / net banking now
2. Change passwords and PINs (deep links)
3. Check for and remove unknown apps (spec 04 quick scan)
4. Watch SMS for debits for 72 h (Raksha monitors on Android)
5. Report the number to Chakshu

### 5.3 Phone access (remote app / malware)
1. **Turn on flight mode** (stops remote control and OTP theft) → instructions with pictures
2. Uninstall the remote-access/malicious app (Device Guard list → uninstall; if it's a device admin, remove the admin first; Safe Mode instructions per OEM)
3. From another phone: call bank → block
4. Change passwords from a different, clean device
5. Factory reset guidance if the app can't be removed; backup advice first

### 5.4 Being threatened (digital arrest / sextortion / loan-app harassment)
- **Digital arrest:** "This is a scam. You are not under arrest. Police never do this. End the call." Block the number, report to Chakshu and 1930, tell family (one tap to guardian). If money was paid → 5.1.
- **Sextortion:** "Don't pay; paying leads to more demands. You are not alone." Steps: stop replying, don't delete evidence, report at cybercrime.gov.in (women/child section), report the account on the platform, block. Helplines: 1930, 181 (women), 1098 (children). Option to talk to a counsellor partner.
- **Loan-app harassment:** don't pay unknown "recovery" demands; check whether the lender is RBI-registered (Digital Lending Apps list); report the app on Sachet / RBI and to Google Play; how to handle morphed images (cybercrime.gov.in, platform takedown); revoke contacts/photos permissions and uninstall.

### 5.5 SIM stopped working / SIM swap suspected
1. Call the operator from another phone (operator helpline directory) → block SIM
2. Call banks → block (SIM swaps precede account takeover)
3. Check for email/UPI changes
4. Get a replacement SIM at an operator store with ID
5. Check TAFCOP ("SIMs in my name") on Sanchar Saathi

### 5.6 Lost or stolen phone
1. Block the SIM (operator), 2. **Block the IMEI on CEIR** (Sanchar Saathi; needs a police complaint number; guide to the e-FIR/lost-article report), 3. Remote-wipe/lock via Find My Device / Find My, 4. Block UPI and banking apps through the banks, 5. Change Google/Apple account password.

### 5.7 Insurance claim (Family + Insurance plan)
- Pre-filled claim form from the SOS data; required documents checklist (FIR copy, cybercrime complaint acknowledgement, bank statement, bank's dispute letter); upload through the insurer partner's API; claim status tracking in the app.
- Clear statement of coverage limits and exclusions before the user starts.

## 6. Evidence pack
Generated as a PDF (and a ZIP of originals) on the device:
- Cover page: name, phone, date, complaint/ack numbers, summary in English + user's language
- Timeline (auto-built from SOS answers, call log entries the user selects, SMS the user selects, app events Raksha recorded: e.g. "10:42 AnyDesk opened during call with +91…")
- Transactions table (amount, UTR, time, payee VPA/account)
- Scammer identifiers: numbers, VPAs, URLs, app names, social media handles
- Screenshots the user attaches
- Hash of each file (SHA-256) for integrity
Saved locally, encrypted; shareable to police/bank by the user; optional encrypted cloud backup.

## 7. Data model
```sql
sos_case(
  case_id UUID PRIMARY KEY, user_id UUID, started_by UUID,       -- user or guardian
  type TEXT, started_at TIMESTAMPTZ, amount_paise BIGINT, method TEXT,
  status TEXT,                                                     -- open|reported|recovering|closed
  ncrp_ack_no TEXT, fir_no TEXT, bank_ref TEXT, insurance_claim_id TEXT,
  steps JSONB,                                                     -- {step_id: {done_at, notes}}
  consent_cloud_backup BOOL
);
sos_identifier(case_id UUID, kind TEXT, value_hash BYTEA, value_enc BYTEA);   -- feeds reputation (spec 01–03) after consent
bank_directory(bank_id INT PRIMARY KEY, name TEXT, fraud_numbers TEXT[], email TEXT, nodal_officer_url TEXT, updated_at TIMESTAMPTZ);
```

## 8. APIs
```
POST /v1/sos/case                  { "type": "...", "answers": {...} } → { "case_id", "playbook": [...] }
PATCH /v1/sos/case/{id}/step       { "step_id": "...", "done": true, "data": {...} }
GET  /v1/directory/banks?lang=hi
GET  /v1/directory/cyber-police?district=…
POST /v1/sos/case/{id}/report-identifiers   (consented) → pushes numbers/VPAs/URLs into reputation with high weight
POST /v1/insurance/claim           { "case_id": "...", "docs": [...] }   // via insurer partner
```

## 9. Design rules
- **Calm, directive copy:** short sentences, one action per screen, progress bar, "You're doing the right thing".
- Works **offline** for the critical steps (call 1930, bank numbers cached, flight-mode guidance).
- Never ask for OTP, PIN, password or full card number.
- Raksha never contacts the scammer, never promises recovery, and never charges for SOS (SOS is free on every plan).
- All official procedures sourced from I4C / RBI / DoT pages; reviewed monthly; each step shows "Last checked: <date>".

## 10. Metrics
- % of money-loss SOS cases where 1930 was called within 60 minutes of the transaction (target ≥ 60%)
- Median time from SOS start to 1930 call (target < 3 min)
- Complaint completion rate (ack number saved)
- Recovery rate reported by users at 30 / 90 days (self-reported, plus bank partner data where available)

## 11. Acceptance criteria
- [ ] UPI-loss playbook: from SOS tap to the 1930 dialler in ≤ 2 taps, with the pre-filled info screen visible during the call
- [ ] Bank debit SMS parsed into amount/UTR/time on Android (with permission)
- [ ] Evidence PDF generated offline in Hindi + English with file hashes
- [ ] Reminders fire at 24 h, 3 d, 7 d, 30 d with the RBI Ombudsman escalation at 30 d
- [ ] Guardian-started SOS shows on both phones
