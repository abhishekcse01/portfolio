# Spec 06: Family Guardian

## 1. Purpose
Most victims of the costliest scams (digital arrest, voice clones, investment fraud) are elderly or first-time smartphone users, and the person most likely to stop the scam is a family member. Family Guardian links a **protected person** to one or more **guardians**, who receive alerts on high-risk events. It also provides an **elderly mode** and a **child mode**.

## 2. Roles
| Role | Description |
|---|---|
| **Family owner** | Pays for the Family plan, creates the family, invites members (up to 6) |
| **Guardian** | Receives alerts about a protected member; can see that member's protection status (not their messages) |
| **Protected member** | Elderly parent, child, or anyone who opts in to having guardians |
| **Member** | Covered by the plan, no guardian relationship |

A person can be both (e.g. a son is guardian for his mother and protected by his spouse).

## 3. User stories
| ID | As a… | I want… | So that… |
|---|---|---|---|
| FG-1 | adult child | an alert when my mother is on a long call with an unknown number and opens a payment app | I can call her immediately |
| FG-2 | adult child | to see that Raksha's protections are switched on for my father's phone | I know he's protected |
| FG-3 | elderly user | a very simple app in my language with one big button | I can check things without help |
| FG-4 | elderly user | to call my son from the warning screen in one tap | help is one tap away |
| FG-5 | parent | to know if my child installs a risky app or gets a sextortion-pattern message | I can help early |
| FG-6 | protected member | to choose exactly what my guardian is told | my privacy is respected |

## 4. Linking flow
1. Owner → **Family** → **Add member** → choose role (protected / member) → share an invite link or QR (WhatsApp / SMS).
2. Invitee installs Raksha → opens the link → sees **exactly** what will be shared ("Your son will be alerted when: a scam call is detected, a dangerous app is installed, your SIM changes, … He will NOT see your messages, calls, contacts or photos.") → accepts.
3. Optional **assisted setup**: the guardian can set up the protected person's phone in person with a step-by-step checklist (grant call screening role, notification access, Private DNS, elderly mode, safe word, emergency contacts). Progress syncs to the guardian.
4. Either side can unlink at any time; the protected member is notified when a guardian is added or removed.

Consent rules: for members under 18, the guardian must be a verified parent (DPDP verifiable parental consent; spec 10). For adults, consent is the member's own and can be withdrawn any time.

## 5. Guardian alerts

| Event (from module) | Default alert | Priority | Content shared |
|---|---|---|---|
| Digital-arrest interrupt (03) | Push + SMS | Critical | "Amma may be on a scam call: unknown number, 25 min, opened a payment app" |
| `DANGEROUS` call answered and lasted > 5 min (03) | Push | High | Category + duration (not the number unless the member allows it) |
| Remote-access app installed/opened (04) | Push | High | App name |
| Malware / dangerous app installed (04) | Push | High | App name + verdict |
| SIM change / SIM swap (04, 08) | Push + SMS | Critical | "SIM changed on Papa's phone" |
| Dangerous QR / VPA payment attempt warned and overridden (02) | Push | High | "Ignored a warning on a UPI payment of ₹X" (amount only if allowed) |
| Protection switched off (permissions revoked, DNS off) | Push (daily digest) | Medium | Which protection |
| Voice-clone / emergency-money pattern (05) | Push | High | "Got a suspicious emergency voice message" |
| SOS started (07) | Push + SMS + call option | Critical | "Raju started SOS: says he was scammed" |
| Hygiene score dropped below 50 (04) | Weekly digest | Low | Score + top fix |

