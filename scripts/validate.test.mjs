import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, symlinkSync, truncateSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { buildCatalog } from './build.mjs';
import { fileURLToPath } from 'node:url';
import { checkProtectedPaths } from './protected-paths.mjs';
import { URL_SHORTENERS, checkCatalog, loadCatalog, validateTool, validateUrl } from './validate.mjs';

const base = {
  slug: 'sample',
  name: 'Sample Tool',
  vendor: 'Sample Maker',
  category: 'automation',
  platforms: ['Revit'],
  pricing: 'open-source',
  oneLiner: 'Automates project work in Revit.',
  website: 'https://github.com/sample/project',
  addedAt: '2024-02-29',
  source: 'editor',
  sourceUrl: 'https://github.com/sample/project',
};
const next = { slug: 'sample-plus', name: 'Sample Plus', website: 'https://github.com/sample/plus' };

function valid(change = {}) {
  return { ...base, ...change };
}

function invalid(field, values) {
  for (const value of values) {
    assert.throws(() => validateTool(valid({ [field]: value })), { message: new RegExp(`^${field}:`) }, JSON.stringify(value));
  }
}

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'awesome-bim-tools-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, 'tools'));
  writeFileSync(join(root, 'removed.json'), '[]\n');
  writeFileSync(join(root, 'README.md'), '# Example\n\n<!-- BEGIN TOOLS -->\n<!-- END TOOLS -->\n\nAfter the tables.\n');
  return root;
}

function put(root, entry, filename = `${entry.slug}.json`) {
  writeFileSync(join(root, 'tools', filename), JSON.stringify(entry));
}

test('accepts all optional fields, accredited hosts and common Latin text', () => {
  const entry = valid({
    oneLiner: 'Creates façades and exports Bézier curves.',
    license: 'MIT OR Apache-2.0',
    githubRepo: 'sample-org/Project.Name',
    appStoreUrl: 'https://marketplace.autodesk.com/apps/sample',
    logo: 'logos/sample.webp',
  });
  assert.equal(validateTool(entry, 'sample.json'), entry);
  assert.doesNotThrow(() => validateTool(valid({ appStoreUrl: 'https://apps.autodesk.com/RVT/' })));
});

test('requires an object with exactly the supported fields', () => {
  for (const value of [null, [], 'tool', 1]) assert.throws(() => validateTool(value), /expected an object/);
  for (const key of Object.keys(base)) {
    const entry = valid();
    delete entry[key];
    assert.throws(() => validateTool(entry), new RegExp(`${key}: required field is missing`));
  }
  assert.throws(() => validateTool(valid({ thumbnail: 'unknown' })), /unknown field "thumbnail"/);
  assert.throws(() => validateTool(JSON.parse('{"__proto__":{}}')), /unknown field "__proto__"/);
});

test('validates slug grammar and exact filename including case', () => {
  invalid('slug', ['../sample', '..', 'sample/tool', 'sample\\tool', 'SAMPLE', 'sample--tool', '-sample', 'sample-', 'a'.repeat(61)]);
  assert.throws(() => validateTool(valid(), 'Sample.json'), /filename exactly/);
  assert.throws(() => validateTool(valid(), 'sample.json.bak'), /filename exactly/);
  assert.doesNotThrow(() => validateTool(valid({ slug: 'a'.repeat(60) })));
});

test('rejects invalid types, oversized fields, line breaks and hidden characters', () => {
  invalid('name', ['', false, 'x'.repeat(61), ' Sample', 'Sample ', 'Sample\nTool', 'Sample\u2028Tool', 'Sample\u202eTool', 'Sample\u200bTool', 'Sample\ufe0fTool', 'Bad ](http://evil)', '<script>']);
  invalid('vendor', ['', null, 'x'.repeat(81), 'Maker\rName', 'Maker\u2066Name', 'Maker\u200dName']);
  invalid('oneLiner', ['A'.repeat(19), 'A'.repeat(141), 'Automates project work\t in Revit.']);
  assert.doesNotThrow(() => validateTool(valid({ name: 'a'.repeat(60), vendor: 'a'.repeat(80), oneLiner: 'A'.repeat(140) })));
});

