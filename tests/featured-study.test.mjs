import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { featuredStudy } from '../content/featured-study.mjs';

test('featured figures match the original report blobs and declared image dimensions', async () => {
  const root = new URL('../', import.meta.url);
  assert.equal(new Set(featuredStudy.charts.map(chart => chart.id)).size, 3);
  for (const chart of featuredStudy.charts) {
    const bytes = await readFile(new URL(chart.src, root));
    assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    assert.equal(bytes.readUInt32BE(16), chart.width);
    assert.equal(bytes.readUInt32BE(20), chart.height);
    const hash = createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
    assert.equal(hash, chart.sourceSha, `${chart.id}: source figure was altered or replaced`);
    assert.ok(chart.alt.length > 30 && chart.caption.length > 30);
  }
});
