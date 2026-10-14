# Nitesh Kumar — Data Analyst Portfolio

A responsive, buildless portfolio for GitHub Pages. Includes 13 project case studies, seven Streamlit demo links, category and keyword filters, light and dark themes, résumé access, email-draft preparation, and public GitHub activity.

**Live site:** https://nitesh-datascience.github.io/portfolio/

## Local preview

Use Python 3 and Node.js 18 or later for the optional content build and checks. The published website needs no Node server or installed packages.

```bash
python -m http.server 8000
```

Open `http://localhost:8000`. Serve the folder over HTTP; JavaScript modules do not reliably load from a `file://` URL.

## Update the portfolio

| File | Purpose |
| --- | --- |
| `content/projects.mjs` | Project descriptions, case studies, source repositories, and demo URLs |
| `src/index.template.html` | Profile, education, training, navigation, contact details, and SEO metadata |
| `scripts/build.mjs` | Generates the root `index.html` and derives project/demo counts |
| `styles.css` | Responsive layout, light/dark palettes, motion and print styles |
| `app.js` | Navigation, project filtering, theme, GitHub refresh, and contact interactions |
| `portfolio-core.mjs` | Testable filtering, draft encoding, public API validation, and cache logic |
| `profile.jpg`, `resume.pdf` | Existing profile photo and downloadable résumé |

After editing the project data or HTML template, regenerate the committed page:

```bash
node scripts/build.mjs
node --test tests/*.test.mjs
python scripts/check-site.py
node --check app.js
```

Commit both the edited source and generated `index.html`. The root file is the published page; GitHub Pages does not need to run the build script. Keep GitHub Pages configured to publish from `main` and the repository root. A push to `main` triggers the existing Pages build and deployment.

## Live GitHub data

When the activity section is first viewed, the browser requests the public profile and up to 100 public repositories, sorted by last push. It displays account totals and up to three recent original, unarchived repositories. No tokens or private repository data are used. New repositories appear in this activity feed; the selected case-study gallery remains curated in `content/projects.mjs`.

Data refreshes every five minutes while the document is visible. Manual requests are throttled to one per minute. Browser storage caches public results for up to 24 hours; saved data keeps its original timestamp when GitHub is unavailable or rate-limited. Storage failures are handled. This is periodic public activity refresh, not a continuous event stream or app uptime monitoring.

## Contact and content

“Prepare email” opens a reviewed draft in the visitor’s email app. “Copy message” offers an alternative, including a selectable draft when clipboard access is unavailable. The page does not have a message-collection backend. Existing email, LinkedIn, GitHub, photo, and résumé are preserved.

Case-study results come from the linked repository documentation. FORESIGHT is a simulated engagement; evaluation results describe the supplied dataset. No client improvements or production integrations are implied. Demo URLs link to external Streamlit apps, which may be asleep or unavailable independently of this portfolio.

Projects, résumé links, case studies, and social/contact links remain available without JavaScript. Search, theme switching, the draft helper, and GitHub refresh are progressive enhancements.
