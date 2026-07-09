# Intelligent Vendor Recommendation Platform

An intelligent Express-based backend service designed to match work requirements/projects with the most suitable active vendors. The system uses a hybrid matchmaking algorithm that blends deterministic multi-criteria scoring with Google Gemini AI (`gemini-2.5-flash`) to generate human-readable recommendation summaries and vendor comparison tables.

---

## Table of Contents
1. [Project Architecture](#1-project-architecture)
2. [Database Design](#2-database-design)
3. [API Design](#3-api-design)
4. [Recommendation Logic](#4-recommendation-logic)
5. [AI Integration](#5-ai-integration)
6. [Assumptions](#6-assumptions)
7. [Trade-offs](#7-trade-offs)
8. [Getting Started](#8-getting-started)

---

## 1. Project Architecture

The codebase follows a clean, layered architecture structure built on Node.js and Express to enforce separation of concerns:

```mermaid
graph TD
    Client[Client / Consumer] -->|HTTP Requests| Router[Route Layer]
    Router -->|Validation & Auth| Middleware[Middleware Layer]
    Middleware -->|Trigger Handler| Controller[Controller Layer]
    Controller -->|Invoke Business Logic| Service[Service Layer]
    Service -->|Database Queries| ORM[Prisma ORM]
    ORM -->|Persistence| DB[(PostgreSQL Database)]
    Service -->|LLM Summaries| GeminiAPI[Google Gemini API]
```

### Folder Structure
- **`src/server.js`**: Application entry point initializing the HTTP server.
- **`src/app.js`**: Core Express app setup, globally registering middlewares (cors, helmet, morgan, express.json) and mounting router routes.
- **`src/routes/`**: Handles endpoint registrations (e.g., `auth.routes.js`, `vendor.routes.js`, `vendorDocument.routes.js`, `workRequirement.routes.js`).
- **`src/middlewares/`**: Performs request interception:
  - `auth.middlewares.js`: Decodes and validates JWT headers.
  - `authorization.middlewares.js`: Restricts access to roles (e.g. `ADMIN` or `USER`).
  - `validate.middleware.js`: Runs request bodies against validation schemas.
  - `error.middleware.js`: Global Express catch-all error handler.
- **`src/controllers/`**: Extracts parameters, delegates to services, and formats standard REST API responses.
- **`src/services/`**: Holds core business calculations and external API communications.
- **`src/validators/`**: Hosts input schemas utilizing Zod.
- **`src/config/`**: Dynamic global values (e.g. enum lists, database client configurations).
- **`prisma/`**: Schema definitions (`schema.prisma`) and migrations.

---

## 2. Database Design

The relational database architecture is defined in the Prisma schema targeting **PostgreSQL**:

```mermaid
erDiagram
    USER {
        string id PK
        string name
        string email UK
        string password
        Role role
        DateTime createdAt
        DateTime updatedAt
    }
    VENDOR {
        string id PK
        string vendorname
        string vendorType
        string category
        string email UK
        string location
        float rating
        VendorStatus status
        int establishmentYear
        DateTime createdAt
        DateTime updatedAt
    }
    VENDOR_DOCUMENT {
        string id PK
        string vendorId FK
        DocumentType documentType
        string documentName
        DateTime expiryDate
        boolean verified
        DateTime createdAt
        DateTime updatedAt
    }
    WORK_REQUIREMENT {
        string id PK
        string title
        string category
        float estimatedValue
        string location
        string description
        Priority priority
        DateTime expectedStartDate
        DateTime createdAt
        DateTime updatedAt
    }
    RECOMMENDATION {
        string id PK
        string vendorId FK
        string workRequirementId FK
        float score
        string reason
        DateTime createdAt
        DateTime updatedAt
    }
    VENDOR ||--o{ VENDOR_DOCUMENT : has
    VENDOR ||--o{ RECOMMENDATION : receives
    WORK_REQUIREMENT ||--o{ RECOMMENDATION : generates
```

### Key Models
- **`User`**: System managers with access credentials and authentication roles (`ADMIN`, `USER`).
- **`Vendor`**: Registered service providers, filtering candidates via `category`, location, active status, ratings, and experience.
- **`VendorDocument`**: Compliance documents (TAX_REGISTRATION, INSURANCE, etc.) checked during matching to verify status and expiry.
- **`WorkRequirement`**: Specific client projects/jobs requiring matching.
- **`Recommendation`**: Links vendors to work requirements with scored ratings and summary results.

---

## 3. API Design

All endpoints are prefix-routed under `/api/v1/` and require valid JWT headers unless marked public.

| Endpoint | Method | Role Permissions | Description |
| :--- | :--- | :--- | :--- |
| `/api/v1/auth/register` | `POST` | Public | Registers a new account |
| `/api/v1/auth/login` | `POST` | Public | Authenticates and returns a JWT |
| `/api/v1/vendor` | `POST` | Admin Only | Adds a new vendor to the platform |
| `/api/v1/vendor` | `GET` | Authenticated | Lists all vendors (supports pagination) |
| `/api/v1/vendor/:id` | `GET` / `PUT` | Authenticated | Views or updates vendor details |
| `/api/v1/vendor/:id` | `DELETE` | Admin Only | Deletes a vendor |
| `/api/v1/vendorDocument` | `POST` / `PUT` | Authenticated | Uploads or updates compliance documents |
| `/api/v1/vendorDocument/expired` | `GET` | Authenticated | Fetches all expired compliance files |
| `/api/v1/workRequirement` | `POST` / `GET` | Authenticated | CRUD operations for project postings |
| `/api/v1/workRequirement/:id/recommendations` | `GET` | Authenticated | **Matching Engine**: Generates ranked scores and LLM recommendations |

---

## 4. Recommendation Logic

Matching algorithms rank vendors out of a baseline dynamic range using five scoring criteria:

1. **Category Match (Max 40 points)**
   - Checks if the vendor's category matches the project requirements (case-insensitive). If matched, adds `40 points`; otherwise, `0 points`.
2. **Experience Check (Max 30 points)**
   - Calculates duration in industry using establishment year: `currentYear - establishmentYear`.
   - Age $\ge$ 5 years: `+30 points`.
   - Age $\ge$ 3 years: `+20 points`.
   - Age $\ge$ 1 year: `+10 points`.
   - $<1$ year or unspecified: `+0 points`.
3. **Document Compliance (Max 30 points)**
   - Checks compliance paperwork verification:
     - All documents verified and active (none expired): `+30 points`.
     - Some documents verified and none expired: `+15 points`.
     - Any document expired or unverified: `+0 points`.
4. **Location Proximity (Max 20 points)**
   - Parsed with a coordinate Regex (`latitude, longitude`). If both the vendor and work requirement provide latitude/longitude strings, distance is calculated using the **Haversine formula**.
     - Distance $\le$ 50km: `+20 points`.
     - Distance $\le$ 100km: `+10 points`.
     - Mismatched address string or distance > 100km: `+0 points`.
5. **Rating Multiplier (Max 50 points)**
   - Scales the rating of a vendor (up to 5.0 stars) to a point score: `rating * 10`.

---

## 5. AI Integration

The application leverages the `@google/generative-ai` SDK (`gemini-2.5-flash` model) to synthesize data into human-readable advice:

- **Prompt Assembly**: The engine passes metadata about the requirement (priority, budget, description, category, location) combined with the scoring matrix of the top 5 match candidates to the LLM.
- **Synthesized Output**: The model generates a professional analysis:
  - Clear **Recommendation Summary** explaining why the top vendor matches.
  - A side-by-side **Vendor Comparison** table contrasting the top 2-3 candidates.
  - Actionable **Compliance Warnings** highlight risks (such as unverified documents or long-distance travel).
- **Graceful Fallback**: If the `GEMINI_API_KEY` environment variable is not defined or the network request fails, a programmatic rule-based generator provides a basic markdown summary fallback.

---

## 6. Assumptions

- **Location Parsing**: Proximity calculations expect coordinates in `"latitude, longitude"` format (e.g. `12.971, 77.594`). Non-coordinate addresses (e.g. `"Berlin, Germany"`) fall back to a default distance penalty.
- **Document Expirations**: Documents lacking an `expiryDate` are assumed perpetually valid once verified.
- **Candidate Pool**: Only vendors with an active state (`status: "ACTIVE"`) are scored.

---

## 7. Trade-offs

- **Heuristic Coordinates Calculation**:
  - *Decision*: Rely on simple regex-based extraction and Haversine formula instead of calling external geocoding lookup APIs (e.g. Google Maps API).
  - *Trade-off*: Removes third-party API dependencies and geocoding latency, but does not support textual addresses without coordinates.
- **Pre-Filtering + LLM Hybrid matching**:
  - *Decision*: Rank candidates using standard database operations and programmatic heuristics first, then pass only the top 5 candidates to the LLM.
  - *Trade-off*: Drastically lowers input token volume and speeds up execution times. However, the LLM does not perform reasoning on the entire vendor pool directly.
- **Synchronous Execution**:
  - *Decision*: Perform math and AI calls inside a single synchronous HTTP request cycle.
  - *Trade-off*: Simpler architecture and guarantees real-time matching accuracy, but large databases might block event loops. This can be resolved by offloading calculations to an async job queue (e.g., BullMQ) if scaling demands it.

---

## 8. Getting Started

### Prerequisites
- Node.js (version 18+ recommended)
- PostgreSQL Database

### Installation

1. Clone the repository and install the dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the root directory:
   ```env
   PORT=5000
   DATABASE_URL="postgresql://user:password@localhost:5432/vendor_db"
   JWT_SECRET="your_jwt_secret"
   GEMINI_API_KEY="your_gemini_api_key_here"
   ```

3. Run migrations and generate the Prisma Client:
   ```bash
   npm run prisma:migrate
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```
