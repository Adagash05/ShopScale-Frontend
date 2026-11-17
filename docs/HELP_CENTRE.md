# Help Centre and How It Works

Public pages (no sign-in): `/how-it-works`, `/help`, `/help/search?q=`, `/help/<category>`, `/help/<category>/<article>`.

## Where things live
- `src/help/content/*.js`: the 134 articles in 13 categories (A to M). Plain data, written with helpers from `content/b.js`: `p`, `h` (feeds the table of contents), `steps`, `list`, `tip`, `warn`, `shot`, `illus`. Inline: `**bold**`, `` `code` ``, `[label](/path)`.
- `src/help/data.js`: categories, search (every word must match; title and keywords score highest), reading time (200 words/minute), previous/next, related.
- `src/help/HelpCentre.jsx`, `HowItWorks.jsx`, `blocks.jsx`, `Illustrations.jsx`, `help.css`.
- `src/help/support.js`: the only support channels: call and WhatsApp 09122609070. No email, hours or response time is stated anywhere.

## Rules for adding or changing an article
1. Document only what the app really does today. No Coming Soon features. Use the real button and status names.
2. Never imply an online order is paid because it exists. Pending payment is not paid.
3. Link only to articles that exist (`node scripts/help-harness/out.cjs` fails on broken links).
4. Screenshots: add `shot('id', 'caption')` and capture the file (see `HELP_SCREENSHOTS.md`). Never use mock or stock images.

## Tests
`NPM_TOOLS=/path/to/node_modules node scripts/help-harness/build.mjs && node scripts/help-harness/out.cjs` renders every category and article and the How It Works page, and checks titles, breadcrumbs, table-of-contents anchors, previous/next and related links, search (results and empty), the phone and WhatsApp links and that no placeholder text exists.

## Notes
- Helpful / not helpful feedback is stored in the visitor's browser only (`shopscale.help.feedback`); there is no backend endpoint, and the page says so.
- Sections and links were added to the header, footer, login, register, contact page and sitemap. `help` and `how-it-works` are public prefixes in `src/config/domains.js`.
