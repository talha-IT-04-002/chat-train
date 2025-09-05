# Team Management (Stable Core)

This document covers inviting team members, assigning/updating roles, and how organization-member relationships are stored.

## Overview
- Invite team members via email with a time-limited token.
- Accept invites to activate membership and (optionally) set name/password.
- Assign and update roles per organization.
- Store membership in `TeamMember` linking `User` to `Organization`.

## Data Model
- `TeamMember` fields: `organizationId`, `userId`, `role` (owner|admin|manager|trainer|viewer), `permissions[]`, `status` (active|invited|suspended|pending), `invitedBy`, `invitedAt`, `joinedAt`, `inviteToken`, `inviteExpires`.
- Role changes auto-set sensible `permissions` in a pre-save hook.

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
- Response: `[{ _id, organizationId, userId: { email, firstName, lastName, avatar, status }, role, permissions, status, ... }]`

2) Invite a member
- Method/Route: `POST /team/invite`
- Auth: owner|admin|manager
- Body:
```json
{ "email": "invitee@example.com", "role": "viewer" }
```
- Response: `{ success: true, message: "Invitation sent", data: { memberId } }`

Behavior:
- Creates a pending `User` if not found.
- Upserts `TeamMember` with status `invited`, role provided (default `viewer`).
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

4) Update member role
- Method/Route: `PATCH /team/:memberId/role`
- Auth: owner|admin|manager
- Body:
```json
{ "role": "manager" }
```
- Response: `{ success: true, message: "Role updated", data: <TeamMember> }`

## Authorization Notes
- Only members of the org can list the team.
- Only roles with `canManageMembers()` (owner, admin, manager) can invite or update roles.
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
  -d '{"email":"invitee@example.com","role":"viewer"}' \
  http://localhost:5000/api/organizations/<orgId>/team/invite
```
- Accept:
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"token":"<rawToken>","firstName":"John","lastName":"Doe","password":"secret123"}' \
  http://localhost:5000/api/organizations/<orgId>/team/accept
```
- Update role:
```bash
curl -X PATCH \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{"role":"manager"}' \
  http://localhost:5000/api/organizations/<orgId>/team/<memberId>/role
```
