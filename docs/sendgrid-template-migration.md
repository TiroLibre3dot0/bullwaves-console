# SendGrid Template Migration

This project can export the local retention email catalog into Twilio SendGrid Dynamic Transactional Templates.

## Why the mapping is 1:1:1:1

A local journey step currently has:
- `localTemplateId`
- `locale` (`it`, `en`)
- `variant` (`a`, `b`)

SendGrid supports multiple versions per template, but only one version can be active at a time.
That means SendGrid versions are good for revision history, not for running A/B variants in parallel.

Because of that, this repo maps:
- one SendGrid dynamic template per `localTemplateId + locale + variant`

With the current catalog this means:
- 15 local email template ids
- 2 locales
- 2 variants
- total: 60 SendGrid templates

## Relevant SendGrid API endpoints

The migration script follows the SendGrid v3 API model:

- `POST /v3/templates`
  Creates a transactional template with `generation: dynamic`.
- `GET /v3/templates?generations=dynamic&page_size=200`
  Lists existing dynamic templates for lookup/upsert.
- `GET /v3/templates/{template_id}`
  Retrieves versions for a specific template.
- `POST /v3/templates/{template_id}/versions`
  Creates the first version for a template.
- `PATCH /v3/templates/{template_id}/versions/{version_id}`
  Updates the active version instead of creating version sprawl.
- `POST /v3/mail/send`
  Sends the email using `template_id`.

## Commands

Dry run only:

```bash
npm run sendgrid:templates:plan
```

Real sync to SendGrid:

```bash
npm run sendgrid:templates:sync
```

## Required environment variables

- `SENDGRID_API_KEY`
- `SENDGRID_ON_BEHALF_OF`
  Mandatory guard rail: sync and audit refuse to run without an explicit subuser target.

Optional:

- `SENDGRID_BASE_URL`
  Default: `https://api.sendgrid.com`
  Use `https://api.eu.sendgrid.com` for EU regional subusers.

## Output artifact

The script writes a manifest to:

- `artifacts/sendgrid/transactional-template-sync.json`
- `src/pages/Retention/sendgridTemplateRegistry.js`

That file contains:
- local template metadata
- timing/delay metadata from the journey layer
- SMS companion text for reference
- remote SendGrid `templateId` / `versionId` when sync runs with `--apply`

The runtime registry contains:
- local template id to SendGrid `templateId` mapping
- locale/variant lookup helpers
- default `dynamic_template_data` values for SendGrid sends

## Current dynamic fields

The sync now uploads true SendGrid-ready dynamic content.

The current templates support these Handlebars-backed fields:
- `{{first_name}}`
- `{{cta_url}}`
- `{{support_url}}`
- `{{account_manager_name}}`

These are applied in:
- subject line
- hero personalization label
- greeting block
- primary CTA URL
- support URL
- signature block

For delivery-safe links, the generator now uses:
- CTA principale: `{{insert cta_url "default=https://portal.bullwaves.com/login"}}`
- Group unsubscribe: `<%asm_group_unsubscribe_raw_url%>`
- Preferences: `<%asm_preferences_raw_url%>`

Important:
- the CTA now has a fallback URL even if `dynamic_template_data.cta_url` is omitted
- ASM links populate only when the send request includes `asm.group_id`
- local preview/send-test can inject ASM via `SENDGRID_UNSUBSCRIBE_GROUP_ID`

Then the send step can use `personalizations.dynamic_template_data` in `POST /v3/mail/send`.

## Remaining limitation

The text body copy is still mostly authored locally and then uploaded as dynamic HTML.
So the templates are now SendGrid-native for variable injection, but not yet fully modularized into smaller reusable SendGrid content components.
