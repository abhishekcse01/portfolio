# Spec 09: Architecture & Backend

## 1. Goals
- Low latency for real-time checks (calls ring for seconds; SMS warnings must arrive before the user taps)
- Privacy by design (on-device first, hash lookups, India residency)
- Fresh intelligence (new phishing domain → blocked worldwide in minutes)
- Scale from 100k to 50M users without redesign
- High availability: Raksha must fail safe (degrade to on-device checks), never break calls or SMS

## 2. Mobile architecture

### 2.1 Android
```
app/                      Jetpack Compose UI, navigation, onboarding
feature-link/             Link & Message Shield (NotificationListener, SMS receiver, share target)
feature-qr/               CameraX + ML Kit, UPI parser
feature-call/             CallScreeningService, call-state tracker, correlation engine
feature-device/           Permission auditor, app scanner, APK scanner, SIM watcher
feature-ai/               Media capture (MediaProjection), uploads
feature-family/           Family + guardian
feature-sos/              Playbooks, evidence PDF
core-shared (KMP)         Rules engine, verdict model, reason codes, scoring, networking (Ktor), crypto
core-ml                   TFLite runtime, model manager (download, verify signature, A/B)
core-data                 Room (SQLCipher), DataStore, WorkManager jobs
core-security             Play Integrity, certificate pinning, key storage (Android Keystore)
```
- Min SDK 26 (Android 8), target latest. Call Screening role needs Android 10+; older versions get a reduced feature set.
- Background work only through WorkManager / foreground services where required; no persistent services beyond the NotificationListener and VPN (if enabled).
- APK size target < 25 MB (models downloaded after install as on-demand modules).

### 2.2 iOS
```
RakshaApp (SwiftUI)
├─ Extensions
│  ├─ MessageFilterExtension     (ILMessageFilterExtension)
│  ├─ CallDirectoryExtension     (CXCallDirectoryProvider)
│  ├─ LiveCallerIDLookup         (configuration + PIR)
│  ├─ ShareExtension             (check anything)
│  ├─ DNSSettings                (NEDNSSettingsManager config)
│  └─ AppClip                    (QR scan without install)
├─ Shared (KMP framework)        rules, scoring, reason codes
├─ CoreMLModels                  text intent, URL lexical
└─ App Group container           shared settings, verdict cache
```
- Minimum iOS 16 (Live Caller ID needs 18+; feature-flag it).

### 2.3 Model delivery
- Models are signed (Ed25519); the app verifies before loading
- Staged rollout: 1% → 10% → 50% → 100%, with automatic rollback if the false-positive feedback rate rises > 20% over baseline
- Rules bundle (JSON/protobuf, signed) refreshed every 30 min; bloom filters as binary deltas

## 3. Backend services

```
                    ┌───────────────┐
 Mobile / Partners ─► API Gateway   │  (Envoy / Kong; mTLS for partners; attestation check; rate limits)
                    └──────┬────────┘
     ┌─────────────┬───────┼──────────┬──────────────┬───────────────┬──────────────┐
     ▼             ▼       ▼          ▼              ▼               ▼              ▼
 check-svc     report-svc  intel-svc  ai-media-svc   assistant-svc   family-svc     sos-svc
 (URL, msg,    (user       (feeds,    (voice/video/  (LLM, RAG,      (alerts,       (cases,
 number, VPA,  reports,    crawler,   image models,  tools)          push/SMS/IVR)  directories)
 app, APK)     appeals)    lists)     GPU pool)
     │             │          │            │              │              │              │
     └──────┬──────┴────┬─────┴──────┬─────┴──────────────┴──────┬───────┴──────────────┘
            ▼           ▼            ▼                           ▼
       Redis (hot    PostgreSQL   Kafka (events:                 Object storage
       verdict       (reputation, reports, intel, telemetry)      (samples, models,
       cache)        users, family)        │                      evidence backups)
                                           ▼
                                ClickHouse (analytics) · Feature store · Training pipeline
                                           │
                                 telco-svc (CAMARA, SIM swap) · partner-svc (bank SDK)
                                 dns-resolver fleet (DoH/DoT) · pir-svc (iOS Live Caller ID)
```