test('validates categories, platforms, pricing and sources', () => {
  invalid('category', ['toString', ['automation'], 'unknown', 'Automation']);
  invalid('platforms', [null, 'Revit', [], ['Revit', 'IFC', 'Web', 'Dynamo', 'Tekla', 'Blender'], ['Revit', 'Revit'], ['revit'], ['Excel'], ['x'.repeat(31)], [' Revit'], [5]]);
  invalid('pricing', ['free trial', 'Free', ['free']]);
  invalid('source', ['github', 'Editor', ['editor']]);
  assert.doesNotThrow(() => validateTool(valid({ platforms: ['Revit', 'IFC', 'Web', 'Dynamo', 'Tekla'] })));
});

test('rejects HTML, markdown, links, mentions and non-Latin descriptions', () => {
  invalid('oneLiner', [
    'Edits BIM data and ](http://evil).', 'Edits BIM data with <script>.',
    'Edits BIM data | across models.', 'Edits BIM data with `formatting`.',
    'Edits BIM data in **linked** models.', 'Edits BIM data with $formula$.',
    'Edits BIM data with @someone.', '# Edits BIM data in linked models.',
    '1. Edits BIM data in linked models.', 'Edits BIM data. See HTTPS://evil.com.',
    'Edits BIM data. See evil.com for details.', 'Edits BIM data with javascript: code.',
    'Edits BIM data and \u202e reverses text.', 'Edits BIM data and \u200b hides text.',
    'Edits BIM data in модели.', 'Edits BIM data with 🙂.', 'Edits BIM data in Ｒｅｖｉｔ.',
  ]);
});

test('requires HTTPS URLs with public DNS names, no userinfo, no alternate port and no shorteners', () => {
  const bad = [
    'javascript:alert(1)', 'http://github.com/', 'https:///github.com/', '//github.com/',
    'https://127.0.0.1/', 'https://0x7f000001/', 'https://2130706433/', 'https://192.168.0.1/',
    'https://[::1]/', 'https://[2606:4700::1111]/', 'https://localhost/', 'https://host.localhost/',
    'https://host.local/', 'https://host.internal/', 'https://host.test/', 'https://test.example.com/',
    'https://192.168.0.1./', 'https://example..com/', 'https://-host.com/', 'https://x_y.com/',
    'https://host/', 'https://alice:secret@github.com/', 'https://@github.com/',
    'https://github.com:444/', 'https://github.com\\@elsewhere.com/', 'https://%67ithub.com/',
    'https://bit.ly/abc', 'https://www.tinyurl.com/abc', 'https://t.co./abc', 'https://lnkd.in/abc',
    'https://github.com/one two', 'https://github.com/a|b', 'https://github.com/<a>',
    'https://github.com/\na', `https://github.com/${'a'.repeat(282)}`,
  ];
  for (const field of ['website', 'sourceUrl', 'appStoreUrl']) invalid(field, bad);
  assert.equal(validateUrl('https://GITHUB.COM/').href, 'https://github.com/');
  assert.equal(validateUrl('https://github.com/a%7Cb').pathname, '/a%7Cb');
  assert.doesNotThrow(() => validateUrl(`https://github.com/${'a'.repeat(281)}`));
});

test('rejects ambiguous URL spellings before WHATWG normalization', () => {
  const cases = [
    ['https://github.com:443/', /explicit ports/],
    ['https://github.com:0443/', /explicit ports/],
    ['https://github.com:/', /explicit ports/],
    ['HTTPS://github.com/', /lower-case https/],
    ['Https://github.com/', /lower-case https/],
    ['https://github.com\\path', /unsafe delimiters/],
    ['https://github.com/a b', /whitespace/],
    ['https://github.com/a\tb', /control/],
    ['https://github.com/a\u0000b', /control/],
    ['https://github.com/a\u0085b', /control/],
    ['https://github.com./', /trailing dot/],
    ['https://gíthub.com/', /ASCII DNS host/],
    ['https://xn--bcher-kva.com/', /IDN label/],
    ['https://sub.XN--BCHER-KVA.com/', /IDN label/],
    ['https://github.com@evil.example/', /userinfo/],
    ['https://evil.example/#@github.com', /reserved name/],
  ];
  for (const field of ['website', 'sourceUrl', 'appStoreUrl']) {
    for (const [value, message] of cases) {
      assert.throws(() => validateTool(valid({ [field]: value })), { message }, value);
    }
  }
});

