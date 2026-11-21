import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { test } from 'node:test';
import {
  catalogToolLimit, categories, fieldOrder, required, toolLimits, toolPatterns,
  toolPlatforms, toolPricing, toolSources,
} from './validate.mjs';

const schemaDraft = 'https://json-schema.org/draft/2020-12/schema';
const raw = 'https://raw.githubusercontent.com/sharafutdinovdi/awesome-bim-tools/main/';
const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');
const json = (path) => JSON.parse(read(path));
const toolSchema = json('schema/tool.schema.json');
const catalogSchema = json('schema/catalog.schema.json');

function schemaError(value, schema, document = schema, path = '$') {
  if (schema.$ref) {
    const local = schema.$ref.startsWith('#/$defs/');
    const ref = local ? document.$defs[schema.$ref.slice('#/$defs/'.length)] : toolSchema;
    assert.ok(local ? ref : schema.$ref === toolSchema.$id, `Unknown schema reference: ${schema.$ref}`);
    const error = schemaError(value, ref, local ? document : ref, path);
    if (error) return error;
  }
  if (schema.type === 'object' && (value === null || typeof value !== 'object' || Array.isArray(value))) return `${path}: expected object`;
  if (schema.type === 'array' && !Array.isArray(value)) return `${path}: expected array`;
  if (schema.type === 'string' && typeof value !== 'string') return `${path}: expected string`;
  if (schema.type === 'integer' && !Number.isInteger(value)) return `${path}: expected integer`;
  if (schema.enum && !schema.enum.includes(value)) return `${path}: unknown enum value`;
  if (schema.pattern && !new RegExp(schema.pattern, 'u').test(value)) return `${path}: pattern mismatch`;
  if (typeof value === 'string') {
    const length = Array.from(value).length;
    if (length < schema.minLength || length > schema.maxLength) return `${path}: length outside bounds`;
  }
  if (value < schema.minimum || value > schema.maximum) return `${path}: number outside bounds`;
  if (schema.required) {
    for (const field of schema.required) if (!Object.hasOwn(value, field)) return `${path}.${field}: required field missing`;
  }
  if (schema.properties) {
    for (const [field, entry] of Object.entries(value)) {
      if (!Object.hasOwn(schema.properties, field)) {
        if (schema.additionalProperties === false) return `${path}.${field}: additional property`;
        continue;
      }
      const error = schemaError(entry, schema.properties[field], document, `${path}.${field}`);
      if (error) return error;
    }
  }
  if (schema.items) {
    if (value.length < schema.minItems || value.length > schema.maxItems) return `${path}: item count outside bounds`;
    if (schema.uniqueItems && new Set(value).size !== value.length) return `${path}: duplicate items`;
    for (let i = 0; i < value.length; i++) {
      const error = schemaError(value[i], schema.items, document, `${path}[${i}]`);
      if (error) return error;
    }
  }
  for (const subschema of schema.allOf ?? []) {
    const error = schemaError(value, subschema, document, path);
    if (error) return error;
  }
  if (schema.not && !schemaError(value, schema.not, document, path)) return `${path}: matches a forbidden pattern`;
  return null;
}

test('published schemas agree with the validator fields, enums, limits and patterns', () => {
  const entries = [[toolSchema, 'tool.schema.json'], [catalogSchema, 'catalog.schema.json']];
  for (const [schema, filename] of entries) {
    assert.equal(schema.$schema, schemaDraft);
    assert.equal(schema.$id, `${raw}schema/${filename}`);
    assert.equal(schema.additionalProperties, false);
  }
  const fields = toolSchema.properties;
  const catalog = catalogSchema.properties;
  assert.deepEqual(toolSchema.required, required);
  assert.deepEqual(Object.keys(fields), fieldOrder);
  assert.deepEqual(fields.category.enum, Object.keys(categories));
  assert.deepEqual(fields.platforms.items.enum, toolPlatforms);
  assert.deepEqual(fields.pricing.enum, toolPricing);
  assert.deepEqual(fields.source.enum, toolSources);
  assert.equal(fields.platforms.minItems, toolLimits.platformsMin);
  assert.equal(fields.platforms.maxItems, toolLimits.platformsMax);
  assert.equal(fields.platforms.items.maxLength, toolLimits.platform);
  assert.equal(fields.platforms.uniqueItems, true);
  for (const field of ['slug', 'name', 'vendor', 'license', 'githubRepo', 'logo']) {
    assert.equal(fields[field].maxLength, toolLimits[field], field);
  }
  assert.equal(fields.oneLiner.minLength, toolLimits.oneLinerMin);
  assert.equal(fields.oneLiner.maxLength, toolLimits.oneLinerMax);
  assert.equal(fields.addedAt.minLength, toolLimits.date);
  assert.equal(fields.addedAt.maxLength, toolLimits.date);
  assert.equal(toolSchema.$defs.publicHttps.maxLength, toolLimits.url);
  for (const field of ['website', 'sourceUrl', 'appStoreUrl']) assert.equal(fields[field].$ref, '#/$defs/publicHttps');
  for (const field of ['slug', 'name', 'license', 'githubRepo', 'logo']) assert.equal(fields[field].pattern, toolPatterns[field].source, field);
  assert.equal(fields.addedAt.pattern, toolPatterns.date.source);
  assert.equal(fields.oneLiner.pattern, toolPatterns.oneLinerCharacters.source);
  assert.deepEqual(catalogSchema.required, ['generatedAt', 'count', 'tools']);
  assert.equal(catalog.generatedAt.pattern, toolPatterns.generatedAt.source);
  assert.equal(catalog.count.maximum, catalogToolLimit);
  assert.equal(catalog.tools.maxItems, catalogToolLimit);
  assert.equal(catalog.tools.items.$ref, toolSchema.$id);
});

