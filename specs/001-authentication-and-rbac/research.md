# Research: Authentication And RBAC

## Decision 1: Keep JWT as baseline token model
- Decision: Continue using signed bearer access tokens for protected API access.
- Rationale: Matches current implementation and supports stateless authorization.
- Alternatives considered: Server-side sessions, opaque token introspection.

## Decision 2: Keep in-memory demo users for baseline
- Decision: Preserve in-memory user source in baseline spec conversion.
- Rationale: Existing implementation is development-focused and already tested.
- Alternatives considered: Database-backed users in this phase.

## Decision 3: Defer production-grade credential handling to follow-up feature
- Decision: Track password hashing and credential hardening as a future feature.
- Rationale: Current goal is project conversion to spec-driven workflow without changing behavior.
- Alternatives considered: Immediate migration in conversion phase.

## Decision 4: Enforce explicit role policy at route level
- Decision: Keep route-level role checks for clear and testable policy mapping.
- Rationale: Policy remains visible at trust boundary and simple to audit.
- Alternatives considered: Service-layer-only role checks.
