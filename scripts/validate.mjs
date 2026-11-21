import { lstatSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { isIP } from 'node:net';
import { fileURLToPath } from 'node:url';

export const categories = Object.freeze({
  automation: 'Automation and scripting',
  documentation: 'Documentation and sheets',
  data: 'Data and parameters',
  'qa-coordination': 'Model QA and coordination',
  mep: 'MEP and electrical',
  'ai-mcp': 'AI and MCP',
  visualization: 'Visualization',
  'interop-ifc': 'Interoperability and IFC',
  developer: 'Developer tools',
});

export const toolPlatforms = Object.freeze([
  'Revit', 'Navisworks', 'AutoCAD', 'Civil 3D', 'Forma', 'Dynamo', 'Archicad',
  'Tekla', 'SketchUp', 'Rhino', 'Blender', 'IFC', 'Standalone', 'Web',
]);
export const toolPricing = Object.freeze(['free', 'freemium', 'paid', 'open-source']);
export const toolSources = Object.freeze(['community', 'scanner', 'editor']);
const platforms = new Set(toolPlatforms);
const pricing = new Set(toolPricing);
const sources = new Set(toolSources);
export const required = Object.freeze([
  'slug', 'name', 'vendor', 'category', 'platforms', 'pricing',
  'oneLiner', 'website', 'addedAt', 'source', 'sourceUrl',
]);
export const fieldOrder = Object.freeze([
  'slug', 'name', 'vendor', 'category', 'platforms', 'pricing', 'license',
  'oneLiner', 'website', 'githubRepo', 'appStoreUrl', 'addedAt', 'source', 'sourceUrl', 'logo',
]);
const fields = new Set(fieldOrder);
export const toolLimits = Object.freeze({
  slug: 60, name: 60, vendor: 80, platform: 30, platformsMin: 1, platformsMax: 5,
  license: 40, oneLinerMin: 20, oneLinerMax: 140, url: 300, githubRepo: 140,
  date: 10, logo: 71,
});
export const catalogToolLimit = 2000;
export const toolPatterns = Object.freeze({
  slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  name: /^[^<>\[\]`\\]+$/,
  license: /^[A-Za-z0-9][A-Za-z0-9.+-]*(?: (?:AND|OR|WITH) [A-Za-z0-9][A-Za-z0-9.+-]*)*$/,
  githubRepo: /^(?![A-Za-z0-9-]*--)[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?\/(?!\.{1,2}$)[A-Za-z0-9_.-]{1,100}$/,
  date: /^\d{4}-\d{2}-\d{2}$/,
  logo: /^logos\/[a-z0-9]+(?:-[a-z0-9]+)*\.webp$/,
  oneLinerCharacters: /^[\x20-\x7e\u00c0-\u024f\u1e00-\u1eff]+$/u,
  generatedAt: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/,
});
export const URL_SHORTENERS = [
  '1drv.ms', 'adf.ly', 'aka.ms', 'amzn.to', 'bc.vc', 'bit.do', 'bit.ly', 'bitly.com',
  'bl.ink', 'buff.ly', 'cli.gs', 'clck.ru', 'cutt.ly', 'db.tt', 'dub.sh', 'fb.me',
  'forms.gle', 'gg.gg', 'goo.gl', 'han.gl', 'ift.tt', 'is.gd', 'kutt.it', 'linktr.ee',
  'lnkd.in', 'mzl.la', 'ow.ly', 'po.st', 'qr.ae', 'rb.gy', 'rebrand.ly', 's.coop',
  's.id', 's7y.us', 'shorte.st', 'short.gy', 'short.io', 'shorturl.at', 'soo.gd',
  't.co', 't.ly', 'tiny.cc', 'tiny.one', 'tinyurl.com', 'tr.ee', 'trib.al',
  'u.to', 'ur1.ca', 'v.gd', 'wp.me', 'x.co', 'youtu.be', 'zip.net',
];
const shorteners = new Set(URL_SHORTENERS);
const specialSuffixes = new Set([
  'alt', 'arpa', 'corp', 'example', 'home', 'internal', 'invalid', 'lan', 'local',
  'localhost', 'localdomain', 'onion', 'test',
]);
const appStores = new Set(['marketplace.autodesk.com', 'apps.autodesk.com']);
const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const start = '<!-- BEGIN TOOLS -->';
const end = '<!-- END TOOLS -->';
const toolLimit = 8 * 1024;
const removalLimit = 1024 * 1024;
const distLimit = 2 * 1024 * 1024;
const logoLimit = 60 * 1024;
const latinLookalikes = new Map(Object.entries({
  Α: 'A', А: 'A', Β: 'B', В: 'B', Ϲ: 'C', С: 'C', Ε: 'E', Е: 'E',
  Η: 'H', Н: 'H', Ι: 'I', І: 'I', Ј: 'J', Κ: 'K', К: 'K', Μ: 'M', М: 'M',
  Ν: 'N', Ο: 'O', О: 'O', Ρ: 'P', Р: 'P', Ѕ: 'S', Τ: 'T', Т: 'T', Χ: 'X',
  Х: 'X', Υ: 'Y', Ү: 'Y', Ζ: 'Z', а: 'a', с: 'c', е: 'e', і: 'i', ј: 'j',
  о: 'o', р: 'p', ѕ: 's', х: 'x', у: 'y', ԁ: 'd', ԛ: 'q', һ: 'h', ӏ: 'l',
  α: 'a', ο: 'o', ρ: 'p', χ: 'x', υ: 'u', ν: 'v', ᴠ: 'v',
}));

function reject(field, reason) {
  throw new Error(`${field}: ${reason}`);
}

function text(value, field, max, min = 1) {
  if (typeof value !== 'string' || value.length < min || value.length > max) {
    reject(field, `expected a string of ${min}-${max} characters`);
  }
  if (value !== value.trim() || /[\p{C}\p{Zl}\p{Zp}\p{Default_Ignorable_Code_Point}]/u.test(value)) {
    reject(field, 'expected trimmed, single-line text without control or invisible characters');
  }
  return value;
}

function slug(value, field = 'slug') {
  if (!toolPatterns.slug.test(text(value, field, toolLimits.slug))) {
    reject(field, 'expected a lowercase slug with single hyphen separators');
  }
}

function date(value, field) {
  const input = text(value, field, toolLimits.date, toolLimits.date);
  const time = new Date(`${input}T00:00:00.000Z`);
  if (!toolPatterns.date.test(input) || !Number.isFinite(time.valueOf()) || time.toISOString().slice(0, 10) !== input) {
    reject(field, 'expected a real date in YYYY-MM-DD format');
  }
}

function enumValue(value, field, values) {
  if (!values.has(value)) reject(field, `expected one of: ${[...values].join(', ')}`);
}

export function validateUrl(value, field = 'url') {
  text(value, field, toolLimits.url);
  if (!value.startsWith('https://') || /[\s<>"`\\|]/u.test(value)) {
    reject(field, 'expected a lower-case https:// scheme without whitespace or unsafe delimiters');
  }
  const authority = value.slice(8).split(/[/?#]/, 1)[0];
  if (!authority || /[@%]/.test(authority)) reject(field, 'expected a host without userinfo or escapes');
  if (authority.startsWith('[')) reject(field, 'IP literals are not allowed');
  if (authority.includes(':')) reject(field, 'explicit ports are not allowed');
  if (!/^[A-Za-z0-9.-]+$/.test(authority) || authority.endsWith('.') || /(?:^|\.)xn--/i.test(authority)) {
    reject(field, 'expected an ASCII DNS host without a trailing dot or an IDN label');
  }
  let url;
  try {
    url = new URL(value);
  } catch {
    reject(field, 'invalid HTTPS URL');
  }
  const host = url.hostname;
  const labels = host.split('.');
  if (isIP(host) || host.length > 253 || labels.length < 2
      || !/^[a-z]/.test(labels.at(-1)) || specialSuffixes.has(labels.at(-1))
      || labels.some((label) => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))
      || /(?:^|\.)(?:localhost|example\.(?:com|net|org))$/.test(host)) {
    reject(field, 'expected a public DNS name, not an IP, reserved name or local host');
  }
  if (labels.some((_, i) => shorteners.has(labels.slice(i).join('.')))) {
    reject(field, 'URL shorteners are not allowed');
  }
  return url;
}

export function validateTool(tool, filename = undefined) {
  if (!tool || typeof tool !== 'object' || Array.isArray(tool)) reject('tool', 'expected an object');
  for (const key of Object.keys(tool)) {
    if (!fields.has(key)) reject('tool', `unknown field ${JSON.stringify(key)}`);
  }
  for (const key of required) {
    if (!Object.hasOwn(tool, key)) reject(key, 'required field is missing');
  }
  slug(tool.slug);
  if (filename !== undefined && filename !== `${tool.slug}.json`) {
    reject('slug', 'must match the JSON filename exactly');
  }
  if (!toolPatterns.name.test(text(tool.name, 'name', toolLimits.name))) reject('name', 'markup is not allowed');
  text(tool.vendor, 'vendor', toolLimits.vendor);
  if (typeof tool.category !== 'string' || !Object.hasOwn(categories, tool.category)) {
    reject('category', `expected one of: ${Object.keys(categories).join(', ')}`);
  }
  if (!Array.isArray(tool.platforms) || tool.platforms.length < toolLimits.platformsMin || tool.platforms.length > toolLimits.platformsMax) {
    reject('platforms', `expected ${toolLimits.platformsMin}-${toolLimits.platformsMax} platforms`);
  }
  for (const platform of tool.platforms) enumValue(text(platform, 'platforms', toolLimits.platform), 'platforms', platforms);
  if (new Set(tool.platforms).size !== tool.platforms.length) reject('platforms', 'duplicate platform');
  enumValue(tool.pricing, 'pricing', pricing);
  enumValue(tool.source, 'source', sources);
  if (Object.hasOwn(tool, 'license') && !toolPatterns.license.test(text(tool.license, 'license', toolLimits.license))) {
    reject('license', 'expected an SPDX-like identifier or expression');
  }
  const description = text(tool.oneLiner, 'oneLiner', toolLimits.oneLinerMax, toolLimits.oneLinerMin);
  if (!toolPatterns.oneLinerCharacters.test(description)
      || /[^\x20-\x7e\p{Script=Latin}]/u.test(description) || !/\p{Script=Latin}/u.test(description)
      || /[<>\[\]`\\|@*_~]|^ *(?:#{1,6}(?: |$)|[-+] |\d+[.)] )|\$[^$]+\$/.test(description)
      || /\b(?:[a-z][a-z0-9+.-]*:\/\/|(?:https?|ftp|javascript|data|file|mailto):|(?:[a-z0-9-]+\.)+[a-z]{2,}\b)/i.test(description)) {
    reject('oneLiner', 'expected a plain sentence with Latin letters and printable ASCII, without URLs, markup or mentions');
  }
  validateUrl(tool.website, 'website');
  validateUrl(tool.sourceUrl, 'sourceUrl');
  if (Object.hasOwn(tool, 'githubRepo') && !toolPatterns.githubRepo.test(text(tool.githubRepo, 'githubRepo', toolLimits.githubRepo))) {
    reject('githubRepo', 'expected a GitHub owner/name');
  }
  if (Object.hasOwn(tool, 'appStoreUrl') && !appStores.has(validateUrl(tool.appStoreUrl, 'appStoreUrl').hostname)) {
    reject('appStoreUrl', 'expected an Autodesk App Store host');
  }
  if (Object.hasOwn(tool, 'logo') && (!toolPatterns.logo.test(text(tool.logo, 'logo', toolLimits.logo)) || tool.logo !== `logos/${tool.slug}.webp`)) {
    reject('logo', 'expected logos/<slug>.webp with the tool slug');
  }
  date(tool.addedAt, 'addedAt');
  return tool;
}

function regular(path, directory = false) {
  const stat = lstatSync(path);
  if (!(directory ? stat.isDirectory() : stat.isFile())) {
    throw new Error(`${path}: expected a regular ${directory ? 'directory' : 'file'}, not a symlink or special entry`);
  }
  return stat;
}

function readText(path, max = Infinity) {
  if (regular(path).size > max) reject(path, `file exceeds ${max} bytes`);
  const bytes = readFileSync(path);
  try {
    return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes);
  } catch (error) {
    throw new Error(`${path}: expected valid UTF-8`, { cause: error });
  }
}

function nameKey(name) {
  return Array.from(name.normalize('NFKC'), (letter) => latinLookalikes.get(letter) ?? letter).join('').toLowerCase();
}

function parseJson(raw) {
  const containers = [];
  for (const [token, key, colon] of raw.matchAll(/("(?:[^"\\]|\\[\s\S])*")(\s*:)?|[{}\[\]]/g)) {
    if (token === '{' || token === '[') {
      if (containers.length === 2) reject('JSON', 'nesting exceeds the supported catalog structure');
      const object = token === '{' ? new Set() : null;
      containers.push(object);
    } else if (token === '}' || token === ']') {
      containers.pop();
    } else if (colon) {
      const name = JSON.parse(key);
      if (name === '__proto__' || name === 'constructor') reject(JSON.stringify(name), 'unsafe JSON key');
      const fields = containers.at(-1);
      if (!fields || fields.has(name)) reject(JSON.stringify(name), 'duplicate or misplaced JSON field');
      fields.add(name);
    }
  }
  return JSON.parse(raw);
}

function websiteKey(value) {
  const url = new URL(value);
  url.hash = '';
  url.pathname = url.pathname.replace(/\/+$/, '').replace(/%[0-9a-f]{2}/gi, (escape) => {
    const char = String.fromCharCode(parseInt(escape.slice(1), 16));
    return /[A-Za-z0-9._~-]/.test(char) ? char : escape.toUpperCase();
  });
  url.searchParams.sort();
  return url.href;
}

function validateRemovals(root) {
  const rawRemoved = readText(join(root, 'removed.json'), removalLimit);
  let removed;
  try {
    removed = parseJson(rawRemoved);
  } catch (error) {
    throw new Error(`removed.json: ${error.message}`, { cause: error });
  }
  if (!Array.isArray(removed)) reject('removed.json', 'expected an array of removal records');
  const identities = new Set();
  for (const [index, entry] of removed.entries()) {
    const field = `removed.json[${index}]`;
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)
        || Object.keys(entry).length !== 3 || !['slug', 'identity', 'removedAt'].every((key) => Object.hasOwn(entry, key))) {
      reject(field, 'expected an object with exactly slug, identity and removedAt');
    }
    slug(entry.slug, `${field}.slug`);
    const identity = text(entry.identity, `${field}.identity`, 257);
    if (!/^(?:github:\d+|appstore:[0-9a-f-]{36}|web:[a-z0-9.-]+)$/.test(identity)) {
      reject(`${field}.identity`, 'expected a GitHub, App Store or web identity');
    }
    if (identities.has(identity)) reject(`${field}.identity`, 'duplicate removed identity');
    identities.add(identity);
    date(entry.removedAt, `${field}.removedAt`);
  }
}

function validateWebp(bytes, field) {
  if (bytes.length < 12 || bytes.readUInt32BE(0) !== 0x52494646 || bytes.readUInt32BE(8) !== 0x57454250) {
    reject(field, 'expected RIFF....WEBP signature');
  }
  if (bytes.readUInt32LE(4) !== bytes.length - 8) reject(field, 'RIFF length does not match the file size');
  let canvas;
  let image;
  const dimensions = (width, height) => {
    if (width < 1 || height < 1 || width > 256 || height > 256) reject(field, 'dimensions must be 1-256 pixels per side');
    return [width, height];
  };
  for (let offset = 12; offset < bytes.length;) {
    if (bytes.length - offset < 8) reject(field, 'truncated WebP chunk header');
    const type = bytes.toString('latin1', offset, offset + 4);
    const length = bytes.readUInt32LE(offset + 4);
    const data = offset + 8;
    const end = data + length;
    const next = end + (length & 1);
    if (next > bytes.length || (next !== end && bytes[end] !== 0)) reject(field, 'invalid WebP chunk length or padding');
    if (type === 'ANIM' || type === 'ANMF') reject(field, 'animated WebP is not allowed');
    if (offset === 12 && type !== 'VP8 ' && type !== 'VP8L' && type !== 'VP8X') {
      reject(field, 'first WebP chunk must be VP8, VP8L or VP8X');
    }
    if (type === 'VP8X') {
      if (offset !== 12 || length !== 10) reject(field, 'invalid VP8X header');
      if ((bytes[data] & 0x02) !== 0) reject(field, 'animated WebP is not allowed');
      if ((bytes[data] & 0xc1) !== 0 || bytes.readUIntBE(data + 1, 3) !== 0) reject(field, 'invalid VP8X reserved bits');
      canvas = dimensions(bytes.readUIntLE(data + 4, 3) + 1, bytes.readUIntLE(data + 7, 3) + 1);
    } else if (type === 'VP8 ' || type === 'VP8L') {
      if (image) reject(field, 'expected exactly one WebP image chunk');
      if (type === 'VP8 ') {
        if (length <= 10 || (bytes[data] & 1) !== 0 || bytes.readUIntBE(data + 3, 3) !== 0x9d012a) {
          reject(field, 'invalid VP8 image header');
        }
        const partitionSize = bytes.readUIntLE(data, 3) >>> 5;
        if (partitionSize === 0 || partitionSize > length - 10) reject(field, 'invalid VP8 partition length');
        image = dimensions(bytes.readUInt16LE(data + 6) & 0x3fff, bytes.readUInt16LE(data + 8) & 0x3fff);
      } else {
        if (length <= 5 || bytes[data] !== 0x2f) reject(field, 'invalid VP8L image header');
        const bits = bytes.readUInt32LE(data + 1);
        if (bits >>> 29) reject(field, 'invalid VP8L version');
        image = dimensions((bits & 0x3fff) + 1, ((bits >>> 14) & 0x3fff) + 1);
      }
    }
    offset = next;
  }
  if (!image) reject(field, 'missing WebP image chunk');
  if (canvas && (canvas[0] !== image[0] || canvas[1] !== image[1])) reject(field, 'WebP image dimensions do not match the canvas');
}

function validateLogos(root, tools) {
  const dir = join(root, 'logos');
  const expected = new Set(tools.filter((tool) => Object.hasOwn(tool, 'logo')).map((tool) => `${tool.slug}.webp`));
  if (!lstatSync(dir, { throwIfNoEntry: false })) {
    if (expected.size) reject(`logos/${expected.values().next().value}`, 'referenced file is missing');
    return;
  }
  regular(dir, true);
  for (const name of readdirSync(dir).sort()) {
    const field = `logos/${JSON.stringify(name)}`;
    if (!expected.delete(name)) reject(field, 'file has no matching tool logo');
    const path = join(dir, name);
    if (regular(path).size > logoLimit) reject(field, 'file exceeds 60 KiB');
    validateWebp(readFileSync(path), field);
  }
  if (expected.size) reject(`logos/${expected.values().next().value}`, 'referenced file is missing');
}

export function loadCatalog(root = repoRoot) {
  validateRemovals(root);
  const dir = join(root, 'tools');
  regular(dir, true);
  const seen = new Map(['name', 'slug', 'website', 'githubRepo'].map((field) => [field, new Map()]));
  const filenames = readdirSync(dir).sort();
  const foldedFilenames = new Set();
  for (const filename of filenames) {
    const key = filename.toLowerCase();
    if (foldedFilenames.has(key)) reject(`tools/${JSON.stringify(filename)}`, 'duplicate filename ignoring case');
    foldedFilenames.add(key);
  }
  const tools = filenames.map((filename) => {
    try {
      if (!filename.endsWith('.json')) reject('filename', 'expected a .json tool file');
      const raw = readText(join(dir, filename), toolLimit);
      const tool = validateTool(parseJson(raw));
      for (const [field, index] of seen) {
        if (!Object.hasOwn(tool, field)) continue;
        const key = field === 'website' ? websiteKey(tool.website)
          : field === 'name' ? nameKey(tool.name)
          : tool[field].normalize('NFKC').toLowerCase();
        if (index.has(key)) reject(field, `duplicate of ${JSON.stringify(index.get(key))}`);
        index.set(key, filename);
      }
      if (filename !== `${tool.slug}.json`) reject('slug', 'must match the JSON filename exactly');
      return Object.fromEntries(fieldOrder.filter((field) => Object.hasOwn(tool, field)).map((field) => [field, tool[field]]));
    } catch (error) {
      throw new Error(`tools/${JSON.stringify(filename)}: ${error.message}`, { cause: error });
    }
  });
  validateLogos(root, tools);
  tools.sort((a, b) => a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0);
  return tools;
}

function escapeMarkdown(value) {
  return value.replace(/[&<>\[\]*_~`\\|@#!$]/g, (char) => `&#${char.charCodeAt(0)};`)
    .replace(/\b(?:https?:\/\/|www\.)/gi, (prefix) => `${prefix.slice(0, -1)}&#${prefix.charCodeAt(prefix.length - 1)};`);
}

function readmeWithTables(readme, tools) {
  const lines = readme.split('\n');
  const first = lines.indexOf(start);
  const last = lines.indexOf(end);
  if (first < 0 || first >= last || first !== lines.lastIndexOf(start) || last !== lines.lastIndexOf(end)) {
    reject('README.md', 'expected one ordered pair of tool table markers on separate lines');
  }
  const tables = [];
  for (const [category, label] of Object.entries(categories)) {
    tables.push('', `### ${escapeMarkdown(label)}`, '', '| Name | Maker | Platforms | Pricing | What it does |', '| --- | --- | --- | --- | --- |');
    for (const tool of tools) {
      if (tool.category !== category) continue;
      const link = validateUrl(tool.website, 'website').href.replaceAll('&', '&amp;');
      tables.push(`| [${escapeMarkdown(tool.name)}](<${link}>) | ${escapeMarkdown(tool.vendor)} | ${escapeMarkdown(tool.platforms.join(', '))} | ${escapeMarkdown(tool.pricing)} | ${escapeMarkdown(tool.oneLiner)} |`);
    }
  }
  return [...lines.slice(0, first + 1), ...tables, '', ...lines.slice(last)].join('\n');
}

function distContents(value) {
  const json = `${JSON.stringify(value, null, 2)}\n`.replace(/"(?:[^"\\]|\\[\s\S])*"/g, (literal) =>
    literal.replace(/[<>&|\[\]*_~`@#!$]/g, (char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`),
  );
  if (Buffer.byteLength(json) > distLimit) reject('dist/tools.json', `file exceeds ${distLimit} bytes`);
  return json;
}

export function generatedFiles(root = repoRoot) {
  const tools = loadCatalog(root);
  if (tools.length > catalogToolLimit) reject('dist/tools.json', `expected at most ${catalogToolLimit} tools`);
  const addedAt = tools.reduce((latest, tool) => tool.addedAt > latest ? tool.addedAt : latest, '');
  const generatedAt = `${addedAt || '1970-01-01'}T00:00:00.000Z`;
  if (!toolPatterns.generatedAt.test(generatedAt)) reject('dist/tools.json', 'invalid generatedAt timestamp');
  const readmePath = join(root, 'README.md');
  const distPath = join(root, 'dist');
  regular(distPath, true);
  return {
    count: tools.length,
    files: [
      [join(distPath, 'tools.json'), distContents({ generatedAt, count: tools.length, tools }), distLimit],
      [readmePath, readmeWithTables(readText(readmePath), tools)],
    ],
  };
}

export function checkCatalog(root = repoRoot) {
  const { count, files } = generatedFiles(root);
  for (const [path, expected, limit] of files) {
    if (readText(path, limit) !== expected) reject(path, 'out of date; run node scripts/build.mjs');
  }
  return count;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    const dataOnly = args[0] === '--data-only';
    if (dataOnly) args.shift();
    if (args.length > 1 || args[0]?.startsWith('--')) throw new Error('Usage: node scripts/validate.mjs [--data-only] [catalog-dir]');
    if (dataOnly) {
      console.log(`Validated data for ${loadCatalog(args[0]).length} tools`);
    } else {
      console.log(`Validated ${checkCatalog(args[0])} tools, dist/tools.json and README.md`);
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
