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
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w-]+/g, '')   // Remove all non-word chars
    .replace(/--+/g, '-')       // Replace multiple - with single -
    .replace(/^-+/, '')         // Trim - from start of text
    .replace(/-+$/, '');        // Trim - from end of text
}

// Ensure destination exists
if (!fs.existsSync(DEST_DIR)) {
  fs.mkdirSync(DEST_DIR, { recursive: true });
}

// 1. Clear destination
const files = fs.readdirSync(DEST_DIR);
for (const file of files) {
  fs.rmSync(path.join(DEST_DIR, file), { recursive: true, force: true });
}

// Helper to rewrite links
function rewriteLinks(content) {
  // Regex to find Markdown links like [text](./tutorials/01_Getting_Started.md)
  // AstroPaper uses /posts/[slug]/
  return content.replace(/\[([^\]]+)\]\(\.\/([^)]+)\.md\)/g, (match, text, relPath) => {
    const parts = relPath.split('/');
    const filename = parts[parts.length - 1];
    
    if (filename.toLowerCase() === 'readme') return `[${text}](${BASE_PATH}/)`;
    if (filename.toLowerCase() === 'appendix') return `[${text}](${BASE_PATH}/posts/appendix/)`;
    
    const slug = slugify(filename);
    return `[${text}](${BASE_PATH}/posts/${slug}/)`;
  });
}

// Core processing function
function processFile(srcPath, destFilename) {
  if (!fs.existsSync(srcPath)) return;
  
  let content = fs.readFileSync(srcPath, 'utf8');
  
  // 1. Extract and Strip H1
  let title = destFilename.replace('.md', '');
  const h1Match = content.match(/^#\s+(.+)$/m);
  if (h1Match) {
    title = h1Match[1].trim();
    // Remove the H1 line to avoid duplication
    content = content.replace(/^#\s+.+$/m, '').trim();
  }

  // 2. Rewrite Links
  content = rewriteLinks(content);
  
  // 3. Prepare Frontmatter
  const frontmatter = `---
title: "${title.replace(/"/g, '\\"')}"
description: "LangChain Logbook content: ${title}"
pubDatetime: ${PUB_DATE}
tags: ["tutorial"]
---

`;
  
  fs.writeFileSync(path.join(DEST_DIR, destFilename), frontmatter + content);
}

// Process Tutorial Files
const tutorialsDir = path.join(SRC_DIR, 'tutorials');
if (fs.existsSync(tutorialsDir)) {
  const tutFiles = fs.readdirSync(tutorialsDir);
  for (const file of tutFiles) {
    if (file.endsWith('.md')) {
      processFile(path.join(tutorialsDir, file), file);
    }
  }
}

// Process Appendix
processFile(path.join(SRC_DIR, 'APPENDIX.md'), 'APPENDIX.md');

// Special case for README -> index is handled by AstroPaper naturally
// But we might want the README content on the Home page or as a post.
// For now, let's just make it a post called 'Introduction'
processFile(path.join(SRC_DIR, 'README.md'), 'introduction.md');

console.log('Successfully synchronized docs for AstroPaper with title stripping');
