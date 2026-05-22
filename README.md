# Notification API

REST API for notification management in a secondhand market management system.

## Features

- JWT authentication.
- User registration and login for API testing.
- Notification CRUD.
- In-app notifications.
- Email, SMS, and push provider abstraction.
- Notification templates.
- Template-based notification creation with variables.
- User notification preferences.
- Mark read, mark unread, mark all read.
- Bulk notification creation.
- Scheduled notification dispatch.
- Basic notification stats.
- Centralized validation, error handling, and response formatting.

## Folder Structure

```text
src/
  app.js
  config/
  controllers/
  middleware/
  models/
  routes/
  services/
  utils/
  validators/
tests/
```

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

The API will run on `http://localhost:5000` by default.

## Main Routes

- `GET /api/v1/health`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/notifications`
- `POST /api/v1/notifications`
- `POST /api/v1/notifications/bulk`
- `POST /api/v1/notifications/dispatch-due`
- `GET /api/v1/notifications/stats`
- `PATCH /api/v1/notifications/:id/read`
- `PATCH /api/v1/notifications/:id/unread`
- `PATCH /api/v1/notifications/read-all`
- `DELETE /api/v1/notifications/:id`
- `GET /api/v1/templates`
- `POST /api/v1/templates`
- `GET /api/v1/preferences/me`
- `PUT /api/v1/preferences/me`

## Example Notification Payload

```json
{
  "recipient": "USER_ID",
  "title": "New message about your listing",
  "message": "A buyer asked about your used laptop.",
  "type": "message",
  "channels": ["in_app", "email"],
  "priority": "normal",
  "metadata": {
    "listingId": "LISTING_ID"
  }
}
```

## Example Template Notification Payload

```json
{
  "recipient": "USER_ID",
  "templateKey": "listing_message",
  "variables": {
    "buyerName": "Asha",
    "listingTitle": "Used laptop"
  },
  "metadata": {
    "listingId": "LISTING_ID"
  }
}
```
