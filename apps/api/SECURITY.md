# Security Considerations

## Authentication
- JWT access tokens expire in 1 hour (configurable via JWT_ACCESS_EXPIRES_IN)
- Refresh tokens expire in 7 days (rotation on refresh not yet implemented)
- Refresh tokens are stored hashed in the database
- Revoked JTIs are blacklisted in Redis for the token lifetime
- Passwords are hashed with bcrypt (cost factor 12)
- Password requirements: min 8 chars, 1 uppercase, 1 digit

## Rate Limiting
- Global: 200 req/min per IP (production)
- Login: 10 attempts per 15 min per IP
- Registration: 5 per hour per IP

## Input Validation
- All request bodies validated with Zod schemas
- Request body size limited to 64KB
- SQL injection prevented by Prisma parameterized queries
- WebSocket payloads validated before processing

## Transport Security
- HTTPS required in production (enforced at reverse proxy level)
- CORS restricted to known origins via CORS_ORIGIN env var
- Helmet.js sets security headers including CSP

## Data
- Redis keys for game state have TTLs to prevent unbounded growth
- No PII logged in production
- Passwords never returned in API responses

## Known Limitations / TODO
- [ ] Add brute-force protection with exponential backoff on login failures
- [ ] Implement CSRF tokens for cookie-based auth if migrating away from header tokens
- [ ] Add audit logging for sensitive operations (password change, logout-all)
- [ ] Consider adding Argon2id as an alternative to bcrypt for higher security
- [ ] Refresh token rotation is not yet implemented — `/refresh` issues a new access token but does not revoke/replace the refresh token (see `AuthService.refresh`)
