# Specification: Agentflow_AI (Agentic AI Automation Platform)

## Project Overview
Build a full-stack AI Operations Automation Platform called Agentic AI Automation Platform (Agentflow_AI) that lets operators describe an automation in natural language and turn it into an executable visual workflow. The platform must generate workflow graphs from prompts, render those graphs on a drag-and-drop canvas, execute them through a chain of cooperating AI agents, integrate with real third-party tools (Gmail, Slack, Discord, Google Sheets) over OAuth, queue and retry background jobs, stream live execution events to the browser, and persist a full timeline of every step for auditing.

## Tech Stack
- **Frontend**: Next.js (Pages Router), React 19, Tailwind CSS, Zustand, Axios, React Flow (`@xyflow/react`), Socket.IO client, and `lucide-react` icons.
- **Backend**: Node.js, Express, MongoDB, Mongoose, JSON Web Tokens, BullMQ on Redis (via ioredis), Socket.IO, helmet, morgan, compression, express-validator, and bcryptjs.
- **AI Integration**: OpenRouter API and the Google Generative AI SDK, with LangChain and LangGraph available for agentic orchestration.
- **Integrations**: Gmail, Slack, Discord, and Google Sheets.
- **Security**: Password hashing with bcrypt, JWT, encrypted credentials at rest using `CREDENTIAL_ENCRYPTION_KEY`.

## Core Features

### Authentication
The authentication system must support registration, login, JWT-based session handling, protected routes, an `/auth/me` profile endpoint, role separation between admin and operator, password hashing with bcrypt at cost 12, and persistent login state on the client through Zustand.

### Workflow Management
For workflow management, users must be able to create workflows manually, generate workflows from a natural-language prompt, list and search their workflows, open any workflow on a React Flow canvas, drag nodes from a palette, configure each node through a side panel, save, duplicate, version, and delete workflows, and trigger executions on demand. Every workflow stores its nodes, edges, trigger configuration, tags, and version number.

### Agentic Orchestration
For agentic execution, the backend must run each workflow through a fixed chain of agents:
1. **Planner Agent**: Decides the node ordering and emits a confidence score.
2. **Execution Agent**: Runs each node against the correct integration or AI provider.
3. **Validation Agent**: Verifies required output fields.
4. **Recovery Agent**: Classifies failures (`MISSING_FIELDS`, `API_FAILURE`, `AUTH_EXPIRED`, `RATE_LIMIT`, `TRANSIENT`) and decides between `retry_with_backoff` and `escalate`.
5. **Monitoring Agent**: Emits timeline events.

LangGraph must be importable as the orchestration substrate, and the orchestrator must report `langGraph: 'available' | 'not-installed'` with each run.

### Third-Party Integrations
The integrations layer must support Gmail (send and read mail), Slack (post messages and subscribe to events), Discord (post bot messages), and Google Sheets (append rows and read ranges). Each provider must support an OAuth start endpoint, an OAuth callback endpoint, and a connected/disconnected status. Access tokens and refresh tokens must be encrypted at rest using `CREDENTIAL_ENCRYPTION_KEY`. The connection state must be visible from the integrations page, and a missing or expired credential must surface as a clear `INTEGRATION_NOT_CONNECTED` or `AUTH_EXPIRED` error in the execution timeline rather than a silent failure.

### Execution Engine
For execution, the backend must persist every run as an Execution document with one of `PENDING`, `RUNNING`, `COMPLETED`, `FAILED`, `RETRYING`, `PAUSED`, or `CANCELLED` status, record the workflow snapshot at run time, capture input, output, error, duration, and retry count, and write one ExecutionLog row per agent event. Users must be able to pause, resume, and cancel a running execution. BullMQ on Redis must handle background scheduling and retry backoff, with an in-memory fallback when Redis is not configured.

### AI Workflow Generation
For AI workflow generation, the user submits a prompt and the system must return a complete workflow with named nodes, positions, edges, and per-node configuration. The generator must prefer OpenRouter when `OPENROUTER_API_KEY` is set, fall back to Google Gemini when `GEMINI_API_KEY` is set, and fall back to a deterministic rule-based builder when neither is available. The deterministic builder must still produce a runnable graph for common prompts (send email, invoice routing, Slack/Discord notification, sheet append). The available node catalog is grouped into triggers, actions, AI nodes, and logic nodes.

### Real-Time Layer
The Socket.IO server must broadcast agent events (planner, execution, validation, recovery, monitoring) for each execution to subscribed clients, and the client must render those events as a live timeline. Notifications generated during execution (success, failure, escalation) must persist and appear in a notifications drawer.

---

