## Backend Contract (Frozen Interfaces)

This document defines non-negotiable backend contracts that must remain stable across future revisions. Any new features must conform to these constraints.

### 1) Platform & Architecture
- Node.js LTS, Express, MongoDB with Mongoose. No framework/DB swap.
- REST over HTTPS, JSON only. All timestamps in ISO-8601 UTC.

### 2) API Surface & Versioning
- Base path: `/api` (no version prefix retrofits). Public health: `/health`.
- Pagination params: `page`, `limit`; defaults: `page=1`, `limit=10`; `limit<=100`.
- Error envelope shape: `{ success: false, code?, message, details?, requestId? }`.

### 3) Authentication & Authorization
- JWT Bearer in `Authorization` header. No session cookies.
- Middleware `protect` must guard private routes. `authorize(...roles)` for RBAC.

### 4) Data & IDs
- Mongo `_id` is the canonical identifier exposed in APIs.
- Soft delete where applicable via `deletedAt` field (no hard deletes of user/org/team/trainer/session).

### 5) Validation & Security
- Centralized request validation with consistent 400 response.
- CORS: origin from `FRONTEND_URL` env in production. No wildcard in prod.

### 6) Logging
- Structured logs with request-scoped correlation ID where available; avoid plaintext formatting changes.

### 7) Email
- `backend/services/emailService.js` is the single abstraction for email. Templates and variables are a contract.

### 8) Rate Limiting (when enabled)
- Global limiter for `/api/*` with standard headers. No endpoint-specific overrides that break headers.

---

### Enforced by Middleware (Guards)
- `middleware/pagination.js` clamps and exposes `req.pagination = { page, limit, skip }`.
- `middleware/validation.js` emits canonical validation errors.
- `middleware/errorHandler.js` formats server errors with stable shape.
- `middleware/auth.js` provides `protect`, `authorize`, `optionalAuth`.

Routes must use these guards to remain compliant with the contract.