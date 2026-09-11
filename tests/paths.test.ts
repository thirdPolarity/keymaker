import test from 'node:test';
import assert from 'node:assert/strict';
import { relativePath, pageUrl } from '../src/paths.ts';

test('nested deployments keep navigation inside the app', () => {
  assert.equal(pageUrl('/dream', '/keymaker/'), '/keymaker/dream');
  assert.equal(pageUrl('/', '/keymaker/'), '/keymaker/');
  assert.equal(pageUrl('/phosphor', '/'), '/phosphor');
  assert.equal(relativePath('/keymaker/dream/', '/keymaker/'), '/dream');
  assert.equal(relativePath('/keymaker', '/keymaker/'), '/');
  assert.equal(relativePath('/studio/', '/'), '/studio');
  assert.equal(relativePath('/keymaker-other/dream', '/keymaker/'), '/keymaker-other/dream');
});
