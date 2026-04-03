import fs from 'fs';
import path from 'path';

const SRC_DIR = path.resolve('../');
const DEST_DIR = path.resolve('./src/data/blog');
const BASE_PATH = '/langchain-logbook';
const PUB_DATE = new Date().toISOString();

// Slugify function to match AstroPaper's behavior (kebab-case)
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     
    .replace(/[^\w-]+/g, '')   
    .replace(/--+/g, '-')       
    .replace(/^-+/, '')         
    .replace(/-+$/, '');        
}

if (!fs.existsSync(DEST_DIR)) {
  fs.mkdirSync(DEST_DIR, { recursive: true });
}

// Clear destination
if (fs.existsSync(DEST_DIR)) {
  const existingFiles = fs.readdirSync(DEST_DIR);
  for (const file of existingFiles) {
    fs.rmSync(path.join(DEST_DIR, file), { recursive: true, force: true });
  }
}

// Helper to rewrite links to /posts/[slug]/
function rewriteLinks(content) {
  return content.replace(/\[([^\]]+)\]\(\.\/([^)]+)\.md\)/g, (match, text, relPath) => {
    const filename = path.basename(relPath);
    if (filename.toLowerCase() === 'readme') return `[${text}](${BASE_PATH}/)`;
    if (filename.toLowerCase() === 'appendix') return `[${text}](${BASE_PATH}/posts/appendix/)`;
    const slug = slugify(filename);
    return `[${text}](${BASE_PATH}/posts/${slug}/)`;
  });
}

function processFile(srcPath, destFilename) {
  if (!fs.existsSync(srcPath)) return;
  let content = fs.readFileSync(srcPath, 'utf8');
  let title = destFilename.replace('.md', '');
  const h1Match = content.match(/^#\s+(.+)$/m);
  if (h1Match) {
    title = h1Match[1].trim();
    content = content.replace(/^#\s+.+$/m, '').trim();
  }
  content = rewriteLinks(content);
  const frontmatter = `---
title: "${title.replace(/"/g, '\\"')}"
description: "LangChain Logbook content: ${title}"
pubDatetime: ${PUB_DATE}
featured: ${destFilename === 'introduction.md'}
tags: ["tutorial"]
---

`;
  fs.writeFileSync(path.join(DEST_DIR, destFilename), frontmatter + content);
}

const tutorialsDir = path.join(SRC_DIR, 'tutorials');
if (fs.existsSync(tutorialsDir)) {
  const tutFiles = fs.readdirSync(tutorialsDir);
  for (const file of tutFiles) {
    if (file.endsWith('.md')) processFile(path.join(tutorialsDir, file), file);
  }
}
processFile(path.join(SRC_DIR, 'APPENDIX.md'), 'APPENDIX.md');
processFile(path.join(SRC_DIR, 'README.md'), 'introduction.md');

console.log('Successfully synchronized docs for AstroPaper');
