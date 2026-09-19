# Package dependency rules (Handover 2)

- `@ckes/benchmark` must **not** depend on `@ckes/harness`, Scenario Lab API/UI, or `@ckes/pipeline`.
- `@ckes/harness` depends on `@ckes/benchmark` and invokes `@ckes/pipeline`.
- `@ckes/scenario-lab-api` depends on `@ckes/harness` only (not pipeline directly).
- CLI depends on `@ckes/harness`.
- React UI depends on API client types in `@ckes/scenario-lab-contract` only.
