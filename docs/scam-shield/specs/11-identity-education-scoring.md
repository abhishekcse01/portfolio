# Spec 11: Identity, Education & Safety Score

## 1. Purpose
Three supporting features that keep users safe between incidents and keep them coming back:
1. **Identity protection:** breach monitoring, SIMs-in-your-name checks, Aadhaar/PAN misuse checks
2. **Education:** short, local, language-native lessons about current scams, plus community alerts
3. **Safety score & gamification:** one number that rises as the user fixes risks (the CYBX-style score, done well)

## 2. Identity protection

### 2.1 Breach monitoring
| Item | Spec |
|---|---|
| Identifiers monitored | Email addresses (verified), phone number (verified), optionally PAN (hashed) |
| Sources | Have I Been Pwned (commercial API), a dark-web monitoring partner with Indian coverage (leaked databases from Indian services, combo lists, Telegram leak channels) |
| Matching | k-anonymity / hashed matching; we never store breach data dumps ourselves beyond hashed indicators |
| Alert | "Your email appeared in the <service> leak (Oct 2026). Leaked: email, password, phone. Do this now: change password, turn on 2-step verification, watch for phishing that uses these details." |
| Frequency | Continuous partner webhooks; weekly re-check |

### 2.2 SIMs in your name (TAFCOP)
- Monthly reminder: "Check how many SIMs are registered with your ID" → deep link to Sanchar Saathi TAFCOP → guide to report numbers that aren't yours.
- Result is entered by the user (we don't scrape the portal); a count increase over time triggers advice.

### 2.3 Aadhaar & PAN safety
| Action | How |
|---|---|
| Lock Aadhaar biometrics | Guided deep link to mAadhaar / myAadhaar; status confirmed by the user; reminder that it must be unlocked temporarily for genuine biometric use |
| Check Aadhaar authentication history | Guided link (myAadhaar → Authentication history); explain what AePS entries mean |
| Masked Aadhaar | Teach use of masked Aadhaar for KYC photocopies |
| Loans in your name | Free credit report links (CIBIL, Experian, Equifax, CRIF High Mark); explain how to dispute loans you didn't take (common after loan-app or KYC fraud) |
| PAN misuse | Guidance to check Form 26AS / AIS on the income-tax portal for unknown transactions |

### 2.4 Account security helper
Checklists with deep links: Google account security check-up, Apple ID, WhatsApp (two-step PIN, linked devices, privacy settings: who can add you to groups), Instagram/Facebook 2FA, email recovery options, UPI app locks and daily limits.

## 3. Education

### 3.1 Content formats
| Format | Spec |
|---|---|
| **Scam of the week** | 45–60 s vertical video + voice-only version, in each language; real (anonymised) story → how to spot it → what to do |
| **Story cards** | 5-card swipe stories for each of the 21 scam types (master plan §3.2), with illustrations of real UI (fake SMS, fake QR, fake police video) |
| **Quizzes** | 3-question checks after each story ("Which of these SMS is genuine?") |
| **Simulated drills** (opt-in) | Harmless fake scam SMS/notifications sent by Raksha itself (clearly ours once tapped) to practise. Never sent through real SMS from a spoofed sender; delivered as an in-app notification labelled "Practice" after tapping |
| **Explainers** | "How to read SMS headers", "What 1600-numbers are", "Why you never scan a QR to receive money", "Digital arrest is not real" |
| **For elders** | Voice-first, slow pace, local idioms; WhatsApp-shareable cards for family groups |

### 3.2 Community alerts
- Campaigns from the threat-intel pipeline (spec 09 §5) → analyst-written alert → targeted by state/district (coarse location chosen by the user, never GPS tracking) and language.
- Example: "⚠️ Pune: fake MSEDCL electricity-disconnection SMS asking you to call a mobile number. MSEDCL never does this."
- Max 2 alerts per week per user unless a severe local campaign is active.
- **Share as WhatsApp card**: one tap to warn family groups (with a Raksha watermark and link: a growth loop).

### 3.3 Content operations
- Content team writes in English/Hindi; native writers adapt (not literal translation) for each language
- Fact-check against official sources; legal review for brand/government references (no logos without permission; use generic illustrations)
- Publishing CMS with scheduling, targeting (language, district, segment), A/B tests on completion rate

## 4. Safety score

### 4.1 Composition (0–100)
| Component | Weight | Source |
|---|---|---|
| Device hygiene | 35 | Spec 04 §3.7 (Android) / §4 (iOS) |
| Protections switched on (SMS/notification scan, call screening, DNS shield, Device Guard) | 25 | App state |
| Identity safety (breach exposures resolved, 2FA on key accounts, Aadhaar biometric lock, TAFCOP checked within 90 days) | 20 | Spec 11 §2 |
| Awareness (stories completed, quiz accuracy, drills passed in last 90 days) | 10 | Spec 11 §3 |
| Family set up (safe word, guardian/emergency contact) | 10 | Spec 06 |

- Score shown as a ring with a label: 0–39 "At risk", 40–69 "Needs attention", 70–89 "Well protected", 90–100 "Excellent".
- Always show the **top 3 actions** with the points each adds ("Turn on DNS shield +5").
- Decay: awareness and self-confirmed items decay after 90 days, so users refresh them.
- Never use the score to shame; for elders, show only the actions, not the number, if preferred.

### 4.2 Gamification
- Streaks for weekly check-ins (opening the scam-of-the-week story)
- Badges: "First scam reported", "Family protector" (protected 3 members), "QR detective", "Drill champion"
- Leaderboards only within a family (no public leaderboards: privacy and no pressure)
- Rewards: extra free Premium days for referrals and for completing the full safety setup (budget-capped)

## 5. Data model
```sql
breach_exposure(user_id UUID, identifier_hash BYTEA, breach_name TEXT, breach_date DATE,
                data_classes TEXT[], resolved_at TIMESTAMPTZ, PRIMARY KEY (user_id, identifier_hash, breach_name));
education_progress(user_id UUID, content_id TEXT, completed_at TIMESTAMPTZ, quiz_score SMALLINT,
                   PRIMARY KEY (user_id, content_id));
community_alert(alert_id UUID PRIMARY KEY, campaign_id TEXT, languages TEXT[], districts TEXT[],
                title JSONB, body JSONB, severity TEXT, publish_at TIMESTAMPTZ, expires_at TIMESTAMPTZ);
safety_score(user_id UUID PRIMARY KEY, score SMALLINT, components JSONB, top_actions JSONB, computed_at TIMESTAMPTZ);
```

## 6. APIs
```
POST /v1/identity/monitor        { "type": "email|phone", "value": "…" }  (after verification)
GET  /v1/identity/exposures
GET  /v1/education/feed?lang=ta&district=…
POST /v1/education/progress      { "content_id": "…", "quiz_score": 3 }
GET  /v1/alerts/community?lang=…&district=…
GET  /v1/score                   → { "score": 72, "components": {...}, "top_actions": [...] }
```

## 7. Metrics
- Weekly active users opening education content (target ≥ 30% of MAU)
- Quiz accuracy improvement over 60 days
- Average safety score at day 1 vs day 30 (target +20 points)
- Community alert share rate to WhatsApp (growth loop)
- Breach alerts resolved within 7 days

## 8. Acceptance criteria
- [ ] Breach alert for a test email arrives within 24 h of a partner webhook, with resolution steps in the user's language
- [ ] Scam-of-the-week available in all launch languages, with audio
- [ ] Community alert targeted to one district reaches only users who chose that district
- [ ] Safety score updates within 1 minute of turning on a protection, and shows the next top 3 actions
- [ ] Drills are clearly labelled practice and never use spoofed real-world senders