| Service | Language | Notes |
|---|---|---|
| `check-svc` | Go | Stateless; p99 < 150 ms for cache hits; calls model servers for misses |
| `intel-svc` | Python + Go | Feed ingestion, crawler, CT-log monitor, list ingestion (spec 08), sandbox orchestration |
| `ai-media-svc` | Python (PyTorch, Triton Inference Server) | GPU autoscaling; async jobs with webhooks / push |
| `assistant-svc` | Python / TypeScript | LLM API calls with tool use, RAG (vector DB: pgvector or Qdrant) |
| `family-svc` | Go / Kotlin | Push (FCM/APNs), SMS (DLT provider), IVR (voice provider) |
| `sos-svc` | Kotlin | Cases, directories, insurer API |
| `telco-svc` | Kotlin | CAMARA aggregator client, consent records, cost metering |
| `partner-svc` | Go | Bank SDK API, mTLS, per-partner quotas and billing |
| `dns-resolver` | Unbound/Knot + a Go policy plug-in | Anycast at Indian PoPs |
| `pir-svc` | Swift (Apple's homomorphic-encryption server stack) | iOS Live Caller ID Lookup |

## 4. Data stores
| Store | Data | Retention |
|---|---|---|
| PostgreSQL (primary + read replicas; partitioned) | Reputation tables, users, families, cases, appeals | Reputation indefinite (with decay); users per DPDP |
| Redis Cluster | Hot verdicts, rate-limit counters, bloom build state | TTL-based |
| Kafka | Events (reports, checks, intel updates, telemetry) | 7 days |
| ClickHouse | Analytics, model-monitoring metrics | 13 months aggregated |
| Object storage (S3-compatible, India region) | APK samples, consented media, model artefacts, encrypted evidence backups | Samples 90 days (unless donated), models indefinite |
| Vector DB | Brand page embeddings, logo embeddings, RAG documents, perceptual hashes | Indefinite |

## 5. Threat-intelligence pipeline
```
Sources ─► Ingest ─► Normalise ─► Enrich ─► Score ─► Review ─► Publish
```
| Stage | Details |
|---|---|
| **Sources** | User reports; Google Web Risk; PhishTank/OpenPhish; URLhaus/MalwareBazaar; CERT-In; operator & bank partner feeds; CT-log stream (certstream) filtered for Indian brand keywords; newly registered domains (zone files / NRD feeds) with brand keywords; social media / Telegram scam-channel monitoring (public channels only); app stores (new apps impersonating brands) |
| **Normalise** | Canonical URL, eTLD+1, punycode, E.164 numbers, VPA lowercase, APK hashes |
| **Enrich** | RDAP/WHOIS (age, registrar), DNS/hosting (ASN, IP reputation), TLS cert, headless browser visit (screenshot, DOM, forms, redirect chain) in an isolated crawler farm with Indian residential/mobile egress (scam kits often cloak against data-centre IPs), visual similarity to brand gallery, APK sandbox |
| **Score** | ML models + rules → verdict and confidence |
| **Review** | Auto-publish when confidence ≥ 0.95 or ≥ 2 independent sources; otherwise analyst queue (SLA 15 min business hours, 60 min off-hours) |
| **Publish** | Reputation DB → Redis → bloom-filter deltas → DNS block list → iOS Call Directory deltas / PIR DB rebuild (hourly) |

**Campaign clustering:** group indicators by shared infrastructure (IP, registrar, kit fingerprint, WhatsApp number, VPA) so blocking one variant blocks the whole campaign; analysts name campaigns ("Electricity-bill-Nov-2026-Maharashtra") for community alerts (spec 11).

## 6. ML lifecycle
| Step | Tooling |
|---|---|
| Labelling | Label Studio; analyst + crowd (trusted reporters) labels; double-labelling for the test set |
| Datasets | Versioned (DVC / LakeFS); per-language, per-channel splits; frozen evaluation sets updated quarterly |
| Training | PyTorch; Hugging Face; distillation for on-device models; ONNX → TFLite / Core ML export |
| Evaluation | Per-language precision/recall/FPR, calibration, latency on reference phones; red-team set of adversarial (LLM-generated) scams |
| Deployment | Model registry (MLflow); signed artefacts; staged rollout (§2.3); shadow mode for server models |
| Monitoring | Drift (input distribution), FP feedback rate, override rate per reason code, latency |

## 7. Security of Raksha itself
- **Threat model:** scammers will try to (a) get their numbers/links allow-listed (fake "safe" reports), (b) get legitimate competitors labelled (brigading), (c) reverse-engineer models, (d) attack our backend, (e) impersonate Raksha (fake Raksha APKs).
- Controls:
  - Device attestation (Play Integrity / App Attest) on every API call; reporter trust scores; anomaly detection on reports
  - Allow-list changes need analyst approval with two-person review for top brands
  - Certificate pinning; signed rules and models; obfuscation (R8) and anti-tamper checks
  - Secrets in a KMS/HSM; least-privilege IAM; production access through just-in-time approval
  - Annual third-party penetration test + CERT-In empanelled audit; bug bounty programme
  - Brand protection: monitor app stores and the web for fake Raksha apps; takedown process
  - Incident response runbook meeting the CERT-In 6-hour reporting requirement

## 8. Infrastructure
- Cloud: an Indian region pair (e.g. Mumbai + Hyderabad) for active-active; Kubernetes (EKS/GKE/AKS) with Terraform; GPU node pool for AI media
- DNS resolver PoPs: Mumbai, Delhi, Chennai, Hyderabad, Kolkata (anycast via a CDN/edge provider with Indian presence)
- CDN for rules bundles, bloom deltas, model files
- Observability: OpenTelemetry → Prometheus/Grafana, Loki, Tempo; on-call with PagerDuty-style rotation
- SLOs: check API 99.95% / p99 < 300 ms; DNS 99.99%; alerts delivery 99.9% within 60 s

## 9. Capacity planning (initial assumptions)
| Metric | 1M users | 10M users |
|---|---|---|
| Check API requests (most handled on device; cloud ~10%) | ~300 rps peak | ~3,000 rps peak |
| DNS queries (if 30% enable the shield; ~3k queries/user/day) | ~10k qps | ~100k qps |
| AI media jobs | ~2k/day | ~20k/day |
| Storage (reputation + events) | < 1 TB | ~5–10 TB |

## 10. Cost levers
- On-device first cuts cloud checks by about 90%
- Bloom filters and hash-prefix lookups keep payloads tiny
- GPU jobs are user-initiated and rate-limited
- LLM assistant: small/cheap model for classification and routing, larger model only for complex explanations; cache common answers

## 11. Acceptance criteria
- [ ] Load test: check API at 3,000 rps with p99 < 300 ms
- [ ] New phishing domain submitted through the analyst console reaches the DNS resolver and device bloom filters in < 5 min / < 35 min
- [ ] Chaos test: backend unreachable → apps keep protecting with rules + on-device models; calls and SMS unaffected
- [ ] Signed model with a tampered signature is rejected on device
- [ ] Pen test with no critical/high findings open at launch
