# IT Asset Management — Admin Portal

Next.js 16 admin UI for the IT Hardware Asset Management system.

## Prerequisites

- Node.js 20+
- Running `itam-backend` on port 4001

## Setup

1. Create `.env.local` with:

- `NEXT_PUBLIC_BACKEND_URL=http://localhost:4001`
- `BACKEND_INTERNAL_URL=http://127.0.0.1:4001` (optional, dev rewrites)
- `BACKEND_API_KEY` — server-only; must match backend `FRONTEND_API_KEY` (never use `NEXT_PUBLIC_` prefix)

2. Install and run:

```bash
npm install
npm run dev
```

Open http://localhost:3000 and sign in with the seeded admin account (see backend README).

## Pages

| Route | Description |
|-------|-------------|
| `/dashboard` | KPIs and summary tables (Excel Dashboard parity) |
| `/audit-register` | IT Audit Register (37 fields, peripherals) |
| `/assets` | Asset inventory |
| `/device-history` | Monitor handovers (resign / user change) |
| `/maintenance` | Maintenance log |
| `/disposals` | Disposal log |
| `/reference-data` | Lookup values (IT only) |
| `/users` | User management (IT only) |

## Role-based UI

- Department heads see read-only views and cannot create/edit/delete.
- IT admins have full access including Users and Reference Data.

## Theme

Corporate blue palette (`#1E3A5F`, `#2E7D9A`) aligned with the Excel template.

## Related

- Backend: `../itam-backend`
- Excel template: `../../IT-Asset-Management-Template/IT_Asset_Management_Template.xlsx`
