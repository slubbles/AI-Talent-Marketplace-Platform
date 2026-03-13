# Execution Continuation Protocol — User-Aligned Operating Mode

> Purpose: lock in **how we execute** the rest of this project based on your inputs.
> Scope: applies from current state through full SOW vision completion.

---

## 1) What “aligned execution” means for this project

This project is executed using your explicit operating pattern:

1. **One module/session at a time** (no context switching).
2. **No silent drift** from SOW + FOUNDATION + EXECUTION.
3. **Progress-first communication** (0–100% updates per objective).
4. **Working software over theory** (docs support execution, not replace it).
5. **CTO-demo readiness** is a hard constraint (Dockerized and reproducible).

---

## 2) Non-negotiable sources of truth

Execution must always align to these in order:

1. `maingoalandreference/AI Talent Marketplace Platform (SOW).md`
2. `notes/FOUNDATION.md`
3. `notes/EXECUTION.md`
4. `PROGRESS.md`
5. `.github/copilot-instructions.md`

If conflicts appear:
- **SOW intent wins** for deliverable scope.
- **FOUNDATION wins** for architecture decisions.
- **EXECUTION wins** for sequence and session boundaries.

---

## 3) Session execution loop (repeat exactly)

For every session, follow this exact loop:

1. **Receipt + scope lock**
   - Identify session objective, explicit in-scope tasks, explicit out-of-scope tasks.
2. **Implementation**
   - Build only what the session requires.
   - Use existing stack and patterns; no architecture changes unless blocked.
3. **Verification**
   - Typecheck/build/tests relevant to that session.
   - Runtime smoke checks for touched flows.
4. **Progress update**
   - Update `PROGRESS.md` with objective-level status and percentage.
5. **Version control hygiene**
   - Commit session work with clear message.
   - Push to `1st-execution` (unless explicitly instructed otherwise).
6. **Closeout report**
   - Report what changed, what was verified, and current overall %.

---

## 4) Progress reporting format (required)

Every update should include:

- **Session number + name**
- **Objective completion** (e.g., 0%, 25%, 50%, 75%, 100%)
- **Verification evidence** (typecheck/tests/runtime probes)
- **Current overall project %**
- **Next immediate action**

No vague status like “almost done.” Use measurable completion only.

---

## 5) Branch + delivery policy

- Primary execution branch: `1st-execution`
- Remote: `origin` (`slubbles/AI-Talent-Marketplace-Platform`)
- Keep commits scoped to completed objectives.
- Do not bundle unrelated refactors with session delivery.

When requested by you, sync `1st-execution` to `main` deliberately.

---

## 6) Whole-vision completion rule

“Continue” means continue toward full SOW vision, not partial milestone comfort.

Execution is considered complete only when all are true:

1. All 7 SOW deliverables are implemented and demonstrable:
   - Talent Mobile Application
   - Recruiter Web Platform
   - Admin Dashboard
   - AI Matching Engine
   - Analytics Platform
   - API integrations
   - Documentation
2. `PROGRESS.md` reaches **100%** with session-level closure.
3. End-to-end demo path is executable.
4. Deployment and verification checklist is satisfied.

---

## 7) Guardrails to prevent misalignment

- No adding features outside SOW/EXECUTION unless explicitly requested.
- No hidden assumptions about “done”; rely on checklist evidence.
- No skipping verification just because typecheck passes.
- No postponing critical blockers without logging them in progress notes.

If blocked, report:
1) blocker, 2) root cause, 3) exact next recovery action.

---

## 8) Client/CTO readiness standard

At every major checkpoint, maintain:

- Reproducible local run path
- Clear env templates (`.env.example` current)
- Valid migration history
- Clean compile/type state
- Minimal friction demo narrative

The output should be credible for both:
- **Business stakeholder** (clarity, momentum, outcomes)
- **CTO reviewer** (architecture discipline, correctness, reproducibility)

---

## 9) Current continuation directive

Apply the same execution pattern used so far, but continue until whole-vision completion:

- Finish remaining sessions and validation work.
- Keep status visible in `PROGRESS.md`.
- Keep branch hygiene strict.
- Keep communication objective, percentage-based, and evidence-backed.

This file is the operational contract for continuation.
