# ADR-002 — Local-first MVP

- **Status:** Accepted
- **Decision:** Keep Milestone 1 entirely in the browser with no backend, accounts, analytics, or persistent player data.
- **Why:** Two children play together on one device. Local state provides privacy, instant startup, low operating complexity, and fast experimentation.
- **Alternatives considered:** A hosted game service; account-backed synchronization; peer-to-peer multiplayer.
- **Tradeoffs:** Refreshing the page restarts the current game, and there is no remote multiplayer or cross-device synchronization.
- **When to reconsider:** Revisit when online multiplayer, durable child profiles, cross-device progress, parent dashboards, or cloud backup becomes an approved requirement.