test('rejects all known shorteners and their subdomains on every URL field', () => {
  const required = [
    'bit.ly', 'bitly.com', 't.co', 'tinyurl.com', 'goo.gl', 'ow.ly', 'is.gd', 'buff.ly',
    'rebrand.ly', 'cutt.ly', 'shorturl.at', 'trib.al', 'bl.ink', 's7y.us', 'dub.sh',
    'kutt.it', 'lnkd.in', 't.ly', 'rb.gy', 'tiny.cc',
  ];
  assert.equal(new Set(URL_SHORTENERS).size, URL_SHORTENERS.length);
  for (const name of required) assert.ok(URL_SHORTENERS.includes(name), name);
  for (const field of ['website', 'sourceUrl', 'appStoreUrl']) {
    for (const host of URL_SHORTENERS) {
      for (const value of [`https://${host}/abc`, `https://www.${host}/abc`]) {
        assert.throws(() => validateTool(valid({ [field]: value })), { message: `${field}: URL shorteners are not allowed` });
      }
    }
  }
});

test('validates optional fields, host restrictions, logo paths and calendar dates', () => {
  invalid('license', [null, '', 'x'.repeat(41), 'MIT / Apache', 'MIT OR', ' MIT']);
  invalid('githubRepo', [null, 'github.com/team/tool', 'https://github.com/team/tool', 'team/tool/extra', 'team/..', 'team/.', 'team/tool?x=1', '-team/tool', 'a--b/tool', `${'a'.repeat(40)}/tool`, `team/${'a'.repeat(101)}`]);
  invalid('appStoreUrl', [null, 'https://autodesk.com/app', 'https://apps.autodesk.com.github.com/app']);
  invalid('logo', [null, 'https://github.com/logos/sample.webp', './logos/sample.webp', '/logos/sample.webp',
    'logos/other.webp', 'logos/Sample.webp', 'logos/sample.svg', 'logos/sample.webp?x=1',
    'logos/../logos/sample.webp', 'logos/%73ample.webp', 'logos/sample.webp\n']);
  invalid('addedAt', [null, '2025-02-29', '2024-02-30', '2024-00-01', '2024-13-01', '2024-1-01', '2024-02-29T00:00:00Z']);
});

test('rejects duplicate names, slugs, websites and repositories', (t) => {
  const root = fixture(t);
  put(root, valid({ githubRepo: 'sample/Project' }));
  const name = 'z-duplicate.json';
  const cases = [
    [valid({ ...next, name: 'SAMPLE TOOL' }), /name: duplicate/],
    [valid({ ...next, slug: 'sample' }), /slug: duplicate/],
    [valid({ ...next, slug: 'Sample' }), /slug: expected a lowercase slug/],
    [valid({ ...next, website: 'https://GITHUB.COM/sample/%70roject/#details' }), /website: duplicate/],
    [valid({ ...next, githubRepo: 'Sample/project' }), /githubRepo: duplicate/],
    [valid(next), /slug: must match the JSON filename/],
  ];
  for (const [entry, message] of cases) {
    put(root, entry, name);
    assert.throws(() => loadCatalog(root), message);
  }
});

test('validates removal records and unique identities without blocking by slug', (t) => {
  const root = fixture(t);
  put(root, valid());
  const removed = join(root, 'removed.json');
  const record = { slug: 'sample', identity: 'github:1234', removedAt: '2024-02-29' };
  for (const [raw, error] of [
    ['{', /removed\.json:/], ['{}', /array of removal records/],
    ['["sample"]', /expected an object with exactly/],
    [JSON.stringify([{ ...record, extra: true }]), /expected an object with exactly/],
    [JSON.stringify([{ slug: record.slug, identity: record.identity }]), /expected an object with exactly/],
    [JSON.stringify([{ ...record, slug: '../sample' }]), /\[0\]\.slug:/],
    [JSON.stringify([{ ...record, identity: 'github:not-numeric' }]), /\[0\]\.identity:/],
    [JSON.stringify([{ ...record, identity: 'web:https://host.org' }]), /\[0\]\.identity:/],
    [JSON.stringify([{ ...record, identity: 'appstore:abc' }]), /\[0\]\.identity:/],
    [JSON.stringify([{ ...record, removedAt: '2026-02-29' }]), /\[0\]\.removedAt:/],
    [JSON.stringify([record, { ...record, slug: 'other' }]), /duplicate removed identity/],
    [JSON.stringify([record]).replace('"slug":', '"slug":"one", "slug":'), /"slug": duplicate or misplaced JSON field/],
  ]) {
    writeFileSync(removed, raw);
    assert.throws(() => loadCatalog(root), error);
  }
  writeFileSync(removed, JSON.stringify([
    record,
    { ...record, identity: 'appstore:de5cc1d1-b924-4b98-9e5c-b9fea4e0c551' },
    { ...record, identity: 'web:host.org' },
  ]));
  assert.equal(loadCatalog(root)[0].slug, 'sample');
});

