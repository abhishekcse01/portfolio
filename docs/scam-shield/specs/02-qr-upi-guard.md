# Spec 02: QR & UPI Guard

## 1. Purpose
Stop the most common UPI tricks: "scan this QR to *receive* money", tampered shop QR stickers, fake payee names, QR codes that open phishing pages or install apps, and payments to numbers or VPAs flagged for fraud.

## 2. User stories
| ID | As a… | I want… | So that… |
|---|---|---|---|
| QR-1 | buyer / seller on OLX | to know if a QR will take money *from* me | I don't fall for the "receive money" trick |
| QR-2 | shopper | to confirm a shop's QR is really the shop's | I don't pay a swapped sticker |
| QR-3 | user | a warning before paying a VPA or number reported for fraud | I don't pay scammers |
| QR-4 | shop owner | to register my real QR | customers can verify it and swapped stickers are caught |
| QR-5 | user | QRs that open websites checked like links | QR phishing is caught |
| QR-6 | user | a warning about payment screenshots, refund and "wrong transfer" stories | I recognise payment scams |

## 3. UX flows

### 3.1 Scan with Raksha (primary)
1. Home → **Scan QR** (also a home-screen widget, a quick-settings tile on Android and an App Clip / Lock Screen control on iOS).
2. Camera opens (CameraX + ML Kit barcode on Android; AVFoundation/Vision on iOS); decode on device.
3. Result sheet by QR type:

| QR type | Display |
|---|---|
| UPI pay (`upi://pay`) | **"You will PAY ₹500 to Ramesh Kumar (ramesh123@okicici)"**, with the payee name, VPA, amount, note, verdict and reasons. Buttons: **Pay with…** (opens the UPI app with the same intent) · **Don't pay** · **Report** |
| UPI with no amount | "You will choose an amount and PAY" |
| URL | Link verdict (spec 01) → Open safely / Don't open |
| Wi-Fi (`WIFI:`) | Network name, security type, warning if open or a lookalike of a known café or brand |
| APK / app link | Treated as a download → warn |
| vCard / text / phone / SMS / email | Shown in plain text; embedded links and numbers checked |
| Aadhaar secure QR | Offline signature check against the UIDAI public key → "Genuine Aadhaar QR" or "Tampered / not genuine" |

4. "Receive money" myth-buster: if the user arrived from the "Someone sent me a QR to receive money" quick option, the result always opens with: **"You never need to scan a QR or enter a UPI PIN to RECEIVE money."**

### 3.2 Check a UPI ID or number before paying
Home → **Check before paying** → enter or paste a VPA, phone number or bank account + IFSC → verdict (reputation + FRI where available + merchant registry match).

### 3.3 Merchant mode
1. Shop owner → **Register my shop QR** → scan own QR → verify ownership (OTP-free number verification of the phone linked to the VPA through the operator API, or a ₹1 reverse-penny-drop through a payment partner).
2. Raksha issues a **"Raksha Verified" sticker** (printable PDF with a small secondary QR pointing to `raksha.app/m/<id>`) and an optional SMS alert when someone reports the shop's QR as tampered.
3. Customer scans → "✅ Verified merchant: Sharma General Store, Pune since Mar 2026" **or** "⚠️ This QR belongs to a different account than the one registered for this shop" (when the customer scans the verification sticker first and the payment QR second, or reports a mismatch).

## 4. Detection logic

### 4.1 UPI intent parsing
Parse `upi://pay?pa=<vpa>&pn=<name>&am=<amount>&cu=INR&tn=<note>&tr=<ref>&mc=<mcc>&mode=<mode>&orgid=<id>&sign=<sig>` (and `upi://mandate`, `upi://collect` variants).

| Signal | Reason code | Weight |
|---|---|---|
| Any `upi://pay` scanned from the "receive money" path, or note text like "receive", "refund", "cashback", "prize", "lottery", "KYC" | `QR_RECEIVE_MONEY_MYTH` | +60 |
| Amount present and high for context (> ₹2,000 from a P2P QR shared over chat) | `QR_PRESET_AMOUNT` | +15 |
| `upi://mandate` (autopay) from an unknown source | `QR_MANDATE_UNKNOWN` | +45 |
| `pn` (payee name) claims a brand / government / police / courier, but the VPA isn't a verified merchant handle | `QR_NAME_BRAND_MISMATCH` | +40 |
| VPA in reputation DB as fraud (user reports, bank partner feeds) | `QR_VPA_FLAGGED` | +70 |
| Phone number embedded in VPA (`98xxxxxx@ybl`) has FRI = High / Very High | `QR_NUMBER_FRI_HIGH` | +50 / +70 |
| VPA newly seen (first report < 7 days) with ≥ 3 reports | `QR_VPA_NEW_REPORTED` | +30 |
| Merchant QR (`mc` merchant category code present, signed) matching the registered merchant | `QR_MERCHANT_VERIFIED` | −40 |
| Signed QR (`sign`) with a valid signature from a known PSP | `QR_SIGNED_VALID` | −15 |
| `pn` contains suspicious strings (`refund`, `customer care`, `support`, `kyc`, `cbi`, `police`) | `QR_NAME_SUSPICIOUS` | +30 |
| SEBI-regulated entity claim (broker, IPO) but the VPA isn't a `@valid` SEBI handle | `QR_SEBI_NOT_VALID` | +40 |

