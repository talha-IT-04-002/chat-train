# Team Management

This document covers inviting team members and how organization-member relationships are stored.

## Overview
- Invite team members via email with a time-limited token.
- Accept invites to activate membership and (optionally) set name/password.
- Store membership in `TeamMember` linking `User` to `Organization`.

## Data Model
- `TeamMember` fields: `organizationId`, `userId`, `status` (active|invited|suspended|pending), `invitedBy`, `invitedAt`, `joinedAt`, `inviteToken`, `inviteExpires`.

## Email Invites
- Uses `emailService.sendTeamInviteEmail(...)`.
- Invite link format: `${FRONTEND_URL}/accept-invite?org=<orgId>&token=<rawToken>`.
- Token is stored hashed in DB and expires in 7 days.

Required env vars:
- `FRONTEND_URL` (e.g., http://localhost:3000)
- `EMAIL_USER`, `EMAIL_PASS` (and optionally `EMAIL_HOST`, `EMAIL_PORT`)

## Endpoints
Base path: `/api/organizations/:id`

1) List team members
- Method/Route: `GET /team`
- Auth: Any member of the organization
- Response: `[{ _id, organizationId, userId: { email, firstName, lastName, avatar, status }, status, ... }]`

2) Invite a member
- Method/Route: `POST /team/invite`
- Auth: Any organization member
- Body:
```json
{ "email": "invitee@example.com" }
```
- Response: `{ success: true, message: "Invitation sent", data: { memberId } }`

Behavior:
- Creates a pending `User` if not found.
- Upserts `TeamMember` with status `invited`.
- Sends invite email with accept URL.

3) Accept invitation
- Method/Route: `POST /team/accept`
- Auth: Public (via invite token)
- Body:
```json
{ "token": "<rawToken>", "firstName": "John", "lastName": "Doe", "password": "secret123" }
```
- Response: `{ success: true, message: "Invitation accepted" }`

Behavior:
- Matches hashed token and non-expired invite record.
- Activates the related `User` (`status=active`, `emailVerified=true`, updates optional fields, hashes password automatically via user pre-save hook).
- Activates `TeamMember` (`status=active`, clears `inviteToken`/`inviteExpires`, sets `joinedAt`).

## Authorization Notes
- Only members of the org can list the team.
- Any organization member can invite new members.
- Membership uniqueness is enforced by compound index `(userId, organizationId)`.

## Status Values
- `pending`: created but not yet onboarded
- `invited`: invite sent, awaiting acceptance
- `active`: active member
- `suspended`: temporarily disabled

## Error Cases (examples)
- 400: invalid input, invalid/expired token
- 401: missing/invalid auth (where required)
- 403: not a member or insufficient permissions
- 404: organization/member not found

## Quick Test (cURL)
- Invite:
```bash
curl -X POST \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{"email":"invitee@example.com"}' \
  http://localhost:5000/api/organizations/<orgId>/team/invite
```
- Accept:
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"token":"<rawToken>","firstName":"John","lastName":"Doe","password":"secret123"}' \
  http://localhost:5000/api/organizations/<orgId>/team/accept
```
