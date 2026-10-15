import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { marked } from 'marked';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'dist/marketplace');
fs.mkdirSync(output, { recursive: true });
const sources = new Map();
function read(relative) {
  const normalized = relative.replaceAll('\\', '/');
  if (path.isAbsolute(relative) || normalized.split('/').includes('..')) throw new Error('Invalid source path');
  const bytes = fs.readFileSync(path.join(root, relative));
  sources.set(normalized, crypto.createHash('sha256').update(bytes).digest('hex'));
  return bytes.toString('utf8');
}
// Parse literal documentation data without executing the TypeScript source.
const sections = new Map();
const typeSource = ts.createSourceFile('types.ts', read('types.ts'), ts.ScriptTarget.Latest, true);
for (const statement of typeSource.statements) {
  if (ts.isEnumDeclaration(statement) && statement.name.text === 'SectionType') {
    for (const member of statement.members) sections.set(member.name.getText(typeSource), member.initializer.text);
  }
}
function literal(node, imports) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (ts.isArrayLiteralExpression(node)) return node.elements.map(n => literal(n, imports));
  if (ts.isObjectLiteralExpression(node)) return Object.fromEntries(node.properties.map(p => {
    if (!ts.isPropertyAssignment(p)) throw new Error('Unsupported documentation property');
    return [p.name.text, literal(p.initializer, imports)];
  }));
  if (ts.isIdentifier(node) && imports.has(node.text)) return imports.get(node.text);
  if (ts.isPropertyAccessExpression(node) && node.expression.getText() === 'SectionType' && sections.has(node.name.text)) return sections.get(node.name.text);
  throw new Error(`Unsupported documentation expression: ${node.getText().slice(0, 80)}`);
}
const indexSource = ts.createSourceFile('index.ts', read('data/sections/index.ts'), ts.ScriptTarget.Latest, true);
const pages = [];
for (const statement of indexSource.statements) {
  if (!ts.isImportDeclaration(statement) || !statement.moduleSpecifier.text.startsWith('./')) continue;
  const filename = `data/sections/${statement.moduleSpecifier.text.slice(2)}.ts`;
  const source = ts.createSourceFile(filename, read(filename), ts.ScriptTarget.Latest, true);
  const imports = new Map();
  for (const item of source.statements) {
    if (ts.isImportDeclaration(item) && item.moduleSpecifier.text.endsWith('.mmd?raw')) {
      const asset = path.relative(root, path.resolve(root, path.dirname(filename), item.moduleSpecifier.text.slice(0, -4)));
      imports.set(item.importClause.name.text, read(asset));
    }
    if (ts.isVariableStatement(item)) for (const declaration of item.declarationList.declarations) {
      if (declaration.initializer && ts.isArrayLiteralExpression(declaration.initializer)) pages.push(...literal(declaration.initializer, imports));
    }
  }
}
const ids = new Set(pages.map(p => p.id));
if (ids.size !== pages.length || !ids.has('quickstart-plan')) throw new Error('Missing or duplicate wiki pages');
const product = JSON.parse(read('docs/marketplace/product.json'));
for (const id of [...product.short_description_source_ids, ...product.features.flatMap(f => f.source_ids)]) {
  if (!ids.has(id)) throw new Error(`Unknown claim source: ${id}`);
}
const revision = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
const dirty = Boolean(execFileSync('git', ['status', '--porcelain', '--untracked-files=normal'], { cwd: root, encoding: 'utf8' }).trim());
const sourceUrl = `https://github.com/Machine-Saver-Inc/airvibe-lorawann-wiki/tree/${revision}`;
const header = `Draft for technical review. Source revision: ${revision}${dirty ? ' (working tree contains changes; see manifest hashes)' : ''}.\n\n[GitHub source](${sourceUrl}) | [Interactive wiki](${product.documentation_url})\n\n`;
const cell = value => String(value ?? '').replaceAll('|', '\\|').replaceAll('\n', '<br>');
function table(headers, rows) {
  return `| ${headers.map(cell).join(' | ')} |\n| ${headers.map(() => '---').join(' | ')} |\n${rows.map(r => `| ${r.map(cell).join(' | ')} |`).join('\n')}\n`;
}
function pageMarkdown(p) {
  let result = `## ${p.title}\n\n${p.content.trim().replaceAll('assets/LoRaWAN_Network_Architecture.png', 'LoRaWAN_Network_Architecture.png')}\n\n`;
  if (p.packetTable) {
    const t = p.packetTable;
    if (t.port !== undefined) result += `Downlink port: ${t.port}.\n\n`;
    if (t.packetType !== undefined) result += `Packet type: ${t.packetType}.\n\n`;
    result += table(['Byte', 'Field', 'Description', 'Values', 'Default'], t.fields.map(f => [f.byte, f.name, f.description, f.values, f.default])) + '\n';
  }
  if (p.extraTable) result += `### ${p.extraTable.title}\n\n${p.extraTable.description || ''}\n\n${table(p.extraTable.headers, p.extraTable.rows)}\n`;
  if (p.mermaidDiagram) result += `Diagram source (rendered in the interactive wiki):\n\n\`\`\`mermaid\n${p.mermaidDiagram.trim()}\n\`\`\`\n\n`;
  return result;
}
const style = 'body{font:16px/1.6 system-ui,sans-serif;max-width:1000px;margin:40px auto;padding:0 24px;color:#162b3c}h1,h2,h3{line-height:1.2}h2{margin-top:2em}table{border-collapse:collapse;width:100%;font-size:13px}th,td{border:1px solid #ccd5dc;padding:7px;text-align:left;vertical-align:top;overflow-wrap:anywhere}pre{white-space:pre-wrap;background:#f0f4f7;padding:16px}a{color:#075f88}@media print{body{margin:0;font-size:11px}h2,h3{break-after:avoid}tr{break-inside:avoid}}';
function writeDoc(name, title, content) {
  const markdown = `# ${title}\n\n${header}${content}`;
  fs.writeFileSync(path.join(output, `${name}.md`), markdown);
  fs.writeFileSync(path.join(output, `${name}.html`), `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${title}</title><style>${style}</style><body>${marked.parse(markdown)}</body></html>`);
}
writeDoc('technical-reference', 'AirVibe LoRaWAN technical reference', pages.map(pageMarkdown).join('\n'));
writeDoc('quickstart', 'AirVibe LoRaWAN quickstart', pages.filter(p => ['intro', 'quickstart-plan'].includes(p.id)).map(pageMarkdown).join('\n'));
writeDoc('listing-copy', product.name, `${product.short_description}\n\n${product.features.map(f => `- ${f.text}`).join('\n')}\n\n${product.commercial_fields}\n`);
writeDoc('integration-acceptance', 'AirVibe LoRaWAN integration acceptance checklist', read('docs/marketplace/integration-acceptance.md').replace(/^# .+\r?\n/, ''));
writeDoc('index', 'AirVibe LoRaWAN documentation review package', '- [Quickstart](quickstart.html)\n- [Technical reference](technical-reference.html)\n- [Listing copy](listing-copy.html)\n- [Integration acceptance checklist](integration-acceptance.html)\n- [Published codec](AirVibe_TS013_Codec_v2.1.2.js)\n- [Source and artifact manifest](manifest.json)\n\nConfirm shipping hardware, firmware, regional profile and compliance evidence before marketplace submission.');
fs.writeFileSync(path.join(output, 'listing.json'), JSON.stringify(product, null, 2) + '\n');
const codecPath = 'public/assets/AirVibe_TS013_Codec_v2.1.2.js';
fs.writeFileSync(path.join(output, path.basename(codecPath)), read(codecPath));
read('utils/airvibeCodec.js');
const architecture = 'public/assets/LoRaWAN_Network_Architecture.png';
read(architecture);
fs.copyFileSync(path.join(root, architecture), path.join(output, path.basename(architecture)));
read('scripts/build-marketplace.mjs');
const artifacts = Object.fromEntries(fs.readdirSync(output).filter(f => f !== 'manifest.json').sort().map(f => [f, crypto.createHash('sha256').update(fs.readFileSync(path.join(output, f))).digest('hex')]));
fs.writeFileSync(path.join(output, 'manifest.json'), JSON.stringify({ schema_version: 1, status: product.status, source_revision: revision, working_tree_dirty: dirty, source_url: sourceUrl, page_count: pages.length, sources: Object.fromEntries([...sources].sort()), artifacts }, null, 2) + '\n');
console.log(`Generated ${Object.keys(artifacts).length} marketplace artifacts from ${pages.length} wiki pages (${revision}).`);
