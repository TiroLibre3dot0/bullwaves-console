# Data workflow (Bullwaves Console)

The console UI reads its core datasets directly from `public/*.csv`.
If these CSVs are updated locally but not committed, the deployed app will show different values.

## Guardrails added

- `npm run check:data` fails if any `public/*.csv` files are modified/untracked versus `HEAD`.
- A Husky `pre-push` hook runs the same check to prevent pushing code without the matching CSV updates.

## Typical workflow

1. Update the CSVs in `public/`.
2. Run `npm run build` (this runs the data check first).
3. Commit CSVs:

   - `git add public/*.csv`
   - `git commit -m "Data: update public CSV reports"`

4. Push.

## Notes

- If hooks are not installed on a machine, run `npm install` once in this project so Husky can set them up.
- You *can* bypass hooks with `git push --no-verify`, but you should avoid it for data-driven releases.