test('rejects malformed tool files', (t) => {
  const root = fixture(t);
  const file = join(root, 'tools', 'sample.json');
  writeFileSync(file, '{');
  assert.throws(() => loadCatalog(root), /tools\/"sample.json":/);
  writeFileSync(file, JSON.stringify(valid()).replace('"name":', '"na\\u006de":"First", "name":'));
  assert.throws(() => loadCatalog(root), /"name": duplicate or misplaced JSON field/);
  for (const key of ['__proto__', 'constructor']) {
    writeFileSync(file, JSON.stringify(valid()).replace('{', `{"${key}":{},`));
    assert.throws(() => loadCatalog(root), new RegExp(`"${key}": unsafe JSON key`));
  }
  const nested = `${'['.repeat(3000)}0${']'.repeat(3000)}`;
  writeFileSync(file, JSON.stringify(valid()).replace('"platforms":["Revit"]', `"platforms":${nested}`));
  assert.throws(() => loadCatalog(root), /JSON: nesting exceeds/);
  writeFileSync(file, Buffer.from([0xff]));
  assert.throws(() => loadCatalog(root), /UTF-8/);
  put(root, valid());
  put(root, valid(next), 'extra.txt');
  assert.throws(() => loadCatalog(root), /filename: expected a .json tool file/);
});

test('detects name duplicates after compatibility and homoglyph normalization', (t) => {
  const root = fixture(t);
  put(root, valid({ name: 'pyRevit' }));
  for (const name of ['руRevit', 'ｐｙRevit', 'ｐуRevit', 'PYREVIT']) {
    put(root, valid({ ...next, slug: 'z-sample', name }));
    assert.throws(() => loadCatalog(root), /name: duplicate of "sample.json"/, name);
  }
});

test('rejects mixed-case tool filenames on case-sensitive and insensitive filesystems', (t) => {
  const root = fixture(t);
  put(root, valid());
  put(root, valid(), 'Sample.json');
  if (readdirSync(join(root, 'tools')).length === 2) {
    assert.throws(() => loadCatalog(root), /duplicate filename ignoring case/);
  } else {
    const from = join(root, 'tools', 'sample.json');
    const interim = join(root, 'tools', 'interim.json');
    renameSync(from, interim);
    renameSync(interim, join(root, 'tools', 'Sample.json'));
    assert.throws(() => loadCatalog(root), /must match the JSON filename exactly/);
  }
});

test('rejects oversized tool, removal and distribution files before parsing', (t) => {
  const root = fixture(t);
  put(root, valid());
  buildCatalog(root);
  const limits = [
    ['tools/sample.json', 8 * 1024],
    ['removed.json', 1024 * 1024],
    ['dist/tools.json', 2 * 1024 * 1024],
  ];
  for (const [relative, limit] of limits) {
    const path = join(root, relative);
    const saved = readFileSync(path);
    writeFileSync(path, Buffer.from([0xff]));
    truncateSync(path, limit + 1);
    assert.throws(() => checkCatalog(root), new RegExp(`file exceeds ${limit} bytes`), relative);
    writeFileSync(path, saved);
  }
});

