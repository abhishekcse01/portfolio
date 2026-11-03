# Spec 05: AI Fraud Lab

## 1. Purpose
Defend against AI-driven fraud: cloned voices ("Papa, I'm in trouble"), deepfake video calls (fake police officers, fake relatives), deepfake celebrity investment ads, AI-written phishing, AI chatbot scammers and doctored documents. Also provide **Ask Raksha**, a multilingual assistant that tells users whether something is a scam and what to do.

## 2. Honest scope
- Third-party apps **can't** access live call audio on Android (since Android 10) or iOS. Live deepfake detection *inside* a phone call needs an OEM or telecom partner (spec 08, phase 4).
- Detection models are probabilistic. Every result shows a confidence level and always falls back to **verification behaviour** (safe word, call back on a saved number), which beats any detector.
- Never claim "100% deepfake detection".

## 3. User stories
| ID | As a… | I want… | So that… |
|---|---|---|---|
| AI-1 | parent | to check if a voice note "from my son" is AI-generated | I don't send money to a clone |
| AI-2 | user | to check a video call while it's happening (Android) | I can spot a fake police officer |
| AI-3 | user | to check a video ad of a famous person promoting a trading app | I don't invest in a scam |
| AI-4 | user | to check whether an "arrest warrant" or "RBI letter" image is fake | I'm not frightened by forged documents |
| AI-5 | family | to set a secret safe word | we can verify each other in an emergency |
| AI-6 | anyone | to ask "is this a scam?" in Hindi/Tamil/etc. and get a clear answer | I don't need to understand technology |

## 4. Features

### 4.1 Voice check (voice notes and audio clips)
- **Input:** share a voice note from WhatsApp/Telegram (`.opus`/`.ogg`/`.m4a`), pick an audio file, or **record from speaker**: during a speakerphone call on a second device, or by holding the phone near a speaker. Android only offers this as a user-initiated recording with clear disclosure; iOS allows in-app recording only.
- **Pipeline:**
  1. Decode → 16 kHz mono → VAD to keep speech segments
  2. **Synthetic speech detection model** (server): ensemble of an SSL-based anti-spoofing model (e.g. wav2vec2/XLS-R or WavLM features + AASIST-style back end) trained on ASVspoof 2019/2021/5 + In-the-Wild + **our Indian-language TTS/voice-clone corpus** (Hindi, Bengali, Tamil, Telugu, Marathi, Indian English generated from leading open-source and commercial clone tools)
  3. Codec robustness: train with WhatsApp Opus, phone-band (8 kHz), MP3 and noise augmentation
  4. **Script / intent analysis:** ASR (Indic ASR model, e.g. AI4Bharat IndicConformer, or a cloud ASR) → scam-intent model from spec 01 (emergency + money + secrecy = voice-clone scam pattern)
  5. Optional **speaker comparison** (opt-in): family members enrol a 30-second voice sample → speaker embedding (ECAPA-TDNN). A clip claiming to be that person gets a similarity score. Embeddings encrypted; deletable anytime. Note: a clone can match a speaker embedding, so this is used only as supporting evidence.
- **Output:** "Likely AI-generated voice (78%)" plus the script red flags, and **"Call your son on his saved number now"** button (dials the contact) and **"Ask your safe word"**.

