import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { projects } from '../content/projects.mjs';

const root = new URL('../', import.meta.url);
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const icon = name => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"></use></svg>`;
const arrow = icon('arrow-up-right');
function visual(project) {
  if (project.visual === 'forecast') return `<div class="project-visual forecast-visual"><div class="visual-caption"><span>FORECAST EVALUATION</span><span>Holdout WAPE ↓</span></div><div class="comparison"><div><span>Seasonal baseline</span><div class="comparison-bar baseline" style="--bar:84%"><b>33.6%</b></div></div><div><span>FORESIGHT model</span><div class="comparison-bar" style="--bar:61%"><b>24.4%</b></div></div></div><span class="visual-footnote">Dataset evaluation · lower is better</span></div>`;
  if (project.visual === 'logistics') return `<div class="project-visual logistics-visual"><div class="visual-caption"><span>DELIVERY PERFORMANCE</span><span>Dataset result</span></div><div class="logistics-result"><div class="donut" role="img" aria-label="SLA compliance: 42.72 percent"><div><strong>42.72<span>%</span></strong><small>SLA compliant</small></div></div><div class="logistics-legend"><p><i></i>On time or early <strong>42.72%</strong></p><p><i></i>Delayed <strong>57.28%</strong></p><small>180,519 shipment records</small></div></div></div>`;
  return `<div class="project-visual compact-visual visual-${escape(project.category)}"><span class="project-symbol">${icon(project.icon)}</span><span>${escape(project.subtitle)}</span><span class="visual-grid" aria-hidden="true"></span></div>`;
}
const cards = projects.map((project, index) => `<article class="project-card${project.featured ? ' featured' : ''}" id="project-${escape(project.id)}" data-project="${escape(project.id)}" data-category="${escape(project.category)}"${project.demo ? ' data-demo="true"' : ''}>
  ${visual(project)}
  <div class="project-content">
    <div class="project-meta"><span>${String(index + 1).padStart(2, '0')} / ${escape(project.categoryLabel)}</span>${project.demo ? '<span class="demo-badge">Demo available</span>' : ''}</div>
    <h3>${escape(project.title)}</h3><p>${escape(project.description)}</p>
    <ul class="tags" aria-label="Technologies">${project.tags.map(tag => `<li>${escape(tag)}</li>`).join('')}</ul>
    <div class="project-actions">${project.demo ? `<a class="project-demo" href="${escape(project.demo)}" target="_blank" rel="noopener noreferrer">Open demo ${arrow}</a>` : ''}<a class="source-link" href="https://github.com/Nitesh-Datascience/${escape(project.repo)}" target="_blank" rel="noopener noreferrer">${icon('github')} Source ${arrow}</a><button type="button" class="project-share" data-share-project="${escape(project.id)}" aria-label="Copy link to ${escape(project.title)}" title="Copy project link" hidden>${icon('link')}</button></div>
    <details class="case-study"><summary>Read case study <span aria-hidden="true">+</span></summary><div class="case-body"><h4>The question</h4><p>${escape(project.question)}</p><h4>The approach</h4><p>${escape(project.approach)}</p><h4>The deliverable</h4><p>${escape(project.deliverable)}</p>${project.evidence ? `<h4>Evidence & context</h4><p>${escape(project.evidence)}</p>` : ''}<a href="https://github.com/Nitesh-Datascience/${escape(project.repo)}#readme" target="_blank" rel="noopener noreferrer">Read project documentation ${arrow}</a></div></details>
  </div>
</article>`).join('\n');
let html = await readFile(new URL('src/index.template.html', root), 'utf8');
html = html.replace('{{PROJECTS}}', cards).replaceAll('{{PROJECT_COUNT}}', String(projects.length)).replaceAll('{{DEMO_COUNT}}', String(projects.filter(project => project.demo).length));
await writeFile(new URL('index.html', root), html);
console.log(`Built ${fileURLToPath(new URL('index.html', root))}: ${projects.length} projects, ${projects.filter(project => project.demo).length} demo links.`);