## Frontend Pages (Next.js Pages Router)
- `/` - Landing page with platform introduction, AI workflow automation overview, multi-agent orchestration explanation, workflow generation showcase, CTA buttons, feature sections, responsive layout, authentication-aware redirects, and dark theme support.
- `/login` - Login form with email and password, JWT-based authentication flow, Zustand auth store persistence, form validation, loading states, redirect after login, and authentication error handling.
- `/register` - Registration form with user account creation, password validation, JWT authentication flow, Zustand session persistence, loading states, and registration error handling.
- `/dashboard` - Operator console with workflow metrics, active workflow statistics, recent execution summaries, success rate indicators, recent workflow lists, AI reasoning activity feeds, real-time execution events, responsive metric cards, and dashboard analytics panels. Includes `MetricGrid`, `AppShell` layout, workflow summary cards, and an AI activity panel.
- `/workflows/builder` - AI-powered prompt-to-workflow generation page with automation prompt input, AI workflow graph generation, React Flow canvas rendering, workflow preview support, graph editing capabilities, workflow validation, save workflow functionality, execution trigger support, and multi-agent orchestration visualization. Required components: `WorkflowCanvas`, `PromptInputPanel`, `GraphPreviewPanel`, and `WorkflowToolbar`.
- `/workflows/[id]` - Full workflow editor with a node palette on the left, React Flow canvas in the center, and node configuration panel on the right. Includes node editing, workflow connections, workflow execution controls, execution logs, workflow metadata, validation support, retry execution support, and real-time execution monitoring.
- `/executions` - Lists all workflow executions with execution status, execution duration, timeline links, execution logs, success/failure indicators, retry execution support, filtering, sorting, pagination, and live execution updates through Socket.IO.
- `/integrations` - Lists all supported providers (Gmail, Slack, Discord, Google Sheets) with connection status, OAuth connection flow, reconnect functionality, integration testing support, provider configuration management, and enable/disable toggling.
- `/settings` - User profile management, role information, API key status monitoring, encryption key health checks, credential management, notification preferences, theme settings, security controls, and logout support.

---

## Backend Architecture and Database Collections

### Backend Architecture
- **Routes**: HTTP routing, request validation via `express-validator`, and middleware composition (auth, validation, error handler).
- **Controllers**: Handle request parsing and response shaping only (never talks to Mongo directly).
- **Services**: Owns business logic: workflow CRUD, execution lifecycle, integration token management, retry classification, notification creation, AI generation, and log aggregation.
- **Agents**: Planner, execution, validation, recovery, monitoring, and orchestrator modules.
- **Integrations**: Wraps each third-party SDK behind a common interface defined in `baseIntegration.js`.
- **Queues**: Wraps BullMQ and Redis.
- **Config**: Centralizes environment loading, Mongo connection (with in-memory fallback), and Socket.IO bootstrapping.

### Database Collections
- **Users**: Name, email, hashed password (using `select: false`), role (`admin` | `operator`), last login tracking, JWT authentication support, account activity timestamps, and secure credential management.
- **Workflows**: Workflow name, description, owner reference, status (`draft` | `active` | `paused` | `archived`), trigger configuration, React Flow nodes and edges, workflow versioning, workflow tags, execution history tracking, last execution timestamp, and workflow lifecycle management.
- **Executions**: Workflow reference, immutable workflow snapshot storage, execution status tracking, current node execution tracking, execution start and completion timestamps, execution duration, input and output payloads, execution error handling, retry count, and execution audit history.
- **ExecutionLogs**: Execution reference, workflow reference, node tracking, responsible AI agent, structured log levels (`info` | `warning` | `error` | `success`), execution event types, log messages, metadata payloads, debugging information, and real-time execution observability.
- **Integrations**: Owner reference, provider (`gmail` | `slack` | `google-sheets` | `discord` | `openrouter` | `gemini`), OAuth connection status, provider scopes, encrypted access token, encrypted refresh token, token expiration management, integration error tracking, and secure credential lifecycle management.
- **Notifications**: Owner reference, workflow reference, execution reference, type, title, message, read/unread status, execution alerts, workflow activity updates, and real-time system notifications.
- **AgentMemory**: Workflow reference, execution reference, agent identification, memory key-value storage, confidence scoring, contextual execution memory, inter-agent shared context, and persistent agent reasoning state.

---

## API Endpoints

### Health and Auth
- `GET /api/health` - Health check.
- `POST /api/auth/register` - User registration.
- `POST /api/auth/login` - User login.
- `GET /api/auth/me` - Authenticated user profile.

### Workflows
- `GET /api/workflows/dashboard` - Dashboard metrics.
- `GET /api/workflows` - List all workflows owned by the user.
- `POST /api/workflows` - Create workflow manually.
- `POST /api/workflows/generate` - Generate workflow from prompt.
- `GET /api/workflows/:id` - Get single workflow.
- `PUT /api/workflows/:id` - Update workflow configuration.
- `POST /api/workflows/:id/duplicate` - Clone an existing workflow.
- `POST /api/workflows/:id/execute` - Execute workflow through orchestration.
- `DELETE /api/workflows/:id` - Delete workflow.

