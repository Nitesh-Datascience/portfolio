# Nitesh Kumar — Data Analyst Portfolio

<p align="center">
  <img src="profile.jpg" alt="Nitesh Kumar" width="132" />
</p>

<h3 align="center">DATA ANALYST · PYTHON · SQL · EXCEL · POWER BI · AI & ML</h3>

<p align="center">
  Turning raw data into clear insights, interactive dashboards, and practical machine-learning solutions.
</p>

<p align="center">
  <a href="https://nitesh-datascience.github.io/portfolio/"><strong>🌐 View Live Portfolio</strong></a>
  &nbsp;·&nbsp;
  <a href="https://www.linkedin.com/in/niteshkumar-codlytic/">LinkedIn</a>
  &nbsp;·&nbsp;
  <a href="https://github.com/Nitesh-Datascience">GitHub</a>
</p>

---

## 🚀 Overview

Welcome to my personal data analytics portfolio. I’m **Nitesh Kumar**, an aspiring Data Analyst interested in transforming complex datasets into meaningful business insights through data analysis, visualization, and predictive modelling.

This repository contains the source for my responsive, buildless portfolio website. It brings together **13 project case studies**, live application demos, an interactive featured-report preview, and a live view of public GitHub activity.

**Live website:** https://nitesh-datascience.github.io/portfolio/

## 🛠️ Tech Stack

| Area | Technologies |
| --- | --- |
| Structure | HTML5 |
| Styling & responsive UI | CSS3 |
| Interactivity | JavaScript (ES modules) |
| Data & analytics | Python, SQL, Excel |
| BI & visualization | Power BI, interactive charts and report visuals |
| Machine learning | Scikit-learn and predictive modelling |
| Deployment | GitHub Pages |
| Live app demos | Streamlit |

This portfolio is intentionally buildless for publishing: GitHub Pages serves the root website directly without requiring a Node build step or package installation.

## ✨ Key Features

- **Responsive portfolio:** Layout adapts to desktop, tablet, and mobile screens.
- **Project directory:** 13 curated project case studies with descriptions, tools, source links, and demo links.
- **Live demo discovery:** Filter projects by category and live-demo availability, search by keywords, and sort the collection.
- **Shareable project links:** Project selections can be opened directly through URL parameters and project anchors.
- **Interactive report preview:** Switch between the original featured FORESIGHT report figures.
- **Light and dark themes:** Choose a comfortable viewing theme.
- **Live GitHub activity:** View public profile totals and recent public repositories, with refresh and pause controls.
- **Contact actions:** Prepare an email draft or copy a message; the site does not collect messages on a backend.
- **Accessible progressive enhancement:** Core project and contact content remains available even when JavaScript is disabled.

## 📊 Featured Projects

Explore the complete collection and project case studies on the live website:

**[Open the Project Directory →](https://nitesh-datascience.github.io/portfolio/#projects)**

Selected deployed applications:

| Project | Live demo |
| --- | --- |
| Care Transition Efficiency Analytics | [Launch app](https://care-transition-efficiency-analytics-knfy8ljtaxyn8ti74zy5ng.streamlit.app/) |
| Customer Churn Prediction | [Launch app](https://customerchurnprediction-fkpbjib3muyvrhmgchkurb.streamlit.app/) |
| EduPro — Student Segmentation & Course Recommendation | [Launch app](https://eduproproject-jkoe6q6tctk5xafa6ggog.streamlit.app/) |
| Financial Fraud Detection | [Launch app](https://financialfrauddetection-6geni2xkrt3dc8ry2infsf.streamlit.app/) |

The portfolio links to additional projects and demos. External Streamlit applications may occasionally sleep or be unavailable independently of this website.

## 💻 Run Locally

You can preview the website with Python 3:

1. Clone this repository:

   ```bash
   git clone https://github.com/Nitesh-Datascience/portfolio.git
   cd portfolio
   ```

2. Start a local web server:

   ```bash
   python -m http.server 8000
   ```

3. Open **http://localhost:8000** in your browser.

Serve the folder over HTTP rather than opening `index.html` with a `file://` URL, because browser JavaScript modules may not load reliably from a local file.

## 🧰 Project Structure

| File / folder | Purpose |
| --- | --- |
| `index.html` | Generated root page published by GitHub Pages |
| `src/index.template.html` | Main page template, profile details, navigation, and metadata |
| `content/projects.mjs` | Project descriptions, case studies, source repositories, and demo URLs |
| `content/featured-study.mjs` | Featured report figure manifest and source attribution |
| `styles.css` | Responsive layout, themes, motion, and print styles |
| `presentation.css` | Portfolio presentation, typography, report preview, and workflow |
| `app.js` | Navigation, filtering, themes, GitHub refresh, and contact interactions |
| `portfolio-core.mjs` | Reusable filtering, draft encoding, API validation, and cache logic |
| `refresh-controller.mjs` | Rate-aware refresh scheduling and page-visibility handling |
| `scripts/build.mjs` | Generates the published root `index.html` |
| `tests/` | Automated tests |
| `assets/` | Featured report figures and source documentation |
| `profile.jpg`, `resume.pdf` | Profile photo and résumé |

## 🔧 Development & Validation

After changing project data or the HTML template, rebuild the published page and run the checks:

```bash
node scripts/build.mjs
node --test tests/*.test.mjs
python scripts/check-site.py
node --check app.js
```

Commit both the edited source files and the generated root `index.html`. GitHub Pages publishes the root file from the `main` branch; it does not run the build script itself.

## 📡 Public GitHub Activity

The activity section reads public GitHub profile and repository information in the visitor’s browser. It uses no personal access token and does not expose private repository data. Refreshing is rate-aware, pauses when the page is hidden or offline, and provides manual refresh and pause/resume controls.

This is a periodic public-activity refresh, not a continuous event stream or application-uptime monitor.

## 📬 Contact

- **LinkedIn:** [Nitesh Kumar](https://www.linkedin.com/in/niteshkumar-codlytic)
- **GitHub:** [@Nitesh-Datascience](https://github.com/Nitesh-Datascience)
- **Portfolio:** [nitesh-datascience.github.io/portfolio](https://nitesh-datascience.github.io/portfolio/)
- **Email:** [ns0762005@gmail.com](mailto:ns0762005@gmail.com)

---

<p align="center">
  Designed and developed with ❤️ by <strong>Nitesh Kumar</strong>
</p>
