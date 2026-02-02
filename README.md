# Crypto Accept Backend

A robust and scalable NestJS-based backend application for handling cryptocurrency transactions, merchant management, and real-time status updates.

## 🚀 Key Features

- **Transaction Management**: Secure handling of crypto transactions with status tracking.
- **Merchant & Customer Modules**: Dedicated systems for managing merchants, customers, and their relationships.
- **Real-time Updates**: Integrated WebSockets (Socket.io) for live transaction status notifications.
- **IP-Based Security**: Advanced IP lookup and security checks using Ipregistry to detect VPNs, Proxies, and Tor.
- **Currency Intelligence**: Automated conversion rate updates via Cron jobs and external service integration.
- **Feature Flags**: Dynamic control over system features without redeployment.
- **Comprehensive Logging**: Detailed tracking of errors, requests, and third-party API interactions.
- **Caching & Idempotency**: Redis-backed caching for system settings and idempotency interceptors for reliable API calls.
- **API Documentation**: Interactive Swagger/OpenAPI documentation.

## 🛠 Tech Stack

- **Framework**: [NestJS](https://nestjs.com/) (v11+)
- **Language**: TypeScript
- **Database**: PostgreSQL with [TypeORM](https://typeorm.io/)
- **Caching**: [Redis](https://redis.io/) (ioredis)
- **Real-time**: [Socket.io](https://socket.io/)
- **API Documentation**: [Swagger](https://swagger.io/)
- **Testing**: Jest & Supertest
- **External Services**: Fixer (Rates), Ipregistry (IP Security)

## 📁 Project Structure

```text
src/
├── cron/               # Scheduled tasks (e.g., conversion rates)
├── database/           # Migrations and seeders
├── modules/            # Core business logic
│   ├── common/         # Filters, interceptors, and shared utilities
│   ├── crypto-transactions/
│   ├── customers/
│   ├── external-services/# Integration with 3rd party APIs
│   ├── merchants/
│   ├── transactions/   # Transaction processing and gateways
│   └── ...
└── main.ts             # Application entry point
```

## 🚥 Getting Started

### Prerequisites

- Node.js (v18+)
- npm / yarn
- PostgreSQL
- Redis

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd crypto-accept-backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env` from a template or use the provided values. Ensure the following are set:
   - `DATABASE_HOST`, `DATABASE_NAME`, etc.
   - `REDIS_URL`
   - `IPREGISTRY_API_KEY`
   - `FIXER_API_KEY`

### Database Setup

1. **Run Migrations**:
   ```bash
   npm run migration:run
   ```

2. **Run Seeders** (optional):
   ```bash
   npm run seed:run
   ```

## 🚀 Usage

### Development

```bash
# Watch mode
npm run start:dev
```

### Production

```bash
# Build the project
npm run build

# Start production server
npm run start:prod
```

### API Documentation

Once the server is running, you can access the interactive API docs at:
`http://localhost:3005/api` (or your configured `APP_PORT`)

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📜 License

This project is [UNLICENSED](LICENSE).