test('every tool file and the complete generated feed satisfy their published schemas', () => {
  const files = readdirSync(new URL('tools/', root)).filter((name) => name.endsWith('.json'));
  const feed = json('dist/tools.json');
  for (const name of files) assert.equal(schemaError(json(`tools/${name}`), toolSchema), null, name);
  const error = schemaError(feed, catalogSchema);
  assert.equal(error, null, error);
  assert.equal(feed.count, files.length);
  assert.equal(feed.count, feed.tools.length);
});

test('published schemas reject invalid records and unknown feed fields', () => {
  const feed = json('dist/tools.json');
  const first = feed.tools[0];
  const { slug: _, ...withoutSlug } = first;
  assert.match(schemaError(withoutSlug, toolSchema), /required field missing/);
  for (const [change, expected] of [
    [{ name: 'x'.repeat(toolLimits.name + 1) }, /length outside bounds/],
    [{ category: 'Other' }, /unknown enum/],
    [{ logo: 'https://github.com/logo.webp' }, /pattern mismatch/],
    [{ website: 'https://github.com:443/' }, /pattern mismatch/],
    [{ appStoreUrl: 'https://github.com/app' }, /pattern mismatch/],
    [{ oneLiner: 'Edits BIM models and works with <markup>.' }, /forbidden pattern/],
    [{ $schema: toolSchema.$id }, /additional property/],
  ]) assert.match(schemaError({ ...first, ...change }, toolSchema), expected);
  for (const field of ['schema', 'source']) assert.match(schemaError({ ...feed, [field]: raw }, catalogSchema), /additional property/);
});

test('agent submission examples use stable form IDs, headings and platform choices', () => {
  const instructions = read('AGENTS.md');
  const form = read('.github/ISSUE_TEMPLATE/suggest-tool.yml');
  const labels = Array.from(form.matchAll(/^      label: (.+)$/gm), ([, label]) => label);
  const ids = Array.from(form.matchAll(/^    id: ([a-z]+(?:-[a-z]+)*)$/gm), ([, id]) => id);
  const [, example] = instructions.match(/```markdown\n([\s\S]+?)\n```/);
  const headings = Array.from(example.matchAll(/^### (.+)$/gm), ([, label]) => label);
  assert.deepEqual(headings, labels);
  assert.equal(ids.length, headings.length);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) assert.ok(instructions.includes(`\`${id}\``), id);
  const platformBody = example.split('### Platforms\n\n')[1].split('\n\n')[0];
  const platforms = Array.from(platformBody.matchAll(/^- \[[ x]\] (.+)$/gm), ([, label]) => label);
  assert.deepEqual(platforms, toolPlatforms);
  const [, consent] = form.match(/label: Confirmation\n      options:\n        - label: (.+)\n          required: true/);
  assert.equal(example.split('### Confirmation\n\n')[1].split('\n\n')[0], `- [x] ${consent}`);
  assert.match(example, /^### Submitted with\n\nWith an AI assistant$/m);
  assert.match(form, /^title: 'Suggest: '$/m);
  const [, url] = instructions.match(/\[Example prefilled form for pyRevit\]\(([^)]+)\)/);
  const params = new URL(url).searchParams;
  assert.equal(params.get('template'), 'suggest-tool.yml');
  assert.equal(params.get('title'), 'Suggest: pyRevit');
  const prefilled = ids.filter((id) => params.has(id));
  assert.deepEqual(prefilled, ['name', 'website', 'github-repo', 'maker', 'one-liner']);
  assert.equal(params.get('github-repo'), 'pyrevitlabs/pyRevit');
  for (const id of params.keys()) assert.ok(id === 'template' || id === 'title' || prefilled.includes(id), id);
});

test('listing change requests use a separate form and label', () => {
  const name = 'change-or-remove.yml';
  const form = read(`.github/ISSUE_TEMPLATE/${name}`);
  assert.match(form, /^title: 'Change: '$/m);
  assert.match(form, /^labels: \[change-request\]$/m);
  assert.match(form, /options:\n        - Correct information\n        - Remove the entry\n/);
  for (const path of ['README.md', 'CONTRIBUTING.md', 'AGENTS.md']) {
    assert.ok(read(path).includes(`/issues/new?template=${name}`), path);
  }
});