### 4.2 Video-call check (Android, user-initiated)
- User taps the Raksha floating bubble / quick-settings tile **"Check this video call"** → `MediaProjection` consent dialog → capture frames for 15–20 s at 2–4 fps (no audio from other apps; the system doesn't allow it for calls).
- On device: face detection (ML Kit / MediaPipe) → crop faces.
- Server (or on-device lite model where feasible): face-forgery detection ensemble (EfficientNet/ViT models trained on FaceForensics++, DFDC, Celeb-DF, DeeperForensics + Indian-faces augmentation), temporal consistency (blink rate, head-pose vs landmark jitter), and **uniform/background checks** for fake "police station" setups (detect a static virtual background, logo misuse: CBI/ED/Mumbai Police emblems, known scam-studio backgrounds from reported cases).
- **Liveness challenge coaching:** the app tells the user what to ask: "Ask them to turn their head fully sideways", "Ask them to put a hand in front of their face", "Ask them to show today's newspaper". Real-time face swaps often break under these.
- Output within ~10 s: "Signs of a fake video (high)" + "Police never question people on video calls. End the call and call 1930."
- On iOS: not possible (no system screen capture for other apps' content in this way without a broadcast extension the user must start; ReplayKit broadcast upload extensions can capture the screen, so evaluate a **ReplayKit-based** version for iOS in phase 3).

### 4.3 Image & document check
- Input: screenshot or photo of a document, ID, letter, payment receipt, profile photo.
- Checks:
  - **AI-generated image** classifier (diffusion/GAN artefacts) + **C2PA content credentials** read when present
  - **Document forgery heuristics:** government emblem misuse, fonts, layout vs known genuine templates (CBI/ED/court notices, RBI letters, TRAI notices), ELA (error level analysis) and copy-move detection, mismatched names/dates, missing reference numbers
  - **Aadhaar** secure QR offline verification (see spec 02); **PAN** format check
  - **Profile photo reverse search** (romance/matrimonial scams): perceptual-hash lookup in our scam-profile database + an optional reverse-image search partner API
  - Fake payment screenshot detection (spec 02 §4.3)
- Output: verdict + plain explanation ("Courts and CBI never send arrest warrants on WhatsApp").

### 4.4 Video / ad check (deepfake celebrity endorsements)
- Input: shared video file or link (YouTube, Instagram, Facebook ad links: download through an allowed metadata/preview path or ask the user for the file).
- Checks: face-forgery + lip-sync mismatch (SyncNet-style audio-visual consistency), synthetic voice (4.1), **known-campaign matching** (perceptual video hashes of reported deepfake ads), promoted URL / app / WhatsApp number → link and number checks.
- **Celebrity & public-figure impersonation list** (business leaders, finance ministers, RBI governor, news anchors, cricketers, film stars) to raise the prior when such a face appears with "investment", "returns", "trading app" text.
- Output: "This video uses a likely deepfake of [public figure] to promote a trading app reported for fraud."

### 4.5 Ask Raksha (assistant)
- **Channels:** in-app chat (text + voice), and a WhatsApp Business number (phase 2) so users can forward a suspicious message directly.
- **Languages:** all launch languages; voice in/out (ASR + TTS via Bhashini or a cloud provider).
- **Capabilities:**
  - "Is this a scam?" on pasted text/screenshots → calls the same check APIs (tools) and explains the verdict
  - Step-by-step help: "I already paid, what now?" → hands off to SOS (spec 07)
  - Explainers: "What is digital arrest?", "How to lock Aadhaar biometrics?"
- **Architecture:**
  - A frontier LLM through an API (multilingual quality matters; evaluate Claude, plus Indic-specialised models such as Sarvam for cost-sensitive classification) with **tool calling** to Raksha check APIs
  - **RAG** over a curated knowledge base: scam playbooks, official procedures (1930, cybercrime.gov.in, Chakshu, RBI ombudsman, bank helplines), regulator rules
  - **Guardrails:** never ask for or store OTPs, PINs or passwords; refuse to help create scams; no legal or financial advice beyond official procedures; always give official helplines; mark uncertainty
  - **PII redaction** on device before sending (card numbers, Aadhaar, account numbers, OTPs masked)
  - Conversation retention: 30 days, user-deletable; not used for training without opt-in
- **Evaluation:** a 1,000-item multilingual test set (real scam and benign messages), scored for verdict accuracy, correct helpline, and harmful-advice rate (must be 0 on the red-team set).

### 4.6 Family safe word
- Set up inside Family Guardian (spec 06): the family picks a word or question offline; Raksha stores **only a reminder** (not the word itself) and prompts: "Did they say the safe word?" whenever a voice check or an emergency-money pattern is detected.
- Periodic drills (opt-in): a monthly "practise" notification with a fake scenario.

### 4.7 AI-phishing robustness
Spec 01's text model is trained on **LLM-generated scam variants** (fluent, no spelling errors, in many languages) so it relies on intent and structure (authority + urgency + payment/credential request + off-platform contact), not on bad grammar. Red-team monthly with new LLM-generated campaigns.

## 5. Model operations
| Model | Where | Size / latency | Retrain |
|---|---|---|---|
| Synthetic voice detector | Server (GPU) | ~300M params; < 3 s for a 30 s clip | Monthly + when new clone tools appear |
| Face-forgery video | Server (GPU); lite version on device for screening | < 10 s for 20 s of frames | Monthly |
| AI-image / document forgery | Server | < 2 s | Quarterly |
| ASR (Indic) | Server | Streaming | Vendor / quarterly |
| Ask Raksha LLM | External API + RAG | < 4 s first token | Prompt/RAG updates weekly |

- **Data:** an internal "clone lab" generates synthetic voices and videos of **consenting employees and paid actors only**, never of real public figures or users without consent.
- **Evaluation:** report EER / AUC per language and per codec; publish a short model card for each detector.
- **Abuse prevention:** rate-limit media checks; don't return detailed artefact maps that would help scammers tune their fakes.

## 6. APIs
```
POST /v1/ai/voice      multipart audio, { "claimed_speaker_id": "optional", "lang_hint": "hi" }
→ { "synthetic_prob": 0.78, "script_flags": ["EMERGENCY", "MONEY", "SECRECY"], "verdict": {...} }
POST /v1/ai/video-frames  multipart (frames), { "context": "live_call|file" }
POST /v1/ai/image      multipart, { "type_hint": "document|photo|screenshot|receipt" }
POST /v1/ai/video      multipart or { "url": "…" }
POST /v1/assistant/chat { "conversation_id": "…", "message": "…redacted…", "attachments": [...] }   // streaming
```

## 7. Privacy
- Media uploaded only on explicit user action, processed in India, deleted after 24 h unless the user donates it.
- Voice enrolment embeddings stored encrypted per family; deleting the family or member wipes them.
- The assistant never sees contacts, call logs or messages unless the user pastes them.

## 8. Metrics
- Voice detector: EER ≤ 8% on our Indian codec test set at launch, ≤ 5% within 12 months
- Video detector: AUC ≥ 0.9 on the internal live-swap test set
- Ask Raksha: ≥ 92% correct verdicts on the multilingual test set; 0 harmful-advice failures on the red-team set
- % of voice-check users who used "Call back on saved number"

## 9. Acceptance criteria
- [ ] A cloned-voice Hindi voice note from the clone lab → "Likely AI-generated" with ≥ 70% probability, plus "Call back" and safe-word prompts
- [ ] A genuine voice note recorded on WhatsApp → not flagged as synthetic (FP test set)
- [ ] Android: video-call check runs end-to-end with MediaProjection consent and returns a result in ≤ 15 s
- [ ] Fake CBI arrest-warrant image → flagged with an explanation in the user's language
- [ ] Ask Raksha in Tamil: "Someone from customs says my parcel has drugs" → explains the courier/digital-arrest scam, says not to pay, gives 1930
