# Nitesh Kumar — Data Analyst Portfolio

A responsive, buildless portfolio for GitHub Pages. Includes 13 project case studies, seven Streamlit demo links, category and keyword filters, sorting and shareable case studies, light and dark themes, résumé access, email-draft preparation, and public GitHub activity.

The presentation includes a personal introduction, an interactive FORESIGHT report preview, a concise analytics workflow, and a link to the deployed tree portfolio.

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
| `presentation.css` | Portrait composition, typography, featured report, workflow, and portfolio collection |
| `content/featured-study.mjs` | Report figure manifest, accessible descriptions, source paths, and original Git blob hashes |
| `assets/` | Three unchanged original FORESIGHT report figures and source attribution |
| `app.js` | Navigation, project filtering, theme, GitHub refresh, and contact interactions |
| `portfolio-core.mjs` | Testable filtering, draft encoding, public API validation, and cache logic |
| `refresh-controller.mjs` | One rate-aware schedule for manual/automatic refresh, pause, visibility, and connectivity |
| `profile.jpg`, `resume.pdf` | Existing profile photo and downloadable résumé |

After editing the project data or HTML template, regenerate the committed page:

```bash
node scripts/build.mjs
node --test tests/*.test.mjs
python scripts/check-site.py
node --check app.js
```

Commit both the edited source and generated `index.html`. The root file is the published page; GitHub Pages does not need to run the build script. Keep GitHub Pages configured to publish from `main` and the repository root. A push to `main` triggers the existing Pages build and deployment.

When changing browser modules, update the asset revision in the template and changed module imports together. This prevents a cached older dependency from breaking a newly deployed interface.

## Project discovery and sharing

Visitors can filter to live demos, search by project or tool, and sort by featured order, name, or demo availability. The selected category, query, and sorting are retained in URL parameters, so a filtered view can be bookmarked or shared.

Each project has a Copy link button. A direct link such as `#project-water` reveals the project, opens its case study, and moves keyboard focus to it even when it was outside the initial eight cards. Clipboard failures provide a selectable URL instead.

## Live GitHub data

When the activity section is first viewed, the browser requests the public profile and up to 100 public repositories, sorted by last push. It displays account totals and up to three recent original, unarchived repositories. No tokens or private repository data are used. New repositories appear in this activity feed; the selected case-study gallery remains curated in `content/projects.mjs`.

Data refreshes every five minutes while the document is visible, with Pause/Resume and Refresh now controls. The panel shows the data timestamp, connection state, and next scheduled update. Hidden pages, offline mode, and pause stop automatic requests; reconnecting or returning resumes due work. Manual requests are throttled to one per minute, and overlapping refreshes are prevented.

Browser storage caches public results for up to 24 hours; saved data keeps its original timestamp when GitHub is unavailable or rate-limited. Storage failures are handled. Retry timing respects GitHub’s `Retry-After` and exhausted-quota `X-RateLimit-Reset` headers, with increasing delays for repeated failures. The profile and repository reads run sequentially. See [GitHub API best practices](https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api). This is periodic public activity refresh, not a continuous event stream or app uptime monitoring.

## Contact and content

“Prepare email” opens a reviewed draft in the visitor’s email app. “Copy message” offers an alternative, including a selectable draft when clipboard access is unavailable. The page does not have a message-collection backend. Existing email, LinkedIn, GitHub, photo, and résumé are preserved.

Case-study results come from the linked repository documentation. FORESIGHT is a simulated engagement; evaluation results describe the supplied dataset. No client improvements or production integrations are implied. Demo URLs link to external Streamlit apps, which may be asleep or unavailable independently of this portfolio.

Projects, résumé links, case studies, and social/contact links remain available without JavaScript. Search, theme switching, the draft helper, and GitHub refresh are progressive enhancements.

## Featured report preview

The three figures show historical weekly demand, leading products, and the inventory planning snapshot. Native buttons switch between the original report figures; full-size links remain available. The default figure is visible without JavaScript. These are analytical report figures, not screenshots of the deployed application. Source paths and hashes are documented in `assets/SOURCES.md`, and an automated check verifies that each PNG matches its source blob and declared dimensions.

The model comparison remains explicitly labelled as a dataset holdout result from a simulated engagement. The planning grid depends on the source project's stated assumptions. The current portrait and résumé were preserved from the repository.

