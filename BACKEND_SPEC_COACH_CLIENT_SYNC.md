# Backend Spec — Coach ↔ Client Sync

## Context

The frontend has implemented two flows for linking coaches to clients:

1. **Coach-initiated invite** — coach invites a specific client by email. The client follows the link, signs up, completes onboarding, and is auto-linked to that coach.
2. **Client marketplace + request flow** — clients browse available coaches and send a connection request. The coach accepts or declines from their dashboard.

This document describes the new endpoints required to support both flows.

---

## Existing endpoints (no changes needed)

- `POST /api/invites` — admin creates coach invites (unchanged)
- `GET /api/invites/validate/:token` — validates a coach invite token (unchanged)
- `POST /api/auth/coach/register` — registers a coach via invite (unchanged)
- `POST /api/auth/onboarding` — client completes fitness onboarding (unchanged)
- `POST /api/auth/coach/onboarding` — coach completes profile onboarding (unchanged)

---

## New endpoints

### 1. Coach creates a client invite

```
POST /api/invites/client
Authorization: Bearer <coach_access_token>   (requireRole('coach'))
Content-Type: application/json
```

**Request body:**
```json
{ "email": "client@example.com" }
```

**Success (201):**
```json
{
  "success": true,
  "message": "Client invite created",
  "token": "<invite_token_string>",
  "inviteUrl": "https://yourdomain.com/en/invite/client/<token>"
}
```

**Error (400/409):**
```json
{ "success": false, "message": "A pending invite already exists for this email" }
```

**Backend logic:**
- Create a new `Invite` record with `type: 'client'` and `coachId: <requesting coach's id>`.
- The token must be URL-safe (UUID or similar).
- No email delivery is required for MVP — the coach copies and shares the link manually.

---

### 2. Validate a client invite token

```
GET /api/invites/validate/client/:token
(public — no auth required)
```

**Success (200):**
```json
{
  "valid": true,
  "email": "client@example.com",
  "coachName": "Diego Reyes",
  "coachId": "<uuid>"
}
```

**Error (404):**
```json
{ "valid": false, "message": "Invite not found or expired" }
```

---

### 3. Client registers via invite token

```
POST /api/auth/client/register
(public — no auth required)
Content-Type: application/json
```

**Request body:**
```json
{
  "token": "<invite_token>",
  "firstName": "Jane",
  "lastName": "Smith",
  "password": "Secure1@pass"
}
```

**Success (201):**
```json
{
  "success": true,
  "message": "Account created",
  "accessToken": "<jwt>",
  "refreshToken": "<refresh_jwt>",
  "user": {
    "id": "<uuid>",
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "client@example.com",
    "role": "client",
    "hasCompletedOnboarding": false,
    "coachId": "<uuid>"
  }
}
```

**Backend logic:**
- Look up the invite by token, verify it is type `'client'` and not expired.
- Create a new `User` with `role: 'client'`, set `email` from the invite.
- Set `coachId` on the user (or create a `CoachClient` join record) to link the client to the inviting coach.
- Mark the invite as `accepted`.
- Issue `accessToken` + `refreshToken` (same JWT strategy as login).
- After this, the frontend redirects the client to `POST /api/auth/onboarding` to complete their fitness profile.

---

### 4. Get available coaches (marketplace)

```
GET /api/coaches
Authorization: Bearer <client_access_token>   (requireRole('client') or public)
```

**Query params (all optional):**
- `coachingType` — `online | in_person | hybrid`
- `trialOnly` — `true | false`
- `search` — free-text search against headline, specialties, name

**Success (200):**
```json
{
  "coaches": [
    {
      "id": "<uuid>",
      "firstName": "Diego",
      "lastName": "Reyes",
      "profile": {
        "profileHeadline": "Strength & fat loss specialist",
        "bio": "...",
        "specialties": ["Strength Training", "Fat Loss"],
        "trainingModalities": ["Online"],
        "targetClientTypes": ["Beginners", "Corporate"],
        "coachingType": "online",
        "languagesSpoken": ["Spanish", "English"],
        "yearsOfExperience": 8,
        "sessionRateUSD": 120,
        "trialSessionAvailable": true,
        "trialSessionRateUSD": 30,
        "sessionDurationMinutes": 60,
        "certifications": ["NSCA-CSCS"],
        "totalClientsTrained": 140
      }
    }
  ]
}
```

**Backend logic:**
- Only return coaches where `acceptingClients: true` on their `CoachProfile`.
- Join `users` + `coach_profiles` and map to the above shape.
- Apply optional filters from query params.

---

### 5. Client sends connection request

```
POST /api/coaches/connection-requests
Authorization: Bearer <client_access_token>   (requireRole('client'))
Content-Type: application/json
```

**Request body:**
```json
{ "coachId": "<uuid>" }
```

**Success (201):**
```json
{ "success": true, "message": "Connection request sent" }
```

**Error (409):**
```json
{ "success": false, "message": "A request already exists for this coach" }
```

