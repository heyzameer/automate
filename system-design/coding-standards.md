# 5. Coding Standards & Best Practices

To ensure maintainability and consistency across CarBot AI, all developers must adhere to the following conventions across both frontend and backend codebases.

### 5.1 Naming Conventions
- **Files & Directories:** `kebab-case` for folders and non-component files (e.g., `auth.controller.ts`, `api-client.ts`). `PascalCase` for React components (e.g., `VehicleDetail.tsx`).
- **Variables & Functions:** `camelCase` (e.g., `getUserData`, `isModalOpen`).
- **Classes & Models:** `PascalCase` (e.g., `UserRepository`, `InventoryService`).
- **Constants & Enums:** `UPPER_SNAKE_CASE` (e.g., `MAX_RETRY_COUNT`, `Roles.SUPER_ADMIN`).
- **Private Variables / Methods:** Prefix with an underscore `_` (e.g., `_initializeConnection()`, `_internalState`).

### 5.2 TypeScript Usage
- **Strict Typing (Avoid `any`):** The use of the `any` type is strictly prohibited. Always define explicit interfaces or use specialized types. If a type is truly unknown, use `unknown` and assert/check types before usage.
- **Explicit Interfaces:** Payloads, DB models, and component props must have clear interfaces or type aliases exported from a central `types/` directory when shared.

### 5.3 Routes & Endpoints
- **Centralized Constants:** All frontend navigational routes and backend API endpoints must be defined as variables in a constants file (e.g., `API_ENDPOINTS.AUTH.LOGIN`, `APP_ROUTES.DASHBOARD`).
- **No Hardcoded Paths:** Never hardcode route strings in `href`, `<Link>`, or `fetch()` functions. This mitigates typos and streamlines global refactoring.

### 5.4 Linting & Formatting
- **ESLint Integration:** ESLint is mandatory for all projects (frontend and backend) to catch problematic patterns and enforce these guidelines automatically.
- **Zero Warnings:** All code must pass linting without warnings (`eslint . --ext .ts,.tsx`) before submission.
- **Prettier:** Code formatting must conform to the unified Prettier configuration for consistent styling.
