# Privacy operations

This file records the operational assumptions behind `/privatliv/`. The public privacy notice must match how Esbjerg Shine actually handles data.

## Contact enquiries

- Ordinary enquiries that do not need to be kept for a customer relationship, dispute or legal obligation must be deleted no later than 12 months after the enquiry is closed.
- The same rule applies to the corresponding sent/received copies in Microsoft 365 unless a longer period is justified for the specific case.
- Do not copy CPR numbers, health information or other special-category personal data into internal systems unless there is a clear lawful reason to do so.
- Access to the contact mailbox should be limited to people who need it for the business.

## Cloudflare

- Keep Cloudflare limited to hosting, delivery and security functions used by the site.
- Keep Turnstile enabled for the contact form and server-side verification enabled.
- Do not enable Turnstile pre-clearance or additional tracking/analytics features without reviewing `/privatliv/` and any cookie/consent requirements first.
- Maintain the relevant Cloudflare data-processing terms for the account.

## Microsoft 365

- Contact-form mail is delivered through Microsoft Graph to the company mailbox defined in `src/data/company.ts`.
- Keep Microsoft tenant/client credentials as Cloudflare secrets; never commit them.
- Restrict the Graph application to the intended mailbox and keep only the permissions required for sending mail.
- Maintain Microsoft's applicable data-protection terms for the tenant.

## Google Maps

- The embedded map must remain click-to-load. Do not load the Google Maps iframe automatically on first page render.
- If the map implementation changes, review the privacy notice and any cookie/consent requirements before release.

## Analytics and marketing

- The current public notice assumes there is no Google Analytics, marketing pixel or social-media embed tracking visitors.
- Before adding analytics, advertising, remarketing or session-replay software, document the purpose, legal basis, recipients, retention and transfer mechanism and update the public privacy information before deployment.

## Review triggers

Review `/privatliv/` whenever any of these change:

- hosting/CDN/security provider
- mail provider or mailbox workflow
- Turnstile configuration
- Google Maps loading behavior
- analytics/advertising tools
- contact-form fields
- retention policy
- business identity/contact details

The privacy notice was last substantively reviewed on 27 September 2026. This repository documentation supports operational consistency; it is not a substitute for case-specific legal advice where the business has unusual processing activities.
