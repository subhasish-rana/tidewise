# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| `main`  | ✅ Yes     |

## Reporting a Vulnerability

**Please do NOT open a public GitHub issue for security vulnerabilities.**

If you discover a security issue, send an email to **mirakumarirana@gmail.com** with:

1. A clear description of the vulnerability
2. Steps to reproduce it
3. The potential impact

You can expect an acknowledgement within **48 hours** and a resolution plan within **7 days**.

## Security Design Notes

- No API keys or secrets are stored in this repository. All sensitive values must be provided via a local `.env` file (see `.env.example`).
- The server applies HTTP security headers on every response (`X-Content-Type-Options`, `X-Frame-Options`, `Content-Security-Policy`, `Referrer-Policy`, `Cross-Origin-*` headers).
- API endpoints apply in-memory rate limiting per client IP.
- All user input is validated and sanitised server-side before it is stored or returned.
- The `.tidewise-data.json` runtime store is excluded from version control via `.gitignore`.