test('checks that each logo is a bounded WebP file and rejects orphan files', (t) => {
  const root = fixture(t);
  put(root, valid({ logo: 'logos/sample.webp' }));
  assert.throws(() => loadCatalog(root), /referenced file is missing/);
  const dir = join(root, 'logos');
  mkdirSync(dir);
  assert.throws(() => loadCatalog(root), /referenced file is missing/);
  const logo = join(dir, 'sample.webp');
  const webp = Buffer.from('UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=', 'base64');
  const vp8 = Buffer.from('UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAgA0JaQAA3AA/vuUAAA=', 'base64');
  const chunk = (type, data) => {
    const result = Buffer.alloc(8 + data.length + (data.length & 1));
    result.write(type, 0);
    result.writeUInt32LE(data.length, 4);
    data.copy(result, 8);
    return result;
  };
  const riff = (...chunks) => {
    const result = Buffer.concat([Buffer.from('RIFF0000WEBP'), ...chunks]);
    result.writeUInt32LE(result.length - 8, 4);
    return result;
  };
  const wideLossless = Buffer.from(webp);
  wideLossless.writeUInt32LE(511 | (511 << 14), 21);
  const wideLossy = Buffer.from(vp8);
  wideLossy.writeUInt16LE(512, 26);
  wideLossy.writeUInt16LE(512, 28);
  const extendedHeader = Buffer.alloc(10);
  const animatedHeader = Buffer.from(extendedHeader);
  animatedHeader[0] = 0x02;
  const largeCanvas = Buffer.from(extendedHeader);
  largeCanvas.writeUIntLE(511, 4, 3);
  largeCanvas.writeUIntLE(511, 7, 3);
  const badLength = Buffer.from(webp);
  badLength.writeUInt32LE(123, 4);
  const badChunk = Buffer.from(webp);
  badChunk.writeUInt32LE(1000, 16);
  for (const [bytes, error] of [
    [Buffer.from('not WebP'), /expected RIFF/],
    [Buffer.from('RIFF1234WEBPnot WebP'), /RIFF length/],
    [riff(chunk('TEXT', Buffer.from('not WebP'))), /first WebP chunk/],
    [riff(chunk('VP8L', Buffer.from('not WebP'))), /invalid VP8L image header/],
    [badLength, /RIFF length/], [badChunk, /chunk length/], [riff(), /missing WebP image/],
    [wideLossless, /dimensions must be 1-256/], [wideLossy, /dimensions must be 1-256/],
    [riff(chunk('VP8X', largeCanvas), webp.subarray(12)), /dimensions must be 1-256/],
    [riff(chunk('VP8X', animatedHeader)), /animated WebP/],
    [riff(chunk('VP8X', extendedHeader), chunk('ANIM', Buffer.alloc(6))), /animated WebP/],
    [riff(chunk('VP8X', extendedHeader), chunk('ANMF', Buffer.alloc(16))), /animated WebP/],
  ]) {
    writeFileSync(logo, bytes);
    assert.throws(() => loadCatalog(root), error);
  }
  const limit = 60 * 1024;
  const max = riff(webp.subarray(12), chunk('JUNK', Buffer.alloc(limit - webp.length - 8)));
  assert.equal(max.length, limit);
  writeFileSync(logo, Buffer.concat([max, Buffer.alloc(1)]));
  assert.throws(() => loadCatalog(root), /exceeds 60 KiB/);
  rmSync(logo);
  const unrelated = join(root, 'unrelated.webp');
  writeFileSync(unrelated, webp);
  symlinkSync(unrelated, logo);
  assert.throws(() => loadCatalog(root), /expected a regular file/);
  rmSync(logo);
  mkdirSync(logo);
  assert.throws(() => loadCatalog(root), /expected a regular file/);
  rmSync(logo, { recursive: true });
  for (const bytes of [vp8, webp, riff(chunk('VP8X', extendedHeader), webp.subarray(12))]) {
    writeFileSync(logo, bytes);
    assert.equal(loadCatalog(root).length, 1);
  }
  writeFileSync(logo, max);
  assert.equal(buildCatalog(root), 1);
  const dist = JSON.parse(readFileSync(join(root, 'dist', 'tools.json')));
  assert.equal(dist.tools[0].logo, 'logos/sample.webp');
  writeFileSync(join(dir, 'orphan.webp'), webp);
  assert.throws(() => checkCatalog(root), /"orphan.webp": file has no matching tool logo/);
  const realDir = join(root, 'actual-logos');
  renameSync(dir, realDir);
  symlinkSync(realDir, dir);
  assert.throws(() => loadCatalog(root), /expected a regular directory/);
});