### 4.2 Context signals (Android)
- QR image came from WhatsApp/Telegram (scanned from the gallery or a shared image) instead of the camera at a shop → +10
- Scan happens during or within 10 minutes of a call with an unknown number → +20 (`QR_DURING_UNKNOWN_CALL`), and feeds the digital-arrest correlation (spec 03)

### 4.3 Payment-screenshot scam helper
User shares a "payment successful" screenshot → OCR → check UTR format (12 digits), date/time plausibility, known fake-screenshot templates (fake payment-app generators) → message: "Screenshots can be faked. Check your bank balance or UPI app history, not the screenshot."

## 5. Data model
```sql
vpa_reputation(
  vpa_hash BYTEA PRIMARY KEY,           -- sha256(lower(vpa))
  psp_handle TEXT,                      -- e.g. 'okicici', 'ybl'
  verdict TEXT, score SMALLINT, category TEXT,
  report_count INT, bank_flag BOOL, first_seen TIMESTAMPTZ, last_seen TIMESTAMPTZ
);
merchant(
  merchant_id UUID PRIMARY KEY, display_name TEXT, vpa_hash BYTEA,
  owner_phone_hash BYTEA, city TEXT, district_code TEXT,
  verification_method TEXT, verified_at TIMESTAMPTZ, status TEXT
);
qr_tamper_report(
  report_id UUID PRIMARY KEY, merchant_id UUID, scanned_vpa_hash BYTEA,
  reporter_pseudo_id UUID, geo_coarse TEXT, created_at TIMESTAMPTZ
);
```

## 6. APIs
```
POST /v1/check/vpa       { "vpa_hash_prefix": "…", "context": "qr_camera|qr_gallery|manual" }
POST /v1/check/upi-intent { "pa": "…", "pn": "…", "am": "…", "mc": "…", "sign_valid": true, "context": {...} }
→ verdict object
POST /v1/merchant/register { "vpa": "…", "display_name": "…", "verification_token": "…" }
GET  /v1/merchant/{id}     → public verification card
POST /v1/merchant/{id}/tamper-report
```

## 7. Platform notes
- **Handing off to the UPI app:** Android `Intent(ACTION_VIEW, Uri.parse(upiUri))` with the chooser; iOS opens the app's scheme (`phonepe://`, `gpay://`, `paytmmp://`, `bhim://`) using `LSApplicationQueriesSchemes`, falling back to telling the user to scan with their UPI app.
- Never alter the UPI intent parameters. Raksha shows information and the user chooses; Raksha doesn't process payments, which keeps it outside payments regulation.
- Aadhaar QR verification uses UIDAI's published public certificate; nothing leaves the device.
- Camera permission requested only on first scan, with an explanation.

## 8. Edge cases
- Bharat QR / multi-network QRs (card + UPI) → parse the UPI part.
- Dynamic QR on POS screens with an amount → normal merchant flow, lower weight for a preset amount.
- Small-business VPAs that aren't merchant handles (most kirana shops use P2P VPAs) → don't penalise P2P by itself; rely on the merchant registry + reputation.
- QR inside a PDF or image with several codes → let the user pick.
- International QR (not UPI) → plain decode + link check.

## 9. Metrics
- % of "receive money" scans where the user chose **Don't pay** (target ≥ 85%)
- Flagged-VPA hit rate and precision (bank partner confirmation)
- Merchant registrations; tamper reports confirmed
- Scan-to-result latency < 500 ms on device

## 10. Acceptance criteria
- [ ] Scanning `upi://pay?pa=x@ybl&pn=Refund%20Desk&am=4999` shows "You will PAY ₹4,999" with `DANGEROUS`
- [ ] Scanning a verified merchant's signed QR shows the verified badge and no warning
- [ ] A VPA reported ≥ 5 times in 24 h appears as `DANGEROUS` within 10 minutes for all users
- [ ] The URL QR of a known phishing domain shows the link verdict and doesn't open automatically
- [ ] A tampered Aadhaar QR (signature invalid) shows "Not genuine"
