# M2 — Call Pipeline CRM

A black-and-white, single-workspace CRM for working a phone pipeline.

- **5-stage pipeline board** with drag-and-drop (mouse and touch), renameable stages
- **Excel / CSV import** with automatic column matching; unmatched columns are kept on the lead
- **Lead detail drawer**: one-tap call button, call-outcome logging, notes, follow-up dates, full activity timeline
- **Disqualify** leads with a reason (drag onto the drop zone or use the button); restore any time
- **Dashboard**: pipeline by stage, calls per day, connect rate, call outcomes, new leads, follow-ups, DQ reasons
- Team logins, CSV export

## Run locally

```bash
npm install
DATABASE_URL=postgres://user:pass@localhost:5432/m2 npm start
```

Open http://localhost:3000 — the first visit asks you to create the owner account.

## Deploy (Railway)

1. Add a PostgreSQL database to the project.
2. Add a service from this repo and set `DATABASE_URL` to `${{Postgres.DATABASE_URL}}`.
3. Generate a domain. Tables are created automatically on boot.