**Per-member controls:** the protected member sees the same list and can turn each alert off (except they're told the guardian will see "alerts off").

**Delivery:** FCM / APNs push; SMS fallback through a DLT-registered header (`RAKSHA`) for critical events; optional automated voice call (IVR) in the guardian's language for critical events after 2 minutes without the push being opened.

**Rate limiting:** max 5 non-critical alerts per member per day; critical alerts are never suppressed but are de-duplicated within 15 minutes.

## 6. Guardian dashboard
- Member cards: name, photo, protection status ring (green / amber / red), last check-in time, recent alerts
- Tap a member → protection checklist (call screening on, SMS/notifications scanning, DNS shield, Device Guard last scan, hygiene score), alert history, **"Call now"**
- **Remote nudges:** "Ask Papa to turn on the DNS shield" sends a simple voice + text instruction to the member's phone with a one-tap fix link
- No remote control, no message reading, no location tracking (location sharing is out of scope by design: it's a different product with abuse risks)

## 7. Elderly mode

| Element | Spec |
|---|---|
| Home screen | 3 giant tiles: **"Is this a scam?"** (check anything), **"Call family"**, **"I've been cheated"** (SOS) |
| Text | Minimum 22sp, high contrast, no jargon, icons with labels |
| Voice | Every screen has a 🔊 button that reads it aloud in the chosen language; voice input for "Is this a scam?" ("बेटा, ये मैसेज देखो…") |
| Defaults | Auto-block `DANGEROUS` calls; block international calls; silence unknown callers optional; digital-arrest interrupt always on; warning dismissal needs a hold + simple question |
| Language | Picked at first launch with spoken language names |
| Confirmations | Every destructive or risky action asks twice, in plain words |
| Accessibility | Works with TalkBack/VoiceOver; large touch targets (≥ 56dp) |
| Optional launcher widget | One-tap "Is this a scam?" camera/paste widget |

## 8. Child mode (13–17; under 13 only through a parent's family setup)
- DNS shield with child categories (adult, gambling, known scam-gaming sites)
- Alerts to parents on: dangerous app installs, sextortion-pattern messages (from the notification-listener classifier: never the message text, only the category), unknown international video calls
- Education content: gaming-currency scams, fake "free diamonds/UC" sites, sextortion ("you are not in trouble; tell a parent; don't pay"), with helplines (1930, 1098 Childline)
- No reading of messages by parents; designed to keep the child's trust so they report problems

## 9. Data model
```sql
family(family_id UUID PRIMARY KEY, owner_user_id UUID, plan TEXT, created_at TIMESTAMPTZ);
family_member(
  family_id UUID, user_id UUID, role TEXT,               -- owner|guardian|protected|member
  display_name TEXT, language TEXT, is_minor BOOL,
  parental_consent_ref TEXT, joined_at TIMESTAMPTZ,
  PRIMARY KEY (family_id, user_id)
);
guardianship(
  guardian_user_id UUID, protected_user_id UUID, family_id UUID,
  alert_prefs JSONB, created_at TIMESTAMPTZ, revoked_at TIMESTAMPTZ,
  PRIMARY KEY (guardian_user_id, protected_user_id)
);
guardian_alert(
  alert_id UUID PRIMARY KEY, protected_user_id UUID, event_type TEXT, priority TEXT,
  summary JSONB, delivered_channels TEXT[], opened_at TIMESTAMPTZ, created_at TIMESTAMPTZ
);
protection_status(user_id UUID PRIMARY KEY, status JSONB, updated_at TIMESTAMPTZ);
```

## 10. APIs
```
POST /v1/family                       → create
POST /v1/family/{id}/invite           { "role": "protected" } → { "invite_url": "…", "expires_at": "…" }
POST /v1/family/invite/{token}/accept { "consented_alerts": [...] }
PATCH /v1/guardianship/{guardian}/{protected}  { "alert_prefs": {...} }
POST /v1/guardian/alert               (device → server) { "event": "...", "summary": {...} }
GET  /v1/family/{id}/dashboard
POST /v1/guardian/nudge               { "protected_user_id": "…", "nudge": "ENABLE_DNS" }
```

## 11. Edge cases
- Protected member has no internet at the moment of the event: queue the alert locally, send by SMS fallback (Android can send SMS only if it's the default SMS app; otherwise the server sends the SMS when the device reconnects, or the device uses its own minimal data). Critical device-side events trigger a server SMS as soon as any connectivity exists.
- Guardian is also the scammer (abuse case): alerts reveal no message content or location; the protected member can always see and remove guardians; a "Private check" (spec 04 §3.5) isn't visible to guardians.
- Multiple guardians: all receive critical alerts; the first to tap "I'm handling it" marks it acknowledged for the others.
- Family owner stops paying: members drop to the free tier; guardian alerts for critical events stay on for 30 days with a notice.

## 12. Metrics
- Families with ≥ 1 protected member; % of protected members with all protections on
- Critical-alert open time (median < 2 min target)
- Scams reported stopped by a guardian intervention (post-alert survey)

## 13. Acceptance criteria
- [ ] Invite → accept → guardian sees member status within 30 s
- [ ] Simulated digital-arrest interrupt → guardian push in ≤ 10 s and SMS in ≤ 60 s
- [ ] The protected member can turn off a non-critical alert type and the guardian sees "alert off"
- [ ] Elderly mode: all three home actions usable with TalkBack and voice in Hindi
- [ ] Removing a guardian notifies the protected member and stops alerts immediately
