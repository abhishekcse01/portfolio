// All content comes from the CV and the verified timeline in docs/PROFILE_INPUTS.md. Do not add unverified claims.
window.DATA = {
  roles: ["reliable","evaluated","explainable","production-ready","safe to ship"],
  marquee: ["Python","PyTorch","TensorFlow","scikit-learn","XGBoost","Vertex AI","SageMaker","LangChain","LangGraph","CrewAI","Google ADK","RAG","Chroma","pgvector","FastAPI","Kafka","AWS MSK","Redis","PostgreSQL","Docker","Kubernetes","Datadog","SOC 2","OpenCV"],

  trace: [
    ["m","# agentic RAG with guardrails and a confidence gate"],
    ["k","query"," = ","s","\"Estimate install price for 22kW charger\""],
    ["b","→ embed","  ","m","dense + BM25 hybrid retrieval"],
    ["b","→ rerank","  ","m","top-5 passages, cited"],
    ["b","→ tools","   ","m","pricing_rules(), partner_lookup()"],
    ["b","→ guard","   ","m","PII tokenised, injection check: pass"],
    ["k","confidence"," = ","w","0.91  ≥ 0.80"],
    ["s","✓ answer released with citations"],
    ["m","# below threshold → human-in-the-loop review"]
  ],

  foundations: [
    {g:"Core",ic:"🧩",t:"Transformers",s:"Attention-based sequence models",b:"Stacked blocks of multi-head self-attention plus feed-forward layers, with residuals and layer norm. Parallel across tokens in training; sequential at decode time, which is why serving optimisations matter."},
    {g:"Core",ic:"🔎",t:"Self-attention",s:"softmax(QKᵀ/√d)·V",b:"Every token queries all keys to weight values. Cost is quadratic in sequence length, which drives work on FlashAttention, sliding windows and long-context methods."},
    {g:"Serving",ic:"🗄️",t:"KV caching",s:"Reuse past keys and values",b:"Store K,V per layer so each decode step computes only the new token. Trades compute for memory; cache size scales with layers × KV heads × head-dim × context × batch."},
    {g:"Serving",ic:"📦",t:"Paged attention",s:"vLLM-style KV memory",b:"Allocates the KV cache in fixed-size blocks like virtual memory, cutting fragmentation and enabling larger batches and prefix sharing between requests."},
    {g:"Serving",ic:"🧮",t:"MQA / GQA",s:"Fewer KV heads",b:"Multi-query and grouped-query attention share keys and values across query heads, shrinking the KV cache several-fold with small quality loss."},
    {g:"Serving",ic:"⚡",t:"Speculative decoding",s:"Draft then verify",b:"A small draft model proposes several tokens; the large model verifies them in one pass. Output distribution is preserved while latency drops."},
    {g:"Serving",ic:"🗜️",t:"Quantisation",s:"INT8 / INT4 weights and KV",b:"Lower-precision weights and caches cut memory and bandwidth. The trade-off is accuracy, so I validate against an eval set before adopting."},
    {g:"Training",ic:"🎛️",t:"Fine-tuning & LoRA",s:"Parameter-efficient adaptation",b:"Low-rank adapters train a small fraction of parameters. Good for style and format; for fresh knowledge, retrieval is usually a better first choice."},
    {g:"Retrieval",ic:"📚",t:"RAG",s:"Grounded generation",b:"Chunking, embeddings, hybrid search, reranking, cited answers. Quality is measured with retrieval metrics (recall@k, MRR) as well as answer-faithfulness checks."},
    {g:"Retrieval",ic:"🧭",t:"Vector search",s:"HNSW, IVF, pgvector, Chroma",b:"Approximate nearest-neighbour indexes trade recall for latency. Hybrid BM25 plus dense retrieval handles exact terms and semantic matches."},
    {g:"Agents",ic:"🤖",t:"Agents & tool use",s:"LangGraph, CrewAI, Google ADK",b:"Deterministic flows around LLM steps, tool calling, multi-agent roles, with human review checkpoints. I prefer explicit graphs over free-running loops."},
    {g:"Safety",ic:"🛡️",t:"Guardrails & red teaming",s:"Defence in depth",b:"Input and output filters, PII tokenisation, injection tests, adversarial prompts and release gates. Treated like security testing: repeatable and tracked."},
    {g:"Safety",ic:"📏",t:"LLM evaluation",s:"Measure before you ship",b:"Hallucination tests against sources, retrieval accuracy, regression suites, and human review for the cases automation cannot judge."},
    {g:"Ops",ic:"📡",t:"Observability",s:"Datadog, traces, root cause",b:"Log and trace LLM calls, latency, cost and failures. I built a Google ADK agent that reads Datadog logs to speed up incident investigation."}
  ],

  rag: [
    {i:"💬",n:"Query",d:"The user question is normalised and checked at the input guardrail (PII tokenisation, blocked terms, injection heuristics).",c:"query = guard.sanitize(user_input)"},
    {i:"🧬",n:"Embed",d:"The query is embedded for dense search and tokenised for keyword search. The same embedding model is used at index time.",c:"qv = embed(query)  # dense\nqt = bm25_terms(query)  # sparse"},
    {i:"🔀",n:"Hybrid retrieve",d:"Dense vector search and BM25 run in parallel and are fused (for example reciprocal rank fusion). Tenant filters are applied at the database level.",c:"hits = rrf(vector_search(qv, k=20), bm25(qt, k=20))"},
    {i:"🏅",n:"Rerank",d:"A cross-encoder or LLM reranker orders the candidates; only the top few go to the model to save tokens and reduce noise.",c:"ctx = rerank(query, hits)[:5]"},
    {i:"✍️",n:"Generate",d:"The LLM answers only from the supplied passages, returns citations, and can call tools for structured lookups.",c:"answer = llm(prompt, ctx, tools=[pricing_rules])"},
    {i:"🛡️",n:"Guard & verify",d:"Output checks: groundedness against the cited passages, PII leakage, policy. Failures are blocked or regenerated.",c:"verdict = verify(answer, ctx)  # faithful? safe?"},
    {i:"🚦",n:"Confidence gate",d:"Below the confidence threshold the case is handed to a human reviewer rather than answered. Everything is logged for evaluation.",c:"if confidence < 0.80: route_to_human(answer)"}
  ],

  experience: [
    {t:"Lead Software Architect (AI & Platform)",co:"Electrum (Pick My Solar) · Hyderabad",d:"Aug 2024 – Present",cur:1,
     pts:["Lead design, testing and deployment of Generative AI capabilities on production home-electrification and OEM marketplace platforms, including a Chroma-backed RAG retrieval agent (CrewAI, LangChain) supporting pricing decisions.",
          "Established evaluation for LLM and GenAI workflows: hallucination tests, retrieval-accuracy checks, red-team and adversarial prompts, guardrail validation, with human-in-the-loop gates before release.",
          "Introduced agentic engineering workflows (CrewAI, LangChain, GitHub Copilot) across the SDLC, delivering up to 80% faster delivery without lowering quality or security standards.",
          "Built a Google ADK agent that monitors Datadog logs and assists incident investigation.",
          "Led platform modernisation from Redis queues to Kafka on AWS MSK, improving event throughput ~10x.",
          "Oversee AWS governance, security assessments and annual penetration testing for major OEM clients; mentor technical leads and set engineering standards."],
     tags:["RAG","CrewAI","LangChain","Google ADK","Kafka","AWS MSK","Datadog"]},
    {t:"Development Team Lead",co:"Electrum (Pick My Solar) · Hyderabad",d:"May 2021 – Feb 2025",
     pts:["Developed and deployed a predictive EV-charger installation-pricing model (XGBoost regression on Google Vertex AI) for multiple OEM partners, integrated into partner pricing rules.",
          "Built distributed data pipelines for EV-charger IoT telemetry feeding real-time operational dashboards.",
          "Designed installer service-area and lead-distribution services (address eligibility, weighted round-robin) in Python, Flask and Pandas.",
          "Introduced CI/CD with Jenkins and Bitbucket, cutting release time by ~60%.",
          "Led annual penetration testing and contributed to SOC 2 readiness, including automated audit-evidence collection.",
          "Led delivery of OEM marketplaces for Honda, Hyundai and other brands across multiple launches."],
     tags:["XGBoost","Vertex AI","Python","Flask","Jenkins","SOC 2"]},
    {t:"Software Engineer",co:"Electrum (Pick My Solar) · Hyderabad",d:"Sep 2019 – May 2021",
     pts:["Built backend services, REST APIs and integrations for home-electrification products."],tags:["Python","REST","Integrations"]},
    {t:"Software Engineer",co:"Webappclouds LLC",d:"Mar 2019 – Oct 2019",
     pts:["Built REST APIs and webhook integrations for 100+ salon clients using AWS SQS and Lambda for asynchronous, event-driven processing."],tags:["AWS SQS","Lambda","Webhooks"]},
    {t:"Software Developer",co:"Apalya Technologies Pvt Ltd",d:"Jan 2018 – Mar 2019",
     pts:["Developed ML recommendation engines (collaborative and content-based filtering) and a computer-vision actor-recognition pipeline (TensorFlow, OpenCV) for OTT platforms.",
          "Implemented AES-128 encryption for platform security; recognised with an INR 25,000 performance award."],tags:["TensorFlow","OpenCV","Recommenders","AES-128"]},
    {t:"Backend Developer",co:"Sourceeasy",d:"Aug 2015 – Jan 2018",
     pts:["Designed REST APIs and modular Laravel applications for manufacturing workflows; integrated Google Auth, Mailchimp and Calendar APIs."],tags:["Laravel","PHP","REST"]}
  ],

  projects: [
    {c:"AI",n:"AgentGrid",st:"In progress",wip:1,d:"Multi-tenant agentic AI platform: a deterministic flow engine combined with LLMs, and RAG on pgvector with hybrid retrieval and cited answers.",
     h:"Evaluation harness for retrieval and answer quality; guardrails with blocked terms, PII tokenisation and a confidence threshold that hands off to a human.",
     tags:["Python","FastAPI","LangGraph","pgvector","PostgreSQL RLS","Kafka","Redis","Kubernetes","Prometheus"]},
    {c:"AI",n:"RAG pricing agent with evaluation",st:"Production",d:"Retrieval agent over pricing knowledge supporting EV-charger installation pricing decisions.",
     h:"Evaluation suite (hallucination and retrieval-accuracy checks) and human-in-the-loop controls before production use.",tags:["CrewAI","LangChain","Chroma","Evals"]},
    {c:"ML",n:"Predictive installation pricing",st:"Production",d:"XGBoost regression on Vertex AI predicting EV-charger installation cost across OEM partners.",
     h:"Model output integrated into partner-specific pricing rules.",tags:["XGBoost","Vertex AI","Python"]},
    {c:"AI",n:"Agentic SDLC workflows",st:"Production",d:"Agentic engineering workflows across the SDLC with human review checkpoints.",
     h:"Up to 80% faster delivery without lowering quality or security standards.",tags:["CrewAI","LangChain","Copilot"]},
    {c:"AI",n:"Datadog incident agent",st:"Production",d:"Google ADK agent that monitors Datadog logs and assists incident investigation.",
     h:"Shortens the path from alert to root cause.",tags:["Google ADK","Datadog","Agents"]},
    {c:"Platform",n:"Redis → Kafka modernisation",st:"Production",d:"Moved asynchronous processing from Redis queues to Kafka on AWS MSK.",
     h:"~10x event throughput and more reliable async processing.",tags:["Kafka","AWS MSK","Redis"]},
    {c:"Platform",n:"EV-charger IoT telemetry pipelines",st:"Production",d:"Distributed data pipelines feeding real-time operational dashboards.",h:"",tags:["Streaming","Python","Dashboards"]},
    {c:"ML",n:"Recommenders and actor recognition",st:"Earlier work",d:"Collaborative and content-based recommendation engines plus a computer-vision actor-recognition pipeline for OTT platforms.",
     h:"",tags:["TensorFlow","OpenCV","scikit-learn"]},
    {c:"Platform",n:"Release engineering & security",st:"Production",d:"Jenkins and Bitbucket CI/CD, annual penetration testing, SOC 2 readiness with automated audit evidence.",
     h:"~60% faster releases.",tags:["Jenkins","SOC 2","Pen-testing"]}
  ],

  skills: [
    ["🧠 Machine learning",["Python","scikit-learn","PyTorch","TensorFlow","XGBoost","Pandas","OpenCV","Recommenders","Classification & regression"]],
    ["✨ Generative AI & LLMs",["RAG","Chroma","pgvector","LangChain","LangGraph","CrewAI","Google ADK","Prompt engineering","Tool calling","Multi-agent workflows"]],
    ["🛡️ Evaluation & AI safety",["LLM evals","Hallucination testing","Retrieval accuracy","Red teaming","Guardrails","Human-in-the-loop","Responsible AI"]],
    ["☁️ MLOps & cloud",["AWS SageMaker","Lambda","MSK","EC2","SQS","Vertex AI","Docker","Kubernetes","Jenkins","Bitbucket","Git"]],
    ["🗄️ Data & streaming",["PostgreSQL","MySQL","MongoDB","Redis","Apache Kafka","IoT pipelines"]],
    ["🔐 Observability & security",["Datadog","Root-cause analysis","SOC 2 readiness","Pen-testing","OAuth2 / JWT","AES-128"]],
    ["🏗️ Engineering",["FastAPI","Flask","REST APIs","Microservices","Event-driven design","System design"]]
  ]
};
