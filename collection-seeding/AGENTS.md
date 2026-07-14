# AGENTS.md — Collection Seeding

Python script that seeds example collections into the backend. Uses [pixi](https://pixi.sh) for environment management. All commands run from `collection-seeding/`.

---

## Commands

```bash
pixi run seed                        # Seed all sources
pixi run seed-lineages               # COVID pango lineages only
pixi run seed-lineages-sample        # First 10 pango lineages (quick smoke test)
pixi run seed-resistance             # COVID resistance mutations only
pixi run seed --source <name>        # Specific source by name (use --list to see all)
pixi run seed --list                 # List all available sources
```

## Tests, Lint & Format

Tests and linting run in the `test` environment (includes `pytest`, `ruff`, `responses`):

```bash
pixi run -e test test      # Run all tests
pixi run -e test lint      # Ruff lint check
pixi run -e test format    # Ruff auto-format
```

---

## Code Style

Formatting and linting are enforced by **ruff**. Run `pixi run -e test format` to auto-fix.

### Adding a New Source

1. Create `sources/your_source.py` implementing the `Source` ABC:
   ```python
   from sources import Source
   from models import Collection

   class YourSource(Source):
       name = "your-source-name"          # used with --source flag
       organism = "covid"                 # or "rsv" etc.
       owned_tag = "your-tag"             # tag used to identify seeder-owned collections
       include_in_default_run = True      # whether included in `pixi run seed`

       def get_collections(self) -> list[Collection]:
           ...
   ```
2. Register it in `sources/registry.py` by adding it to `ALL_SOURCES`.
3. Add a test in `tests/` following the existing pattern (use the `responses` library to mock HTTP calls).

### Testing Conventions

- Tests use `pytest` and live in `tests/`.
- Mock external HTTP calls with the `responses` library — do not make real network calls in tests.
- Test file names mirror the source module they test (e.g. `test_pango_lineages.py` → `covid_pango_lineages.py`).
