# Security API

Security endpoints for a secondhand market management system.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from `.env.example` and set `MONGO_URI` and `JWT_SECRET`.

3. Start the server:

```bash
npm run dev
```

## Endpoints

All security endpoints require:

```http
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

### POST `/api/security/pin-set`

Sets or updates the authenticated user's security PIN.

```json
{
  "pin": "1234",
  "confirmPin": "1234"
}
```

### POST `/api/security/pin-verify`

Verifies the authenticated user's security PIN.

```json
{
  "pin": "1234"
}
```

### POST `/api/security/change-password`

Changes the authenticated user's password.

```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword123",
  "confirmPassword": "newPassword123"
}
```

