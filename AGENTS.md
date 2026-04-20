# AGENTS.md — Coding Agent Guidelines

This monorepo contains two packages:
- **`website/`** — Astro + React frontend (TypeScript), see `website/AGENTS.md`
- **`backend/`** — Kotlin + Spring Boot backend, see `backend/AGENTS.md`

---

## Repository Structure

```
/
├── website/        # Astro/React frontend
├── backend/        # Kotlin/Spring Boot backend
├── docs/           # Architecture documentation (arc42)
└── docker-compose.yml
```

---

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org):
```
feat: add new organism dashboard
fix: correct date range calculation
chore: update dependencies
```
- PR titles become the squash-merge commit message — they must also follow conventional commits.
- Messages should explain **why** a change was made, not just what.

---

## Architecture Notes

- **State in URL**: View state (filters, selected variants) is stored as query parameters so pages are bookmarkable and shareable.
- **LAPIS**: All genomic data queries go directly from the browser to LAPIS instances — they do not go through the backend.
- **Backend**: Only handles subscriptions and collections features; authentication is handled in the frontend (Astro middleware) and proxied to the backend.
- **Organisms**: Adding a new organism requires entries in `website/src/types/Organism.ts`, `website/src/views/`, and corresponding Astro pages.
