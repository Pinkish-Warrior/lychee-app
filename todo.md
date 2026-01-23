# Lychee Project TODO

## Phase 1: Foundation & MVP

### Database & Schema
- [x] Design and implement notes table schema (content, category, confidence, reasoning, timestamps)
- [x] Create feedback/correction tracking table
- [x] Set up database migrations

### Backend - AI Classification
- [x] Implement Claude 3.5 Sonnet integration for note classification
- [x] Build structured JSON output prompt for confidence scoring
- [x] Create classification procedure with reasoning and confidence score
- [x] Implement confidence threshold logic (HIGH: 0.85, MEDIUM: 0.6)
- [x] Add environment variable configuration for thresholds
- [x] Create review queue query for low-confidence notes

### Backend - API Routes
- [x] Create tRPC procedure for capturing and classifying notes
- [x] Create tRPC procedure for retrieving dashboard notes
- [x] Create tRPC procedure for retrieving review queue items
- [x] Create tRPC procedure for manual classification correction
- [x] Create tRPC procedure for retrieving category-filtered notes

### Frontend - UI Components
- [x] Build note capture interface (textarea + capture button)
- [x] Create dashboard view with recent notes display
- [x] Build review queue view with confidence display
- [x] Create category-specific views (Projects, People, Ideas, Admin)
- [x] Implement navigation sidebar

### Frontend - Integration
- [x] Wire capture form to classification API
- [x] Implement dashboard data fetching
- [x] Implement review queue data fetching
- [x] Add manual correction interface
- [x] Implement category filtering

### Testing & Validation
- [x] Write vitest tests for classification logic
- [x] Write vitest tests for API procedures
- [x] Test confidence threshold logic
- [x] Validate user feedback tracking

## Phase 2: Enhancement & Polish
- [ ] Add voice note capture (future)
- [ ] Implement semantic search with embeddings (future)
- [ ] Add daily digest email (future)
- [ ] Build analytics dashboard (future)
