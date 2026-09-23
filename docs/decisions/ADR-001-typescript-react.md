# ADR-001 — TypeScript + React

- **Status:** Accepted
- **Decision:** Build the browser client with TypeScript and React.
- **Why:** The revised product is web-first and should run in modern browsers on phones, tablets, and computers. TypeScript gives the chess domain explicit types, while React provides a focused component model for the interactive board and dialogs.
- **Alternatives considered:** Plain JavaScript; a native SwiftUI client; another component framework.
- **Tradeoffs:** This does not provide a native iOS binary or direct access to Apple-only UI APIs. Browser behavior and accessibility must be validated across platforms.
- **When to reconsider:** Revisit if distribution through native app stores, deep device integrations, or shared native capabilities become committed requirements.