### Executions
- `GET /api/executions` - List all executions.
- `GET /api/executions/:id` - Get detailed execution info.
- `GET /api/executions/:id/timeline` - Get timeline events (execution logs).
- `POST /api/executions/:id/pause` - Pause active execution.
- `POST /api/executions/:id/resume` - Resume paused execution.
- `POST /api/executions/:id/cancel` - Cancel running execution.

### Integrations
- `GET /api/integrations` - List connected integrations.
- `GET /api/integrations/status` - Per-provider connection status.
- `GET /api/integrations/oauth/:provider/start` - Start OAuth flow.
- `GET /api/integrations/oauth/:provider/callback` - OAuth callback endpoint.
- `GET /api/integrations/oauth/error` - OAuth error handler.
- `POST /api/integrations` - Manually create or update integration credentials.

### Notifications
- `GET /api/notifications` - List notifications for the current user.

---

## Folder Structure

### Frontend Structure
```
client/
└── src/
    ├── components/
    │   ├── AppShell/
    │   ├── MetricGrid/
    │   ├── NodePalette/
    │   ├── NodeConfigPanel/
    │   ├── WorkflowCanvas/
    │   └── ProtectedRoute/
    ├── store/
    │   └── authStore.js
    ├── pages/
    │   ├── index.js
    │   ├── login.js
    │   ├── register.js
    │   ├── dashboard.js
    │   ├── executions.js
    │   ├── integrations.js
    │   ├── settings.js
    │   └── workflows/
    │       ├── builder.js
    │       └── [id].js
```

### Backend Structure
```
server/
└── src/
    ├── config/
    │   ├── env.js
    │   ├── db.js
    │   └── socket.js
    ├── routes/
    │   ├── authRoutes.js
    │   ├── workflowRoutes.js
    │   ├── executionRoutes.js
    │   ├── integrationRoutes.js
    │   └── notificationRoutes.js
    ├── controllers/
    │   ├── authController.js
    │   ├── workflowController.js
    │   ├── executionController.js
    │   ├── integrationController.js
    │   └── notificationController.js
    ├── services/
    │   ├── workflowService.js
    │   ├── executionService.js
    │   ├── integrationService.js
    │   ├── notificationService.js
    │   └── aiService.js
    ├── agents/
    │   ├── plannerAgent.js
    │   ├── executionAgent.js
    │   ├── validationAgent.js
    │   ├── recoveryAgent.js
    │   ├── monitoringAgent.js
    │   └── orchestrator.js
    ├── integrations/
    │   ├── baseIntegration.js
    │   ├── gmailIntegration.js
    │   ├── slackIntegration.js
    │   ├── discordIntegration.js
    │   └── sheetsIntegration.js
    ├── queues/
    │   └── workflowQueue.js
    └── app.js
```

---

## Development Phases

- **Phase 1**: Frontend and backend project initialization, MongoDB connection (with in-memory fallback), JWT authentication, protected route middleware, Zustand auth persistence, AppShell layout structure, environment configuration.
- **Phase 2**: Workflow CRUD operations, dashboard metrics, React Flow canvas integration, drag-and-drop workflow editing, node palette, configuration panel.
- **Phase 3**: AI-powered workflow generation (OpenRouter, Gemini, or rule-based fallback), prompt-to-workflow graph builder page.
- **Phase 4**: Multi-agent orchestration (planner, execution, validation, recovery, monitoring agents), execution state control (pause, resume, cancel), database log persistence.
- **Phase 5**: Third-party integrations (Gmail, Slack, Discord, Google Sheets) using baseIntegration interface, OAuth flow, encrypted credential storage.
- **Phase 6**: BullMQ background queue with Redis fallback, Socket.IO live timeline events, notifications drawer.

---

## UI and UX Requirements
- Clean operator-console aesthetic.
- Fully responsive.
- Loading states and skeleton loaders.
- React Flow graph rendering with animated edges.
- Drag-and-drop node creation.
- Right-hand node configuration panel.
- Color-coded timeline events with agent badges.
- Persistent notifications drawer in AppShell.

## Security Requirements
- bcrypt password hashing (cost 12).
- JWT session management (signed with `JWT_SECRET`).
- Encryption at rest for OAuth credentials (`CREDENTIAL_ENCRYPTION_KEY`).
- Helmet HTTP security headers, CORS restricted to `CLIENT_URL`.
- Authentication rate limits, express-validator body validation.
- Missing credentials reported as explicit errors, not 500s.

## Final Expected Outcome
A Zapier/n8n-like platform with an explicit agentic execution layer, allowing natural language prompts to turn into runnable visual graphs executed by cooperating agents with real-time updates and OAuth integrations.

## Codex Implementation Instructions
- Follow the folder structure strictly.
- Thin controllers, logic in services.
- Agents are pure (no HTTP knowledge).
- All integrations extend `baseIntegration.js`.
- Never call Mongo from controllers.
- Use in-memory MongoDB/Redis fallback for easy local dev.
- Emit Socket.IO events and write `ExecutionLog` for every agent step.
