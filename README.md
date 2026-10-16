# M2 — Call Pipeline CRM

A black-and-white, single-workspace CRM for working a phone pipeline.

- **A pipeline per teammate**, each with its own stages (add, rename, reorder, remove); drag-and-drop board (mouse and touch)
- **Excel / CSV import** with automatic column matching; unmatched columns are kept on the lead
- **Lead detail drawer**: one-tap call button, call-outcome logging, notes, follow-up dates, full activity timeline
- **Disqualify** leads with a reason (drag onto the drop zone or use the button); restore any time
- **Dashboard**: pipeline by stage, calls per day, connect rate, call outcomes, new leads, follow-ups, DQ reasons
- Team logins with an owner role; the owner's dashboard shows per-teammate call and outreach stats
- **Calendar** (month and week) for appointments, with Outlook integration: book appointments that land on your Outlook calendar and email the lead an invite, see your other Outlook events alongside, and send email from a lead (sent from your Outlook, logged on the lead)
- CSV export

## Outlook setup

1. In Microsoft Entra (entra.microsoft.com) → App registrations → New registration. Supported account types: *any organizational directory and personal Microsoft accounts*. Redirect URI (Web): `https://<your-crm-domain>/api/outlook/callback`.
2. Create a client secret under Certificates & secrets.
3. Set `MS_CLIENT_ID` and `MS_CLIENT_SECRET` on the CRM service. Each user then clicks **Connect Outlook** in Settings.

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
4. Pushes to the connected branch deploy automatically.
