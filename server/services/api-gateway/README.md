# Express + TypeScript Backend Template

This is a reusable, production-ready backend template based off a solid scalable architecture using Express, Node.js, and TypeScript. 

It strips away domain-specific business logic but retains the core scaffolding needed to start any standard SaaS or standard web application, including:

- **Authentication**: JWT-based auth with refresh token rotation.
- **Role-Based Access Control (RBAC)**: Support for multiple roles (Customer, Partner, Admin).
- **Social Login**: Built-in Google OAuth 2.0 via Passport.js.
- **Security**: Helmet, Compression, Rate Limiting, CORS configuration.
- **Robust Error Handling**: Custom AppError classes, centralized async handlers, and standard JSON responses.
- **Logging**: Winston logger with daily rotating files.
- **Dependency Injection**: Integrated with TSyringe for service, controller, and repository management.
- **Database**: Mongoose (MongoDB) with structured Repositories and Interfaces.

## Folder Structure

```
├── docs/                   # Documentation (e.g. Google OAuth settings)
├── src/                    # Source Code
│   ├── config/             # Environment, Database, Passport setup
│   ├── container/          # TSyringe DI setup
│   ├── controllers/        # Request Handlers
│   ├── dtos/               # Data Transfer Objects
│   ├── enums/              # Shared Enums (HttpStatus, Messages)
│   ├── interfaces/         # TypeScript Interfaces
│   ├── middleware/         # Express Middlewares (Auth, Validation, etc.)
│   ├── models/             # Mongoose Schemas
│   ├── repositories/       # Data Access Layer
│   ├── routes/             # Express Routers
│   ├── services/           # Business Logic Layer
│   ├── types/              # Global Types
│   ├── utils/              # Helper functions, logger, encryption
│   └── main.ts             # Application entry point
├── .env.example            # Environment variables template
├── package.json            # Dependencies and scripts
└── tsconfig.json           # TypeScript configuration
```

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```
2. **Setup environment variables**:
   Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```
   *Fill in your MongoDB URI, JWT Secrets, and Email credentials.*
3. **Run local development server**:
   ```bash
   npm run dev
   ```

## Google OAuth Setup

We've provided a dedicated guide to help you configure your Google Cloud Console for OAuth.

See [docs/GOOGLE_OAUTH_SETUP.md](./docs/GOOGLE_OAUTH_SETUP.md) for full instructions.

## Adding Features

1. **Create Model & Interface**: Create a new file in `src/models` and `src/interfaces/IModel`.
2. **Create Repository**: Define the interface in `src/interfaces/IRepository`, and implementation in `src/repositories`. Extend `BaseRepository`.
3. **Create Service**: Add business logic in `src/services`, injecting your repository.
4. **Create Controller**: Tie your route requests to your service injectables.
5. **Create Routes**: Setup Express routes in `src/routes`, adding validation middlewares.
6. **Register Dependencies**: Open `src/container/container.ts` and ensure your new Repositories, Services, and Controllers are registered with Tsyringe.
# backend_template