**Backend logic:**
- Create a `ConnectionRequest` record: `{ clientId, coachId, status: 'pending', createdAt }`.
- Prevent duplicates (one pending request per client-coach pair).

---

### 6. Coach gets their pending connection requests

```
GET /api/coaches/me/connection-requests
Authorization: Bearer <coach_access_token>   (requireRole('coach'))
```

**Success (200):**
```json
{
  "requests": [
    {
      "id": "<uuid>",
      "clientId": "<uuid>",
      "clientName": "Ana Torres",
      "clientEmail": "ana@example.com",
      "requestedAt": "2025-03-29T10:00:00Z",
      "status": "pending",
      "clientProfile": {
        "fitnessGoal": "weight_loss",
        "weight": 70,
        "height": 162,
        "activityLevel": "lightly_active"
      }
    }
  ]
}
```

---

### 7. Coach accepts or declines a connection request

```
PATCH /api/coaches/me/connection-requests/:requestId
Authorization: Bearer <coach_access_token>   (requireRole('coach'))
Content-Type: application/json
```

**Request body:**
```json
{ "action": "accept" }   // or "decline"
```

**Success (200):**
```json
{ "success": true, "message": "Request accepted" }
```

**Backend logic (on accept):**
- Set `ConnectionRequest.status = 'accepted'`.
- Set `User.coachId = <coach's id>` on the client user (or insert into `coach_clients` join table).

**Backend logic (on decline):**
- Set `ConnectionRequest.status = 'declined'`.
- No coach-client link is created.

---

### 8. Coach gets their client list

```
GET /api/coaches/me/clients
Authorization: Bearer <coach_access_token>   (requireRole('coach'))
```

**Success (200):**
```json
{
  "clients": [
    {
      "id": "<uuid>",
      "firstName": "Maria",
      "lastName": "García",
      "email": "maria@example.com",
      "username": "mariagarcia",
      "status": "active",
      "joinedAt": "2024-11-01T00:00:00Z",
      "lastSessionAt": "2025-03-22T10:00:00Z",
      "nextSessionAt": "2025-03-29T10:00:00Z",
      "sessionsCompleted": 18,
      "profile": {
        "fitnessGoal": "weight_loss",
        "weight": 72,
        "targetWeight": 65,
        "height": 165,
        "activityLevel": "moderately_active",
        "medicalConditions": [],
        "injuries": ["Left knee strain (2022)"],
        "allergies": [],
        "dietaryRestrictions": ["Lactose intolerant"],
        "notes": null
      }
    }
  ]
}
```

**Backend logic:**
- Return all users where `coachId = <coach's id>`.
- Join with `onboarding_profiles` (or equivalent) to populate the `profile` object.
- `status` can be derived from: `trial` if linked via a trial invite, `active` if they have had at least one session, `inactive` if last session > 30 days ago (or a dedicated field).

---

### 9. Coach gets their stats

```
GET /api/coaches/me/stats
Authorization: Bearer <coach_access_token>   (requireRole('coach'))
```

**Success (200):**
```json
{
  "stats": {
    "activeClients": 4,
    "trialClients": 2,
    "sessionsThisMonth": 22,
    "revenueThisMonth": 2640,
    "upcomingSessions": [
      {
        "id": "<uuid>",
        "clientName": "Aisha Patel",
        "scheduledAt": "2025-03-30T14:00:00Z",
        "durationMinutes": 60,
        "type": "regular"
      }
    ]
  }
}
```

---

## Database changes needed

### New columns on `users` table
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS "coachId" uuid REFERENCES users(id);
```

### New table: `invites` — extend with type and coachId
```sql
ALTER TABLE invites ADD COLUMN IF NOT EXISTS "type" varchar NOT NULL DEFAULT 'coach';
ALTER TABLE invites ADD COLUMN IF NOT EXISTS "coachId" uuid REFERENCES users(id);
```

### New table: `connection_requests`
```sql
CREATE TABLE IF NOT EXISTS connection_requests (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "clientId"  uuid NOT NULL REFERENCES users(id),
  "coachId"   uuid NOT NULL REFERENCES users(id),
  status      varchar NOT NULL DEFAULT 'pending',  -- pending | accepted | declined
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  UNIQUE ("clientId", "coachId")
);
```

---

## Summary of frontend → backend calls

| Frontend action | Method | Endpoint | Auth |
|---|---|---|---|
| Coach invites client | POST | `/api/invites/client` | coach |
| Validate client invite | GET | `/api/invites/validate/client/:token` | none |
| Client registers via invite | POST | `/api/auth/client/register` | none |
| Browse coaches | GET | `/api/coaches` | client (or none) |
| Client requests coach | POST | `/api/coaches/connection-requests` | client |
| Coach gets pending requests | GET | `/api/coaches/me/connection-requests` | coach |
| Coach accepts/declines | PATCH | `/api/coaches/me/connection-requests/:id` | coach |
| Coach gets client list | GET | `/api/coaches/me/clients` | coach |
| Coach gets stats | GET | `/api/coaches/me/stats` | coach |