test('external changes may only modify existing canonical tool paths', () => {
  const external = 'contributor';
  assert.doesNotThrow(() => checkProtectedPaths(external, 'tools/sample.json\0tools/sample-plus.json\0'));
  assert.doesNotThrow(() => checkProtectedPaths(external, '', true));
  for (const path of [
    'scripts/validate.mjs', '.github/workflows/validate.yml', 'logos/sample.webp', 'dist/tools.json',
    'README.md', 'removed.json', '.gitattributes', 'package.json', 'CODEOWNERS', 'LICENSE',
    'schema/tool.schema.json', 'schema/catalog.schema.json', 'schema/nested/other.json',
    'tools/nested/sample.json', 'tools/sub/x.json', 'tools/Sample.json', 'Tools/x.json', 'tools/x.JSON',
    'tools/../sample.json', 'tools/../scripts/x', 'tools/sample.json\n', 'tools/sample.json\nREADME.md',
    'tools/.gitattributes', 'tools/sub/.gitattributes', 'a/b/c/.gitattributes', '.github/workflows/y.yml',
    `tools/${'a'.repeat(61)}.json`,
  ]) assert.throws(() => checkProtectedPaths(external, `${path}\0`), /only modify existing/, path);
  for (const path of ['tools/e\u0301.json', 'tools/ｘ.json', 'ｔools/x.json']) {
    assert.throws(() => checkProtectedPaths(external, `tools/x.json\0${path}\0`), /NFC and NFKC/, path);
  }
  assert.throws(() => checkProtectedPaths(external, 'tools/sample.json'), /NUL-terminated/);
  assert.throws(() => checkProtectedPaths(external, 'tools/sample.json\0', true), /may not add, remove or change the type/);
  assert.doesNotThrow(() => checkProtectedPaths('sharafutdinovdi', 'README.md\0', true));
  assert.throws(() => checkProtectedPaths(undefined, ''), /author login/);
});

test('command line decodes Git paths and rejects invalid paths', () => {
  const script = fileURLToPath(new URL('./protected-paths.mjs', import.meta.url));
  const cli = (input, ...args) => spawnSync(process.execPath, [script, 'contributor', ...args], { input, encoding: 'utf8' });
  assert.equal(cli('tools/sample.json\0').status, 0);
  assert.equal(cli('tools/sample.json\0', '--reject-non-modifications').status, 1);
  assert.equal(cli('README.md\0').status, 1);
  assert.equal(cli(Buffer.from([0xff, 0])).status, 1);
});

