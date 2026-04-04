# Lumio Schools — Bulk School Provisioning

## Quick Start

1. Fill in `scripts/schools-import.csv` with your schools
2. Test first: `npm run provision:dry`
3. Go live: `npm run provision:live`

## CSV Format

| Field | Description |
|---|---|
| `school_name` | Full school name (e.g. "Parkside Elementary") |
| `slug` | URL-safe identifier (e.g. "parkside-elementary") |
| `admin_email` | Principal/admin email — receives welcome email |
| `admin_name` | Principal/admin full name |
| `city` | City |
| `state` | State/County |
| `district` | District/MAT name |
| `portal_type` | `telted` (US) or `neli` (UK) |
| `plan` | `enterprise` \| `schools` \| `trial` |

## For 160 Schools

The script processes in batches of 10 by default.
160 schools = 16 batches = approximately 3-4 minutes total.
All welcome emails send automatically.
A report file is generated showing every success/failure.
A URLs CSV is generated for distribution to the client.

## Custom batch size

```bash
npm run provision:batch scripts/my-schools.csv --batch=20
```

## Re-running safely

Already-provisioned schools are automatically skipped.
Safe to run multiple times — no duplicates created.

## After provisioning

- Check the admin portal at `/admin` to see all 160 schools
- The URLs CSV can be sent to the client to distribute to schools
- Failed schools can be re-run by fixing the CSV and running again