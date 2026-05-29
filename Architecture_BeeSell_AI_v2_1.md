# Arsitektur Sistem — BeeSell AI Platform
## Complete Architecture v2.0 — All Features Phase 1–5

> **Versi:** 2.0 · April 2026 (Updated — Sprint Plan 1 Tahun Terintegrasi)
> **Status:** Production Reference
> **Cakupan:** Phase 1 MVP → Phase 5 Enterprise (52 minggu)
> **Region Primer:** ap-southeast-3 (Jakarta) · DR: ap-southeast-1 (Singapore)

---

## Daftar Isi

1. [Gambaran Umum & Karakteristik Sistem](#1-gambaran-umum)
2. [Prinsip Arsitektur](#2-prinsip-arsitektur)
3. [System Architecture Overview](#3-system-overview)
4. [Frontend & Mobile Architecture](#4-frontend-mobile)
5. [Backend Services Registry (22 Services)](#5-backend-services)
6. [AI & ML Layer (Full Stack)](#6-ai-ml-layer)
7. [Data Architecture](#7-data-architecture)
8. [Integration Ecosystem](#8-integrations)
9. [Infrastructure & Cloud (AWS)](#9-infrastructure)
10. [Security Architecture](#10-security)
11. [Observability & Monitoring](#11-observability)
12. [CI/CD Pipeline](#12-cicd)
13. [Disaster Recovery](#13-disaster-recovery)
14. [Technology Stack Lengkap](#14-tech-stack)
15. [Architecture Decision Records](#15-adr)
16. [Roadmap Architecture Evolution](#16-roadmap)

---

## 1. Gambaran Umum

BeeSell AI adalah **AI-powered Sales Content & Marketing Automation Platform** multi-tenant untuk seller online Indonesia (Shopee, Tokopedia, TikTok Shop) dan affiliator.

### 1.1 Skala Target per Phase

```
                  Phase 1    Phase 2    Phase 3    Phase 4    Phase 5
                  (W1-10)    (W11-18)   (W19-28)   (W29-40)   (W41-52)
MAU               500        5.000      30.000     100.000    300.000+
Concurrent Users  100        1.000      5.000      20.000     50.000+
AI Jobs/hari      1.000      10.000     100.000    500.000    2.000.000+
Video Render/hari 50         500        5.000      20.000     100.000+
Storage Total     1 TB       10 TB      100 TB     500 TB     2 PB+
DB TPS (peak)     500        2.000      10.000     30.000     100.000+
API Req/detik     50         500        3.000      10.000     30.000+
```

### 1.2 Karakteristik Utama

| Karakteristik | Nilai |
|---|---|
| Architecture Pattern | Cloud-Native Microservices + Event-Driven |
| Deployment Model | Multi-tenant SaaS (shared infra, RLS isolation) |
| API Style | REST (external) + gRPC (inter-service) + WebSocket (realtime) |
| Availability SLA | 99.5% Phase 1-2 → 99.9% Phase 3+ |
| RTO / RPO | 4 jam / 1 jam (Phase 3+) → 30 menit / 5 menit (Phase 5) |
| Data Residency | Indonesia (Jakarta primary) + Singapore (DR) |
| Compliance | PDP (UU No.27/2022), GDPR-ready, PCI-DSS Level 3 |

---

## 2. Prinsip Arsitektur

```
1. API-First         → Semua fitur exposed via versioned API — termasuk white-label
2. Async-by-Default  → AI generation, video render, bulk = async queue
3. Stateless Service → Session di Redis, bukan in-memory service
4. Defense-in-Depth  → Security berlapis: network, app, data, identity
5. Observable        → Setiap request: trace, log, metric, alert
6. Cost-Aware        → AI API di-cache agresif, GPU scale-to-zero
7. Tenant-Isolated   → Data per-tenant di-enkripsi, RLS enforced DB-level
8. Progressive       → Graceful degradation jika downstream down
9. Mobile-First      → API dirancang untuk low-bandwidth, offline-capable
10. AI-Augmented     → AI membantu developer dengan code gen & review
```

---

## 3. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
│  Web App (Next.js 14)  │  Mobile iOS/Android  │  API Partners  │  Reseller  │
└──────────────┬──────────────────┬──────────────────┬────────────────────────┘
               │                  │                  │
               ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CDN + EDGE LAYER                                     │
│  CloudFront (Global CDN)  │  WAF WebACL  │  DDoS Shield  │  Edge Functions  │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         API GATEWAY LAYER                                    │
│  Kong Gateway  │  Rate Limiting (Redis)  │  Auth Middleware  │  Routing     │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │
          ┌────────────────────┼────────────────────┐
          ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  CORE SERVICES  │  │   AI SERVICES   │  │ INTELLIGENCE SVC│
│ (Phase 1-3)     │  │ (Phase 1-4)     │  │ (Phase 4-5)     │
│                 │  │                 │  │                 │
│ auth-service    │  │ ai-orchestrator │  │ insight-engine  │
│ content-service │  │ text-ai-worker  │  │ competitor-svc  │
│ scheduler-svc   │  │ image-ai-worker │  │ predict-svc     │
│ ads-service     │  │ video-ai-worker │  │ brand-voice-svc │
│ affiliate-svc   │  │ brand-voice-ai  │  │ finetune-svc    │
│ analytics-svc   │  │ fine-tune-svc   │  │                 │
│ billing-svc     │  │ trend-ai-svc    │  └─────────────────┘
│ notification-svc│  └─────────────────┘
│ media-service   │
│ websocket-svc   │  ┌─────────────────┐  ┌─────────────────┐
│ trend-service   │  │  PLATFORM SVC   │  │ ENTERPRISE SVC  │
│                 │  │ (Phase 2-3)     │  │ (Phase 5)       │
└─────────────────┘  │                 │  │                 │
                     │ meta-connector  │  │ whitelabel-svc  │
                     │ tiktok-connector│  │ reseller-svc    │
                     │ google-connector│  │ collab-market   │
                     │ marketplace-svc │  │ api-gateway-pub │
                     └─────────────────┘  └─────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATA LAYER                                         │
│  PostgreSQL (Aurora Serverless v2)  │  Redis 7 Cluster  │  ClickHouse 24   │
│  Pinecone Vector DB  │  Amazon S3   │  Cloudflare R2    │  DynamoDB        │
└─────────────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        MESSAGING LAYER                                       │
│  Amazon MSK (Kafka 3.6)  │  Amazon SQS (FIFO)  │  BullMQ (Redis-backed)   │
│  QStash (Serverless Queue)  │  Socket.io (WebSocket)                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Frontend & Mobile Architecture

### 4.1 Web Application (Next.js 14 App Router)

```
apps/web/
├── app/
│   ├── (auth)/               # Login, Register, Verify, OAuth callback
│   ├── (dashboard)/
│   │   ├── layout.tsx         # Shell: Sidebar + TopBar + providers
│   │   ├── page.tsx           # Dashboard overview (Phase 1)
│   │   ├── content/           # Content Creator + Library (Phase 1)
│   │   ├── scheduler/         # Calendar + Bulk schedule (Phase 1-3)
│   │   ├── ads/               # Ads Manager Meta+TikTok (Phase 2-3)
│   │   ├── affiliate/         # Affiliate Hub (Phase 2)
│   │   ├── analytics/         # Analytics Dashboard (Phase 2-4)
│   │   ├── ai-calendar/       # AI Calendar Generator (Phase 3)
│   │   ├── bulk/              # Bulk Engine CSV/Sheets (Phase 3)
│   │   ├── insights/          # AI Performance Analyst (Phase 4)
│   │   ├── competitor/        # Competitor Intelligence (Phase 4)
│   │   ├── brand-voice/       # Brand Voice AI (Phase 4)
│   │   ├── mobile-preview/    # Live preview konten mobile (Phase 4)
│   │   ├── integrations/      # Zapier, Make, Notion (Phase 4)
│   │   ├── collaboration/     # Team + Approval workflow (Phase 5)
│   │   ├── marketplace/       # Creator-Brand marketplace (Phase 5)
│   │   ├── white-label/       # White-label config (Phase 5)
│   │   └── settings/          # Account, billing, API keys
│   ├── api/                   # Next.js API Routes (backend-for-frontend)
│   └── [locale]/              # i18n routing id/en (Phase 5)
│
├── components/
│   ├── ui/                    # shadcn/ui base (40+ components)
│   ├── features/              # Feature-specific React components
│   │   ├── content-creator/   # ContentCreator, ResultPanel, VariantTabs
│   │   ├── scheduler/         # CalendarGrid, SlotPicker, HeatmapOverlay
│   │   ├── ads/               # CampaignWizard, ABTestManager, AudienceBuilder
│   │   ├── affiliate/         # ProductCard, LinkGenerator, ProfitCalc
│   │   ├── analytics/         # OverviewKPI, TrendChart, AIInsightCard
│   │   ├── bulk/              # CSVUpload, BatchProgress, SheetSync
│   │   ├── ai-insights/       # InsightEngine, ScorePredictor, WeeklyDigest
│   │   ├── competitor/        # CompetitorBenchmark, GapAnalysis, NicheRadar
│   │   ├── brand-voice/       # VoiceProfileView, ContentRepurpose
│   │   ├── collaboration/     # TeamFeed, ApprovalFlow, ContentBrief
│   │   └── marketplace/       # BrandProfile, DealPipeline, CollabCard
│   └── layouts/               # AppShell, Sidebar, TopBar, BottomNav
│
├── hooks/                     # 30+ custom hooks
│   ├── useContentGeneration.ts
│   ├── useWebSocket.ts
│   ├── useQuota.ts
│   ├── useInsights.ts         # Phase 4
│   ├── useCompetitor.ts       # Phase 4
│   └── useBrandVoice.ts       # Phase 4
│
├── stores/                    # Zustand stores
│   ├── contentStore.ts
│   ├── authStore.ts
│   ├── schedulerStore.ts
│   ├── uiStore.ts
│   └── insightStore.ts        # Phase 4
│
└── lib/
    ├── api-client.ts          # Axios instance + interceptors
    ├── constants.ts           # Plan limits, feature flags
    └── feature-flags.ts       # LaunchDarkly integration (Phase 3+)
```

**Key Dependencies (Web):**
```
Next.js 14          App Router, RSC, Server Actions
TypeScript 5.x      Type safety semua layer
Tailwind CSS v3     Utility-first styling
shadcn/ui           40+ accessible components
TanStack Query v5   Server state, caching, pagination
Zustand v4          Client state management
Vercel AI SDK       Streaming AI responses
React Hook Form     Form management
Zod                 Schema validation (shared BE/FE)
Recharts            Analytics charts
FullCalendar        Scheduler calendar
Fabric.js           Canvas image editor
dnd-kit             Drag-and-drop
react-joyride       Feature tours (Phase 3+)
next-i18next        i18n Indonesia + English (Phase 5)
LaunchDarkly        Feature flags (Phase 3+)
Sentry              Error tracking
PostHog             Product analytics
```

### 4.2 Mobile Application (Phase 4 — W35-W38)

```
apps/mobile/
├── app/                       # Expo Router v3 file-based nav
│   ├── (auth)/                # Login, Register native
│   ├── (tabs)/
│   │   ├── index.tsx          # Dashboard Overview
│   │   ├── create.tsx         # Content Creator (camera + generate)
│   │   ├── library.tsx        # Content Library + FlashList
│   │   ├── scheduler.tsx      # Calendar strip + quick schedule
│   │   └── analytics.tsx      # KPI overview + charts
│   └── [contentId].tsx        # Content detail deep link
│
├── components/                # NativeWind styled components
├── hooks/                     # Mobile-specific hooks
└── services/                  # API calls, push notification setup
```

```
React Native 0.73     Cross-platform iOS + Android
Expo SDK 50           Managed workflow
Expo Router v3        File-based navigation
NativeWind            Tailwind CSS for RN
FlashList             Performant list rendering
expo-camera           Camera access
expo-image-picker     Gallery access
Expo Push             Push notifications
Victory Native        Charts (lightweight)
react-query           Server state (shared config)
Sentry Native         Crash reporting
```

### 4.3 Admin Dashboard (Internal)

```
apps/admin/
├── app/
│   ├── tenants/               # Tenant management, impersonate
│   ├── users/                 # User list, ban, support tools
│   ├── revenue/               # MRR, churn, cohort analysis
│   ├── errors/                # Sentry feed + quick actions
│   ├── ai-costs/              # AI spend per tenant, throttling
│   └── feature-flags/         # LaunchDarkly flag management
```

---

## 5. Backend Services Registry (22 Services)

### 5.1 Complete Service Map

| # | Service | Port | Tech | Phase | Responsibility |
|---|---|---|---|---|---|
| 1 | api-gateway | 8000 | Fastify + Kong | 1 | Entry point, routing, rate limit, JWT validation |
| 2 | auth-service | 8001 | Fastify + Supabase Auth | 1 | Register, login, JWT RS256, OAuth, MFA, session |
| 3 | user-service | 8002 | Fastify + Prisma | 1 | Profil, tenant, onboarding, brand kit, platform connect |
| 4 | content-service | 8003 | Fastify + Prisma | 1 | CRUD konten, library, template, folder, quota |
| 5 | ai-orchestrator | 8004 | Python FastAPI | 1 | Koordinasi semua AI jobs, prompt mgmt, cost tracking |
| 6 | text-ai-worker | 8005 | Python | 1 | Text generation: caption, copy, hashtag, skrip |
| 7 | image-ai-worker | 8006 | Python | 1 | Image generation, background removal, upscale |
| 8 | video-ai-worker | 8007 | Python + GPU | 1 | Video render, TTS, subtitle, avatar talking head |
| 9 | scheduler-service | 8008 | Fastify + BullMQ | 1 | Jadwal publish, cron publisher, retry engine |
| 10 | ads-service | 8009 | Fastify + Prisma | 2 | Campaign CRUD Meta+TikTok, A/B test, auto-optimizer |
| 11 | affiliate-service | 8010 | Fastify + Prisma | 2 | Short URL, click tracking, komisisi, product sync |
| 12 | analytics-service | 8011 | Fastify + ClickHouse | 2 | Metrics ingestion, dashboard data, PDF reports |
| 13 | notification-service | 8012 | Fastify + FCM | 1 | Push (FCM), email (Resend), WhatsApp (Fonnte) |
| 14 | billing-service | 8013 | Fastify + Midtrans | 2 | Subscription lifecycle, invoice, quota reset, referral |
| 15 | media-service | 8014 | Fastify + Sharp | 1 | Upload, CDN signed URL, compress, watermark |
| 16 | trend-service | 8015 | Python FastAPI | 3 | Trending hashtag/audio scraper, cache, niche scoring |
| 17 | insight-engine | 8016 | Python FastAPI | 4 | AI performance analyst, weekly digest, score predict |
| 18 | competitor-service | 8017 | Python FastAPI | 4 | Competitor tracking, benchmark, gap analysis |
| 19 | brand-voice-service | 8018 | Python FastAPI | 4 | Brand voice extraction, fine-tune pipeline, repurpose |
| 20 | integration-service | 8019 | Fastify | 4 | Webhook dispatch, Zapier/Make connector, OAuth bridge |
| 21 | whitelabel-service | 8020 | Fastify | 5 | Custom domain, branding config, reseller mgmt |
| 22 | marketplace-service | 8021 | Fastify | 5 | Collaboration deals, brand profiles, escrow payment |

### 5.2 Auth Service — Detail

```
auth-service/src/
├── routes/
│   ├── register.ts       POST /auth/register
│   ├── login.ts          POST /auth/login (email + password)
│   ├── oauth.ts          GET  /auth/oauth/:provider (google|meta|tiktok)
│   ├── refresh.ts        POST /auth/refresh (HttpOnly cookie)
│   ├── logout.ts         POST /auth/logout
│   ├── verify.ts         GET  /auth/verify/:token
│   └── mfa.ts            POST /auth/mfa/setup, /auth/mfa/verify
│
├── services/
│   ├── JWTService.ts     RS256 sign/verify, 15 menit access token
│   ├── OAuthService.ts   Google, Meta, TikTok OAuth2 flow
│   ├── PasswordService.ts bcrypt cost 12
│   └── MFAService.ts     TOTP (speakeasy)
│
└── middleware/
    ├── rateLimit.ts      5 req/mnt login, 3 req/mnt register
    └── lockout.ts        Lockout 15 menit setelah 10 gagal
```

### 5.3 AI Orchestrator — Detail

```
ai-orchestrator/src/
├── routes/
│   ├── text.py           POST /ai/text — dispatch text generation
│   ├── image.py          POST /ai/image — dispatch image generation
│   ├── video.py          POST /ai/video — dispatch video rendering
│   ├── bulk.py           POST /ai/bulk — dispatch batch jobs
│   ├── brand-voice.py    POST /ai/brand-voice — analyze + train
│   ├── insights.py       POST /ai/insights — generate weekly insights
│   └── finetune.py       POST /ai/finetune — trigger fine-tune pipeline
│
├── services/
│   ├── prompt_builder.py     Jinja2 templates, variable injection
│   ├── model_router.py       GPT-4o vs mini, fallback Claude
│   ├── semantic_cache.py     Pinecone vector lookup, threshold 0.92
│   ├── cost_tracker.py       Track per-tenant AI spend
│   ├── quota_enforcer.py     Hard block setelah quota habis
│   └── job_dispatcher.py     BullMQ job creation + priority
│
└── models/
    ├── brand_voice_model.py  Fine-tune pipeline wrapper
    ├── trend_predictor.py    Time series ML (Prophet)
    └── score_predictor.py    Content score prediction model
```

### 5.4 Insight Engine (Phase 4) — Detail

```
insight-engine/src/
├── analyzers/
│   ├── performance_analyzer.py   GPT-4o analyze metrics → 5 insights/minggu
│   ├── content_scorer.py         Score 0-100 sebelum publish
│   ├── pattern_detector.py       Cluster konten sukses (k-means embeddings)
│   ├── ab_test_analyzer.py       Statistical significance (t-test)
│   └── roi_calculator.py         ROAS, CAC, LTV per campaign
│
├── predictors/
│   ├── optimal_time.py           ML predict jam optimal posting
│   ├── trend_forecaster.py       Prophet time series viral topics
│   └── churn_predictor.py        Predict user akan churn (30d window)
│
└── generators/
    ├── weekly_digest.py          Auto-generate laporan mingguan email
    ├── insight_cards.py          Format insights → actionable cards
    └── recommendation_engine.py  Content rekomendasi berdasarkan goals
```

### 5.5 Inter-Service Communication

```
Synchronous (gRPC):
  api-gateway → auth-service      (token validation, setiap request)
  content-service → media-service (upload + CDN URL generation)
  scheduler-service → ads-service (campaign status check)
  billing-service → auth-service  (plan update setelah payment)

Asynchronous (Kafka Topics):
  content.created           → analytics-service, notification-service
  content.published         → analytics-service, notification-service
  ai.job.completed          → content-service, notification-service
  campaign.status.changed   → ads-service, notification-service, analytics-service
  user.subscribed           → billing-service, notification-service
  post.published            → analytics-service, notification-service
  trend.updated             → content-service (trending sidebar)
  insight.generated         → notification-service (weekly email)
  competitor.alert          → notification-service (anomaly detected)

HTTP REST (internal):
  api-gateway → semua service  (proxying request)
  insight-engine → analytics-service  (fetch raw metrics)
  brand-voice-service → content-service  (apply voice ke generation)

WebSocket (Socket.io):
  websocket-service ← BullMQ events (job progress)
  websocket-service → client browser (real-time updates)
```

---

## 6. AI & ML Layer (Full Stack)

### 6.1 AI Provider Matrix

| Capability | Primary Provider | Fallback | Phase |
|---|---|---|---|
| Caption / Copywriting | GPT-4o | Claude 3.5 Sonnet | 1 |
| Fast caption (bulk) | GPT-4o-mini | GPT-3.5-turbo | 1 |
| Product scraping analysis | GPT-4o Vision | GPT-4o | 1 |
| Image generation | SD XL (Replicate) | DALL-E 3 | 1 |
| Background removal | Remove.bg | REMBG local | 1 |
| Image upscaling | Real-ESRGAN (Replicate) | — | 1 |
| Video generation (slideshow) | Runway ML Gen-3 Alpha | Kling AI | 2 |
| Video generation (talking head) | HeyGen API | D-ID API | 4 |
| TTS narration | ElevenLabs | OpenAI TTS | 2 |
| Video subtitles | OpenAI Whisper | AssemblyAI | 2 |
| Voice cloning | ElevenLabs Pro | — | 5 |
| Embeddings (semantic cache) | text-embedding-3-large | — | 1 |
| AI Calendar generation | GPT-4o | — | 3 |
| Performance insights | GPT-4o | — | 4 |
| Brand voice extraction | GPT-4o + fine-tune | — | 4 |
| Trend prediction | Prophet (internal) | — | 4 |
| Content scoring | Custom ML model | — | 4 |
| GPT fine-tuning | GPT-4o-mini fine-tune | — | 5 |
| Deepfake avatar | HeyGen custom avatar | D-ID | 5 |

### 6.2 Prompt Management System

```python
# ai-orchestrator/prompts/

PROMPT_TEMPLATES = {
    "caption_instagram_casual_id": """...""",
    "caption_tiktok_gaul_id": """...""",
    "caption_linkedin_professional_id": """...""",
    "video_script_30s_product": """...""",
    "ai_calendar_monthly": """...""",
    "insight_analysis": """...""",
    "brand_voice_extraction": """...""",
    "competitor_gap_analysis": """...""",
}

# Dynamic variables: {product_name}, {price}, {benefits[]}
# {target_audience}, {tone}, {trending_hashtags[]}
# {brand_voice_profile}, {competitor_insights}
```

### 6.3 Semantic Cache Architecture

```
Request → hash(prompt + config)
        ↓
Pinecone lookup (embedding similarity > 0.92)
        ↓
Cache HIT (40-60% rate) → return cached result (< 50ms)
Cache MISS → AI API call (3-8 detik) → store embedding + result
        ↓
TTL per content type:
  caption: 7 hari
  hashtag: 6 jam (trending berubah cepat)
  image:   30 hari (stabil)
  calendar:24 jam
  insights:1 minggu
```

### 6.4 AI Pipeline per Content Type

```
TEXT GENERATION PIPELINE:
  Input → Validate quota → Check semantic cache
       → Build prompt (Jinja2 template)
       → Route model (GPT-4o atau mini)
       → Stream response via Vercel AI SDK
       → Post-process (parse JSON, validate, clean)
       → Store to DB + update cache
       → WebSocket notify "job:complete"

IMAGE GENERATION PIPELINE:
  Input photo/prompt → Background removal (Remove.bg)
       → Build SD XL prompt
       → Dispatch to Replicate (async via QStash webhook)
       → Poll Replicate status
       → Download result image
       → Apply brand kit overlay (Fabric.js server-side)
       → Compress + upload S3 + CDN URL
       → WebSocket notify

VIDEO GENERATION PIPELINE:
  Input photos/script → TTS narration (ElevenLabs)
       → STT subtitles (Whisper)
       → Dispatch to Runway ML / HeyGen
       → Wait webhook (60-180 detik)
       → Download MP4
       → FFmpeg: add subtitles + music + watermark
       → Upload S3 + CloudFront
       → WebSocket notify

BRAND VOICE PIPELINE (Phase 4):
  Upload 20+ existing contents
       → Extract embeddings (text-embedding-3-large)
       → Analyze patterns (vocabulary, sentence structure, tone)
       → GPT-4o synthesize "voice profile" JSON
       → Store brand_voice_profiles table
       → Inject ke all future caption prompts

FINE-TUNE PIPELINE (Phase 5):
  Collect top-performing content per niche (>75 score)
       → Format JSONL training data
       → Submit GPT-4o-mini fine-tune job
       → Monitor training (polling)
       → Evaluate fine-tuned model vs base model
       → A/B test: 50% fine-tuned, 50% base
       → Promote if avg score improves > 10%
```

### 6.5 GPU Worker Auto-Scaling

```
EC2 g4dn.xlarge (NVIDIA T4 16GB VRAM):
  Scale-to-zero saat idle > 20 menit
  Scale-out: QStash queue depth > 10 video jobs
  Max instances: 5 (Phase 1-3) → 20 (Phase 4-5)
  Spot instances: 70% Spot, 30% On-demand (availability)

GPU Worker types:
  video-renderer  → Runway ML + FFmpeg jobs
  image-upscaler  → Real-ESRGAN + batch processing
  subtitle-gen    → Whisper batch transcription
```

---

## 7. Data Architecture

### 7.1 Database Strategy per Data Type

| Data Type | Database | Reason |
|---|---|---|
| Transactional (users, content, billing) | PostgreSQL 15 Aurora | ACID, RLS, complex queries |
| Session + Cache | Redis 7 Cluster | Sub-millisecond, eviction policy |
| Analytics events (read-heavy, append-only) | ClickHouse 24 | OLAP, 1B+ rows/tabel, columnar |
| Vector embeddings (semantic cache) | Pinecone Serverless | ANN search, cosine similarity |
| Media files (photo, video, template) | S3 + CloudFront | Scalable, CDN, lifecycle rules |
| AI model artifacts | S3 (separate bucket) | Fine-tune checkpoints, large files |
| Job queue state | Redis (BullMQ) | Fast, sorted sets, pub/sub |
| Feature flags | LaunchDarkly (Phase 3+) | SaaS, real-time toggle |
| Config + secrets | AWS SSM + Secrets Manager | Encrypted, rotation, audit |
| Terraform state | S3 + DynamoDB | Locking, versioning |

### 7.2 PostgreSQL Schema Domains

```
Domain 1: Auth & User (V002)
  tenants, users, email_verifications, refresh_tokens,
  platform_connections, brand_kits, audit_logs

Domain 2: Content (V003)
  contents, content_templates, content_folders,
  ai_jobs, bulk_batches, trending_data

Domain 3: Scheduler (V004)
  scheduled_posts, posting_rules, calendar_events

Domain 4: Ads (V005)
  ad_campaigns, ad_sets, ad_creatives, ab_tests, custom_audiences

Domain 5: Affiliate (V006)
  affiliate_products, affiliate_links, affiliate_clicks (partitioned)

Domain 6: Billing (V007)
  plan_definitions, subscriptions, invoices, payment_transactions

Domain 7: Notification (V008)
  notifications (partitioned by quarter)

Domain 8: Analytics (V009) — ClickHouse DDL
  content_analytics_events, ads_analytics_events,
  affiliate_analytics_daily, platform_growth_snapshots, ai_usage_daily

Domain 9: Phase 4 — Intelligence (V011)
  insight_cards, content_scores, brand_voice_profiles,
  competitor_profiles, competitor_snapshots, optimal_time_models

Domain 10: Phase 5 — Enterprise (V012)
  white_label_configs, reseller_accounts, reseller_sub_tenants,
  collaboration_deals, brand_profiles, creator_profiles,
  api_keys, api_usage_logs
```

### 7.3 Multi-Tenancy Data Isolation

```sql
-- Setiap request inject tenant context ke session
SET LOCAL app.tenant_id = '<tenant_uuid>';
SET LOCAL app.user_id   = '<user_uuid>';
SET LOCAL app.plan      = 'pro';

-- RLS policy enforcement (automatic, tidak perlu WHERE di query)
CREATE POLICY tenant_isolation ON contents
  FOR ALL TO app_user
  USING (tenant_id = current_setting('app.tenant_id')::UUID);

-- Defense in depth: even if app bug forgets WHERE clause,
-- DB-level RLS blocks cross-tenant data access
```

### 7.4 ClickHouse Analytics Architecture

```sql
-- content_analytics_events — raw event stream
-- Engine: MergeTree, partition by (tenant_id, month), TTL 2 years
-- 5+ billion rows at Phase 5 scale

-- ads_analytics_events — campaign metrics daily
-- Engine: SummingMergeTree — auto-aggregate identical keys

-- Query example (Analytics Dashboard P95 < 200ms):
SELECT
  toDate(event_time) AS date,
  countIf(event_type = 'view') AS views,
  countIf(event_type = 'engagement') AS engagements,
  sum(revenue) AS revenue
FROM content_analytics_events
WHERE tenant_id = {tenant_id}
  AND event_date >= today() - 30
GROUP BY date ORDER BY date DESC
```

---

## 8. Integration Ecosystem

### 8.1 Social Media Platforms

```
Instagram (Meta Graph API v19):
  ✓ OAuth Basic Display + Business (Phase 1)
  ✓ Feed post, Story, Reels publish (Phase 1)
  ✓ Read insights: reach, impressions, engagement (Phase 2)
  ✓ Hashtag research API (Phase 3)

TikTok (Content Posting API v2):
  ✓ OAuth + video publish (Phase 2)
  ✓ Creator insights sync (Phase 2)
  ✓ Trending audio via Creative Center (Phase 3)
  ✓ TikTok Ads API — campaign + analytics (Phase 3)

Facebook (Meta Graph API v19):
  ✓ Page post publish (Phase 2)
  ✓ Meta Ads — campaign full lifecycle (Phase 2-3)
  ✓ Audience insights + Custom Audiences (Phase 3)

YouTube (Data API v3):
  ◎ Video upload + description (Phase 4)
  ◎ Shorts publish (Phase 4)

WhatsApp Business (Cloud API):
  ◎ Broadcast message (Phase 4 — via Fonnte/360Dialog)
  ◎ Template message (Phase 4)

Twitter/X, LinkedIn, Pinterest:
  ○ Planned Phase 5
```

### 8.2 Marketplace & Affiliate

```
Shopee Open Platform:
  ✓ Product scraping (Cheerio + Firecrawl) (Phase 1)
  ✓ Shopee Affiliate API — trending products + komisi (Phase 2)
  ○ Seller center webhook — auto-post produk baru (Phase 4)

Tokopedia Open API:
  ✓ Product scraping (Phase 1)
  ✓ Tokopedia Affiliate sync (Phase 2)
  ○ Seller center integration (Phase 4)

TikTok Shop:
  ○ Affiliate product sync (Phase 3)
  ○ Live commerce integration (Phase 5)

Lazada:
  ○ Planned Phase 5
```

### 8.3 Payment & Billing

```
Midtrans (Primary — Indonesia):
  ✓ Snap.js checkout (GoPay, QRIS, VA, Kartu Kredit) (Phase 2)
  ✓ Recurring subscription (Phase 3)
  ✓ Prorated billing (Phase 3)

Xendit (Fallback — Indonesia):
  ✓ Payment fallback jika Midtrans down (Phase 3)

Stripe (International — Phase 5):
  ○ Enterprise customers luar Indonesia
  ○ White-label reseller billing
```

### 8.4 Automation & Integration Tools (Phase 4)

```
Zapier Integration:
  Triggers: content.created, post.published, campaign.alert,
            job.completed, quota.warning, insight.generated
  Actions:  create_content, schedule_post, get_analytics

Make (Integromat):
  5 ready-made blueprints:
  - Content → Google Sheets log
  - Publish alert → Slack
  - Campaign performance → Airtable
  - Daily digest → Notion
  - New affiliate link → WhatsApp broadcast

Webhook System:
  User-defined webhooks untuk semua events utama
  HMAC-SHA256 signature verification
  Retry 3x dengan exponential backoff
  Delivery log + test button

Google Drive:
  Export konten ke Drive folder per batch
  OAuth 2.0 + refresh token

Notion:
  Two-way sync: scheduled_posts ↔ Notion database
  Calendar view di Notion

Tokopedia + Shopee Seller Center:
  Webhook: produk baru listing → auto generate + schedule konten
```

### 8.5 AI & ML Third-Party

```
OpenAI:
  GPT-4o, GPT-4o-mini, GPT-4o fine-tune (Phase 5)
  text-embedding-3-large
  Whisper STT
  DALL-E 3 (fallback image gen)

Anthropic:
  Claude 3.5 Sonnet (text fallback)
  Claude 3 Haiku (fast tasks)

Replicate:
  Stable Diffusion XL
  Real-ESRGAN upscale
  REMBG background removal

Runway ML:
  Gen-3 Alpha video generation

HeyGen:
  Talking head avatar (Phase 4)
  Custom avatar creation (Phase 5)

ElevenLabs:
  TTS narration
  Voice cloning (Phase 5)

Pinecone:
  Serverless vector DB untuk semantic cache
```

### 8.6 Communication & Notifications

```
Resend:        Transactional email, onboarding sequence, invoice
FCM:           Push notification iOS + Android
Fonnte:        WhatsApp Business API (Indonesia)
360Dialog:     WhatsApp Business API (alternative)
Intercom:      Customer support chat widget
Loom:          Video tutorial embed
```

---

## 9. Infrastructure & Cloud

### 9.1 AWS Account Structure

```
Management Account (billing, org policies, CloudTrail)
├── Production Account  — ap-southeast-3 (Jakarta)
├── Staging Account     — ap-southeast-1 (Singapore)
└── Development Account — ap-southeast-1 (Singapore, shared)
```

### 9.2 VPC Architecture (Production)

```
VPC: 10.0.0.0/16 | Region: ap-southeast-3 | 3 AZs

Public Subnets (3x /24):     10.0.1-3.0/24    — ALB, NAT Gateway
Private App Subnets (3x /22): 10.0.4.0/22+    — ECS Fargate Services
Private Data Subnets (3x /24):10.0.16-18.0/24 — RDS, ElastiCache, MSK
GPU Worker Subnets (3x /24): 10.0.32-34.0/24  — EC2 g4dn instances

VPC Endpoints (reduce NAT cost):
  S3 (Gateway), ECR API, ECR DKR, Secrets Manager, SSM, CloudWatch Logs
```

### 9.3 Compute Architecture

```
ECS Fargate (CPU Services — 22 services):
  Cluster: beesell-production-cluster
  Capacity providers: FARGATE 70% + FARGATE_SPOT 30%
  Container Insights: enabled
  X-Ray tracing: sidecar per task

  Service Sizing (production):
  api-gateway:        1024 CPU / 2048 MB  — min 2, max 30 tasks
  auth-service:       512  / 1024         — min 2, max 15 tasks
  content-service:    1024 / 2048         — min 2, max 25 tasks
  ai-orchestrator:    2048 / 4096         — min 2, max 20 tasks
  video-ai-worker:    4096 / 8192         — min 0, max 10 tasks (GPU)
  scheduler-service:  512  / 1024         — min 2, max 15 tasks
  ads-service:        512  / 1024         — min 1, max 15 tasks
  affiliate-service:  512  / 1024         — min 1, max 10 tasks
  analytics-service:  1024 / 2048         — min 1, max 15 tasks
  billing-service:    512  / 1024         — min 1, max 8 tasks
  notification-svc:   512  / 1024         — min 1, max 15 tasks
  media-service:      512  / 1024         — min 1, max 15 tasks
  websocket-svc:      1024 / 2048         — min 2, max 20 tasks
  trend-service:      1024 / 2048         — min 1, max 5 tasks
  insight-engine:     2048 / 4096         — min 0, max 8 tasks (Phase 4)
  competitor-svc:     1024 / 2048         — min 0, max 5 tasks (Phase 4)
  brand-voice-svc:    2048 / 4096         — min 0, max 5 tasks (Phase 4)
  integration-svc:    512  / 1024         — min 1, max 8 tasks (Phase 4)
  whitelabel-svc:     512  / 1024         — min 1, max 5 tasks (Phase 5)
  marketplace-svc:    512  / 1024         — min 1, max 8 tasks (Phase 5)

GPU EC2 Auto Scaling Group:
  Instance: g4dn.xlarge (NVIDIA T4 16GB)
  Capacity: 0 (scale-to-zero) → max 5 (Phase 1-3) → max 20 (Phase 5)
  Spot mix: 70% Spot, 30% On-demand
  Trigger: QStash video queue depth > 10
```

### 9.4 Database Sizing

```
Aurora PostgreSQL Serverless v2:
  Phase 1-2: min 0.5 ACU, max 16 ACU
  Phase 3:   min 2 ACU,   max 32 ACU
  Phase 4:   min 4 ACU,   max 64 ACU
  Phase 5:   min 8 ACU,   max 128 ACU

  Instances: 1 writer + 2 readers (production)
  Backup: 35 hari PITR, 5-menit granularity
  Multi-AZ: yes, automatic failover

ElastiCache Redis 7:
  Phase 1-2: 3x cache.r6g.large (Multi-AZ)
  Phase 3+:  6x cache.r6g.xlarge (cluster mode)

ClickHouse:
  Phase 1-2: 1x r6i.2xlarge
  Phase 3:   3x r6i.2xlarge (cluster)
  Phase 4+:  6x r6i.4xlarge (distributed)
```

### 9.5 Storage Architecture

```
S3 Buckets:
  beesell-media-prod-{account}:   User uploads + generated content
  beesell-assets-prod-{account}:  Templates, fonts, system assets
  beesell-ai-models-{account}:    Fine-tune checkpoints, model artifacts
  beesell-backups-{account}:      DB snapshots + Kafka logs
  beesell-terraform-state:        IaC state

Lifecycle Rules (media bucket):
  generated/videos/  → INTELLIGENT_TIERING 30d → GLACIER_IR 180d
  generated/images/  → GLACIER_IR 180d
  exports/           → DELETE 7d
  ai-models/         → INTELLIGENT_TIERING 90d

CloudFront Distribution:
  Origins: S3 media, S3 assets, ALB (API)
  Behaviors:
    /v1/*      → ALB (no cache, all headers forwarded)
    /ws/*      → ALB (WebSocket, no cache)
    /generated/* → S3 (1-day cache, Origin Shield)
    /uploads/*   → S3 (1-hour cache)
    /*           → S3 assets (1-year immutable)
```

### 9.6 Messaging Architecture

```
Amazon MSK (Kafka 3.6):
  Production: 3 brokers kafka.m5.large, Multi-AZ
  Replication: factor 3, min ISR 2
  Storage: 500GB EBS per broker
  Retention: 7 hari (configurable per topic)
  Topics: content.*, campaign.*, user.*, ai.*, trend.*, insight.*

Amazon SQS:
  platform-publish.fifo    → Exactly-once posting ke sosmed
  notification-send.std    → Email + push dispatch
  analytics-ingest.std     → Event ingestion
  payment-webhook.fifo     → Midtrans webhook processing
  email-send.std           → Resend email queue
  trend-refresh.std        → Periodic trend data refresh
  report-generate.std      → PDF report generation
  competitor-sync.std      → Competitor data sync (Phase 4)
  insight-generate.std     → Weekly insight jobs (Phase 4)
  finetune-trigger.std     → Fine-tune pipeline trigger (Phase 5)

BullMQ (Redis-backed, low-latency):
  text-generation     priority 1-5, concurrency 20
  image-generation    priority 1-5, concurrency 10
  video-generation    priority 1-5, concurrency 5
  bulk-processing     priority low, concurrency 3
  post-publishing     priority critical, concurrency 50
  insight-analysis    priority medium, concurrency 5
  competitor-scan     priority low, concurrency 3
```

### 9.7 Observability Stack

```
Metrics:    Datadog APM (full tracing + metrics)
            CloudWatch (AWS native metrics + alarms)
            Prometheus (self-hosted Phase 5)

Logging:    CloudWatch Logs (ECS container logs)
            → Datadog Log Management (search + alert)
            PII masking: email → hash, token → [REDACTED]

Tracing:    AWS X-Ray (distributed tracing, service map)
            OpenTelemetry (Phase 4 — vendor-agnostic)

Errors:     Sentry (web + mobile + backend)
            PagerDuty (P0 escalation, oncall rotation)

Product:    PostHog (user behavior, funnel analysis, feature flags)
            Hotjar (heatmap, session recording — Phase 2+)

Uptime:     Better Uptime (external health check + status page)

AI Cost:    Custom dashboard (per-tenant AI spend, trend)
            Alert: tenant spend > Rp 50K/hari → throttle
```

---

## 10. Security Architecture

### 10.1 Defense in Depth Layers

```
Layer 1 — Network:
  CloudFront + WAF (managed rules + custom rate limits)
  AWS Shield Standard (DDoS protection)
  VPC + Private subnets (all services behind NAT)
  Security Groups (whitelist-only inbound)
  NACLs (subnet-level firewall, data tier restricted)

Layer 2 — Application:
  JWT RS256 (15 menit access token + 30 hari refresh)
  HttpOnly + Secure + SameSite=Strict cookies
  CSRF token (double-submit cookie pattern)
  Rate limiting per endpoint per tenant (Upstash Redis)
  Input validation Zod (backend) + React Hook Form (frontend)
  SQL injection prevention: Prisma ORM (parameterized)
  XSS prevention: React auto-escape + CSP headers
  File upload: magic bytes check + ClamAV virus scan (Phase 3+)
  SSRF prevention: URL blocklist for internal IPs

Layer 3 — Data:
  Encryption at rest: AES-256 (S3, RDS, ElastiCache, EBS)
  Encryption in transit: TLS 1.3 minimum
  Per-tenant KMS keys (Phase 3+)
  PostgreSQL RLS (tenant data isolation, DB-enforced)
  PII masking in logs
  Secrets rotation: 90 hari (AWS Secrets Manager)
  DB credentials never in codebase (SSM + Secrets Manager)

Layer 4 — Identity:
  IAM roles (no static credentials for any service)
  Principle of least privilege per ECS task role
  MFA wajib untuk admin + billing operations
  CloudTrail (all API calls logged, immutable)
  AWS Config (compliance rule monitoring)

Layer 5 — Code:
  Semgrep SAST (OWASP ruleset, setiap PR)
  Trivy (container image scan, setiap build)
  Dependabot (dependency vulnerability alerts)
  npm audit + pip-audit (setiap CI run)
  External pentest quarterly (Phase 3+)
```

### 10.2 Compliance

```
Indonesia:
  UU No. 27 Tahun 2022 (Perlindungan Data Pribadi)
  POJK terkait fintech (payment data)

International:
  GDPR-ready (data deletion, export, consent management)
  PCI-DSS Level 3 (payment card data — via Midtrans)

Data Handling:
  Right to be forgotten: soft delete → hard delete 30 hari
  Data export: tenant download semua data mereka (CSV + ZIP)
  Consent: explicit consent untuk AI training dari konten user
  Retention: audit logs 7 tahun, analytics 2 tahun, media 5 tahun
```

---

## 11. Observability & SLOs

### 11.1 Key SLOs

| Metric | Phase 1-2 | Phase 3-4 | Phase 5 |
|---|---|---|---|
| API P95 latency | < 1s | < 500ms | < 200ms |
| Availability | 99.5% | 99.9% | 99.95% |
| Caption generation E2E | < 10s | < 6s | < 4s |
| Image generation E2E | < 60s | < 45s | < 30s |
| Video generation E2E | < 180s | < 120s | < 90s |
| Publish success rate | > 95% | > 99% | > 99.9% |
| Error rate (5xx) | < 1% | < 0.1% | < 0.01% |
| RTO (disaster recovery) | 4 jam | 1 jam | 30 menit |

### 11.2 CloudWatch Alarms (Critical)

```
alb-5xx-high              : ALB 5xx > 50/mnt → SNS → PagerDuty P1
alb-latency-p99           : P99 latency > 3s → SNS email
rds-cpu-high              : Aurora CPU > 85% 15 menit → SNS
rds-connections-high      : Connections > 800 → SNS
rds-serverless-max-acu    : ACU > 90% max → SNS urgent scale
redis-cpu-high            : Redis CPU > 75% → SNS
redis-memory-high         : Memory > 80% → SNS
redis-evictions           : Evictions > 1000/5mnt → SNS
kafka-under-replicated    : Topics under-replicated → SNS P0
ecs-task-count-low        : Service tasks < min desired → SNS P1
sqs-dlq-messages          : Any DLQ message > 0 → SNS (action required)
ai-cost-spike             : AI spend > $500/hari → SNS urgent
gpu-asg-scaling-failure   : ASG fails to launch → SNS
```

---

## 12. CI/CD Pipeline

### 12.1 GitHub Actions Workflows

```yaml
ci.yml (setiap push):
  1. lint + typecheck + format (< 2 mnt)
  2. unit tests + coverage check ≥ 80% (< 5 mnt)
  3. integration tests (Testcontainers) (< 10 mnt)
  4. Semgrep SAST + Trivy scan (paralel) (< 3 mnt)
  5. Build Docker image (multi-stage) (< 5 mnt)
  Total: ~15 menit, blokir PR jika gagal

deploy-staging.yml (push ke main):
  1. Build + push ke ECR (< 8 mnt)
  2. Run DB migrations (Flyway) (< 2 mnt)
  3. Deploy ECS services (rolling, < 10 mnt)
  4. Smoke test (< 5 mnt)
  5. E2E tests critical path (Playwright, < 30 mnt)
  Total: ~55 menit

deploy-production.yml (manual approval):
  1. Require approval dari 1 reviewer
  2. Build + push production tag ke ECR
  3. Apply Terraform changes (infra drift check)
  4. DB migrations (Flyway, production)
  5. Blue/green deploy ECS (zero-downtime)
  6. CloudFront cache invalidation
  7. Smoke test production
  8. Rollback jika smoke test gagal (automatic)
  Total: ~45 menit + approval time

terraform.yml (manual trigger):
  terraform fmt → validate → tflint → plan → apply
```

### 12.2 Deployment Strategy per Phase

```
Phase 1-2: Rolling deployment (simple, occasional brief downtime OK)
Phase 3+:  Blue/Green deployment (zero-downtime)
Phase 5:   Canary deployment (10% → 25% → 50% → 100%)
```

---

## 13. Disaster Recovery

### 13.1 Backup Strategy

```
Aurora PostgreSQL:
  Continuous PITR (5-menit granularity)
  Daily automated snapshots (retained 35 hari production)
  Cross-region snapshot copy → ap-southeast-1 daily

Redis:
  Daily RDB snapshot → S3
  Replication across AZ (automatic failover < 1 menit)

S3:
  Versioning enabled (media + assets bucket)
  Cross-region replication → ap-southeast-1 (Phase 3+)
  Glacier backup setelah 180 hari

ClickHouse:
  Daily backup ke S3
  Replicated tables (Phase 4+ cluster)

Kafka MSK:
  Multi-AZ replication (factor 3)
  S3 log backup via MSK Connect
```

### 13.2 Recovery Tiers

```
Tier 1 — Automatic (< 1 menit):
  Redis primary failure → ElastiCache automatic failover
  ECS task crash → ECS restart + health check reroute
  EC2 GPU failure → ASG replace instance

Tier 2 — Semi-auto (< 15 menit):
  Aurora primary failure → automatic promotion reader
  NAT Gateway AZ failure → traffic reroute via other AZ NAT

Tier 3 — Manual (< 4 jam):
  Full AZ outage → activate DR region (ap-southeast-1)
  Data corruption → PITR restore Aurora + Redis rebuild
  KMS key compromise → re-encrypt all secrets + rotate

Tier 4 — Full DR (< 4 jam via runway):
  Region outage Jakarta → failover ke Singapore
  RTO: 4 jam, RPO: 1 jam (Phase 3+) → 30 mnt / 5 mnt (Phase 5)
```

---

## 14. Technology Stack Lengkap

### 14.1 Frontend

```
Next.js 14 (App Router)      Web framework
TypeScript 5.x               Type safety
Tailwind CSS v3              Styling
shadcn/ui                    Component library
Radix UI                     Headless primitives
TanStack Query v5            Server state
Zustand v4                   Client state
Vercel AI SDK                AI streaming
React Hook Form              Forms
Zod                          Validation
Recharts                     Charts
FullCalendar                 Scheduler calendar
Fabric.js                    Canvas editor
dnd-kit                      Drag and drop
react-dropzone               File upload
Lucide React                 Icons
next-i18next                 Internasionalisasi (Phase 5)
react-joyride                Feature tours (Phase 3+)
LaunchDarkly React SDK       Feature flags (Phase 3+)
Sentry Browser               Error tracking
PostHog JS                   Product analytics
```

### 14.2 Mobile

```
React Native 0.73            Cross-platform
Expo SDK 50                  Managed workflow
Expo Router v3               Navigation
NativeWind                   Styling
FlashList                    Performant lists
expo-camera                  Camera
expo-image-picker            Gallery
Expo Notifications           Push notifications
Victory Native               Charts
TanStack Query               Server state
Sentry Native                Crash reporting
```

### 14.3 Backend

```
Node.js 20 LTS               Runtime (all Node services)
Fastify v4                   HTTP framework
TypeScript 5.x               Type safety
Prisma v5                    ORM
BullMQ v5                    Job queue
ioredis                      Redis client
jose                         JWT RS256
Passport.js                  OAuth strategies
Sharp                        Image processing
Puppeteer                    PDF generation (serverless)
Zod                          Validation (shared)

Python 3.12                  Runtime (AI services)
FastAPI                      HTTP framework
Pydantic v2                  Validation
Celery                       Task queue
FFmpeg (subprocess)          Video processing
Pillow                       Image processing
boto3                        AWS SDK
openai                       OpenAI SDK
anthropic                    Anthropic SDK
replicate                    Replicate SDK
scikit-learn                 ML models (scoring)
prophet                      Time series forecasting (Phase 4)
sentence-transformers        Embeddings (Phase 4)
```

### 14.4 Databases & Storage

```
PostgreSQL 15 (Aurora Serverless v2)   Primary transactional DB
Redis 7 (ElastiCache Cluster)          Cache + job queue
ClickHouse 24                          Analytics OLAP
Pinecone Serverless                    Vector embeddings
Amazon S3                             Media + artifacts storage
Cloudflare R2                         CDN origin (egress cost)
DynamoDB                              Terraform state lock
```

### 14.5 Infrastructure & DevOps

```
AWS ECS Fargate              Container orchestration (CPU)
EC2 g4dn.xlarge              GPU workers (video)
Amazon MSK                   Kafka 3.6 managed
Amazon SQS                   Async queues
Amazon CloudFront            Global CDN
AWS WAF                      Web Application Firewall
AWS KMS                      Encryption keys
AWS Secrets Manager          Secret storage + rotation
AWS SSM Parameter Store      Non-secret config
AWS ACM                      TLS certificates
Route 53                     DNS management
Amazon ECR                   Container registry
Terraform 1.7+               Infrastructure as Code
AWS CDK (TypeScript)         Complex infra patterns
GitHub Actions               CI/CD
Docker                       Containerization
Nx Monorepo + Turborepo      Monorepo tooling
PgBouncer                    Connection pooling (Phase 3+)
```

### 14.6 Monitoring & Security

```
Datadog                      APM + logs + dashboards
AWS X-Ray                    Distributed tracing
CloudWatch                   AWS native metrics + alarms
Sentry                       Error tracking (web + mobile + backend)
PagerDuty                    Incident management + oncall
PostHog                      Product analytics
Better Uptime                External monitoring + status page
Semgrep                      SAST code scanning
Trivy                        Container image vulnerability scan
OWASP ZAP                    DAST (quarterly)
Dependabot                   Dependency vulnerability alerts
```

### 14.7 Testing

```
Vitest                       Unit test (Node.js)
pytest + pytest-asyncio      Unit test (Python)
Playwright                   E2E test (web)
Detox                        E2E test (mobile)
Testcontainers               Integration test (DB + Redis real)
Supertest                    API test
Artillery v2                 Load testing
k6                           Stress testing
Pact.io                      Contract testing
React Testing Library        Component testing
```

---

## 15. Architecture Decision Records

### ADR-001: Monorepo vs Polyrepo
**Keputusan:** Monorepo (Nx + Turborepo)
**Alasan:** Shared types/utils tanpa publish npm, atomic commits cross-service, satu PR untuk full-stack change, cache build artifacts.

### ADR-002: ECS Fargate vs Kubernetes
**Keputusan:** ECS Fargate
**Alasan:** Zero cluster management, per-task IAM roles, native AWS service integration, lebih murah untuk skala awal. K8s di-evaluate di Phase 5 jika >50 services.

### ADR-003: PostgreSQL + ClickHouse vs Single DB
**Keputusan:** Dual DB strategy
**Alasan:** PostgreSQL untuk OLTP (complex queries, ACID, RLS), ClickHouse untuk OLAP (1B+ events, sub-second analytics). Single PostgreSQL tidak bisa handle analytics scale.

### ADR-004: Supabase (Solo Dev) vs Raw PostgreSQL (Production)
**Keputusan:** Supabase untuk Phase 1-2 (solo dev), migrasi ke Aurora Phase 3
**Alasan:** Supabase zero-infra-ops untuk MVP. Aurora ketika tim berkembang dan scale dibutuhkan.

### ADR-005: QStash (Phase 1-2) vs BullMQ + Kafka (Phase 3+)
**Keputusan:** Graduated migration
**Alasan:** QStash serverless = $0 idle, cocok untuk MVP. BullMQ+Kafka ketika job volume > 10K/hari dan priority queuing diperlukan.

### ADR-006: GPT-4o vs Claude sebagai Primary LLM
**Keputusan:** GPT-4o primary, Claude fallback
**Alasan:** GPT-4o lebih baik untuk Bahasa Indonesia informal/gaul. Claude lebih baik untuk long-form structured output. Dual-provider = resilience.

### ADR-007: White-label Architecture
**Keputusan:** Subdomain routing + DB config per tenant
**Alasan:** CNAME support untuk custom domain. CSS variable override untuk branding. Single deployment, multi-brand dari config — tidak perlu deploy ulang.

### ADR-008: Fine-tuning Strategy (Phase 5)
**Keputusan:** GPT-4o-mini fine-tune per niche
**Alasan:** Fine-tune 50-80% lebih murah dari GPT-4o untuk same quality pada domain spesifik. A/B test sebelum promote. Niche-specific = lebih akurat untuk Indonesia market.

---

## 16. Architecture Evolution Roadmap

```
Phase 1 (W1-10):  MVP Stack
  Next.js + Supabase + Vercel + Upstash + OpenAI
  ↓ Semua dalam 1 monolith Next.js, tidak ada microservice

Phase 2 (W11-18):  Add Growth Services
  Extract: ads-service, affiliate-service (standalone Fastify)
  Add: ClickHouse, MSK Kafka (replaces QStash events)
  Add: ElevenLabs, Runway ML

Phase 3 (W19-28):  Scale Infrastructure
  Migrate: Supabase → Aurora Serverless v2
  Add: GPU ASG, BullMQ (replaces QStash for video)
  Add: CloudFront + WAF production
  Add: Feature flags (LaunchDarkly)
  Add: PgBouncer connection pooling

Phase 4 (W29-40):  Intelligence Layer
  Add: insight-engine, competitor-service, brand-voice-service
  Add: Pinecone scale-up, Prophet time series models
  Add: React Native mobile app
  Add: Integration service (Zapier/Make/Webhook)
  Add: OpenTelemetry (vendor-agnostic tracing)

Phase 5 (W41-52):  Enterprise Scale
  Add: whitelabel-service, marketplace-service
  Add: GPT fine-tune pipeline
  Add: HeyGen deepfake avatar, ElevenLabs voice clone
  Add: ClickHouse distributed cluster (3+ nodes)
  Add: Redis cluster mode upgrade
  Evaluate: Kubernetes migration (if > 50 services)
  Evaluate: Multi-region active-active (if needed)
```

---

*Dokumen ini adalah living document. Update setiap akhir Phase.*
*Owner: Tech Lead / Solo Developer · Review: Sprint Planning tiap 2 minggu*
*Last updated: April 2026 — v2.0 (full Phase 1-5 integrated)*