test('Git diff NUL lists reject added, removed, renamed and type-changed tool files', (t) => {
  const root = fixture(t);
  const git = (...args) => {
    const result = spawnSync('git', ['-C', root, ...args], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    return result.stdout;
  };
  git('init', '--quiet');
  for (const slug of ['existing', 'removed', 'renamed', 'type']) put(root, valid({ slug }));
  git('add', '--', 'tools');
  put(root, valid({ slug: 'existing', name: 'Edited' }));
  put(root, valid({ slug: 'added' }));
  git('add', '-N', '--', 'tools/added.json');
  rmSync(join(root, 'tools', 'removed.json'));
  renameSync(join(root, 'tools', 'renamed.json'), join(root, 'tools', 'renamed-to.json'));
  git('add', '-N', '--', 'tools/renamed-to.json');
  rmSync(join(root, 'tools', 'type.json'));
  symlinkSync('existing.json', join(root, 'tools', 'type.json'));
  const paths = ['tools/added.json', 'tools/removed.json', 'tools/renamed.json', 'tools/renamed-to.json', 'tools/type.json'];
  const diff = ['diff', '--no-ext-diff', '--no-renames', '--name-only', '-z'];
  const changes = git(...diff, '--diff-filter=m', '--');
  assert.deepEqual(changes.slice(0, -1).split('\0').sort(), paths.sort());
  for (const path of paths) {
    const input = git(...diff, '--diff-filter=m', '--', path);
    assert.equal(input, `${path}\0`);
    assert.throws(() => checkProtectedPaths('contributor', input, true), /may not add, remove or change the type/, path);
  }
  assert.doesNotThrow(() => checkProtectedPaths('contributor', git(...diff, '--')));
  assert.equal(git(...diff, '--diff-filter=M', '--'), 'tools/existing.json\0');
});

test('CLI uses explicit catalog root and separates stale artifacts from invalid data', (t) => {
  const root = fixture(t);
  put(root, valid());
  const cli = (script, ...args) => spawnSync(process.execPath, [
    fileURLToPath(new URL(`./${script}.mjs`, import.meta.url)), ...args, root,
  ], { encoding: 'utf8' });
  assert.equal(cli('validate', '--data-only').status, 0);
  assert.equal(cli('build', '--check').status, 1);
  assert.equal(cli('build').status, 0);
  assert.equal(cli('build', '--check').status, 0);
  assert.equal(cli('validate').status, 0);
  put(root, valid({ ...next, oneLiner: 'Invalid.' }));
  assert.equal(cli('validate', '--data-only').status, 1);
});

test('generation is deterministic, sorted by slug and safe for markdown tables', (t) => {
  const root = fixture(t);
  const fragment = 'https://evil-example.org/#@github.com';
  put(root, valid({ ...next, website: fragment, addedAt: '2026-11-20' }));
  put(root, valid({
    name: 'Sample | Tool',
    vendor: '<script> | [click](https://bad.com/) & #1 @owner $math$',
    website: 'https://github.com/sample/(project)?a=1&b=2',
  }));
  assert.equal(buildCatalog(root), 2);
  const distFile = join(root, 'dist', 'tools.json');
  const readmeFile = join(root, 'README.md');
  const dist = readFileSync(distFile, 'utf8');
  const readme = readFileSync(readmeFile, 'utf8');
  const data = JSON.parse(dist);
  assert.equal(data.generatedAt, '2026-11-20T00:00:00.000Z');
  assert.equal(data.count, 2);
  assert.deepEqual(data.tools.map(({ slug }) => slug), ['sample', 'sample-plus']);
  assert.equal(data.tools[1].website, fragment);
  assert.equal(validateUrl(fragment).hostname, 'evil-example.org');
  assert.match(readme, /\[Sample Plus\]\(<https:\/\/evil-example\.org\/#@github\.com>\)/);
  assert.doesNotMatch(dist, /<script>|\[click\]|Sample \| Tool/);
  assert.equal(data.tools[0].vendor, '<script> | [click](https://bad.com/) & #1 @owner $math$');
  assert.equal(data.tools[0].name, 'Sample | Tool');
  assert.match(readme, /After the tables\.\n$/);
  const row = readme.split('\n').find((line) => line.includes('Sample &#124; Tool'));
  assert.equal(row.split('|').length, 7);
  assert.match(row, /\]\(<https:\/\/github\.com\/sample\/\(project\)\?a=1&amp;b=2>\)/);
  assert.match(row, /&#60;script&#62; &#124; &#91;click&#93;/);
  assert.match(row, /&#35;1 &#64;owner &#36;math&#36;/);
  assert.doesNotMatch(row, /<script>|\[click\]|https:\/\/bad\.com/);
  assert.equal(buildCatalog(root), 2);
  assert.equal(readFileSync(distFile, 'utf8'), dist);
  assert.equal(readFileSync(readmeFile, 'utf8'), readme);
  assert.equal(checkCatalog(root), 2);
});

test('validation detects stale files and enforces unique README markers', (t) => {
  const root = fixture(t);
  put(root, valid());
  buildCatalog(root);
  const dist = join(root, 'dist', 'tools.json');
  const readme = join(root, 'README.md');
  writeFileSync(dist, '{}\n');
  assert.throws(() => checkCatalog(root), /dist\/tools.json: out of date/);
  buildCatalog(root);
  const current = readFileSync(readme, 'utf8');
  writeFileSync(readme, current.replace('| [Sample Tool]', '| [Stale Tool]'));
  assert.throws(() => checkCatalog(root), /README.md: out of date/);
  writeFileSync(readme, current.replace('<!-- END TOOLS -->', ''));
  assert.throws(() => buildCatalog(root), /ordered pair of tool table markers/);
  writeFileSync(readme, `${current}\n<!-- BEGIN TOOLS -->\n`);
  assert.throws(() => buildCatalog(root), /ordered pair of tool table markers/);
});

test('build and validation reject symlink tool inputs and output targets', (t) => {
  const root = fixture(t);
  const path = join(root, 'tools', 'sample.json');
  const target = join(root, 'external.json');
  writeFileSync(target, JSON.stringify(valid()));
  symlinkSync(target, path);
  assert.throws(() => loadCatalog(root), /expected a regular file/);
  rmSync(path);
  mkdirSync(path);
  assert.throws(() => loadCatalog(root), /expected a regular file/);
  rmSync(path, { recursive: true });
  put(root, valid());
  mkdirSync(join(root, 'dist'));
  symlinkSync(target, join(root, 'dist', 'tools.json'));
  assert.throws(() => buildCatalog(root), /expected a regular file/);
  assert.throws(() => checkCatalog(root), /expected a regular file/);
  assert.equal(readFileSync(target, 'utf8'), JSON.stringify(valid()));
});
