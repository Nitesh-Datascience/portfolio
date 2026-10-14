"""Check the generated static page without a browser or third-party dependencies."""
from collections import Counter
from html.parser import HTMLParser
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

class Page(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ids, self.anchors, self.uses, self.files, self.labels, self.fields = [], [], [], [], [], []
        self.projects, self.demos, self.h1, self.images = 0, 0, 0, []
        self.external = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if 'id' in a:
            self.ids.append(a['id'])
        if tag == 'a':
            self.anchors.append(a.get('href', ''))
            if a.get('target') == '_blank':
                self.external.append(a)
        if tag == 'use':
            self.uses.append(a.get('href', ''))
        if tag == 'h1':
            self.h1 += 1
        if tag == 'label':
            self.labels.append(a.get('for'))
        if tag in ('input', 'textarea', 'select'):
            self.fields.append(a.get('id'))
        if tag == 'img':
            self.images.append(a)
        if 'data-project' in a:
            self.projects += 1
            self.demos += 'data-demo' in a
            assert 'hidden' not in a, 'Projects must remain readable without JavaScript'
        if tag in ('link', 'script', 'img', 'a'):
            value = a.get('src') or a.get('href', '')
            if value and not value.startswith(('https:', 'http:', 'mailto:', '#')):
                self.files.append(value.split('?')[0])

html = (ROOT / 'index.html').read_text()
page = Page()
page.feed(html)
assert page.h1 == 1, 'Exactly one main heading is required'
assert not [key for key, value in Counter(page.ids).items() if value > 1], 'Duplicate IDs'
assert not [link for link in page.anchors + page.uses if link.startswith('#') and link[1:] not in page.ids], 'Broken local target'
assert not [filename for filename in page.files if not (ROOT / filename).is_file()], 'Missing local asset'
assert set(page.fields) <= set(page.labels), 'Unlabelled input'
assert all('noopener' in a.get('rel', '') for a in page.external), 'Unsafe external window'
assert all(a.get('alt') and a.get('width') and a.get('height') for a in page.images), 'Image metadata missing'
assert page.projects == 13 and page.demos == 7, 'Unexpected project counts'
assert '{{' not in html, 'Unresolved template token'
assert 'prefers-reduced-motion' in (ROOT / 'styles.css').read_text(), 'Motion preference missing'
assert 'aria-live="polite"' in html and 'Skip to content' in html
ld_json = html.split('<script type="application/ld+json">')[1].split('</script>')[0]
assert json.loads(ld_json)['name'] == 'Nitesh Kumar'
print('PASS: static content, anchors, assets, labels, metadata, and 13 projects / 7 demos.')
