import fs from 'fs';
import path from 'path';

const SRC_DIR = path.resolve('../');
const DEST_DIR = path.resolve('./src/content/docs');
const BASE_PATH = '/langchain-logbook';

// Ensure destination exists
if (!fs.existsSync(DEST_DIR)) {
  fs.mkdirSync(DEST_DIR, { recursive: true });
}

// Helper to rewrite links
function rewriteLinks(content) {
  // Regex to find Markdown links like [text](./tutorials/01_Getting_Started.md)
  // Converting to [text](/langchain-logbook/tutorials/01_getting_started/)
  return content.replace(/\[([^\]]+)\]\(\.\/([^)]+)\.md\)/g, (match, text, relPath) => {
    let newPath = relPath.toLowerCase().replace(/_/g, '_'); // Astro handles underscores fine, but case should be lower
    
    // Specific case for index/readme which might be linked as ./README.md
    if (newPath === 'readme') return `[${text}](${BASE_PATH}/)`;
    if (newPath === 'appendix') return `[${text}](${BASE_PATH}/appendix/)`;
    
    // For tutorials/...
    return `[${text}](${BASE_PATH}/${newPath}/)`;
  });
}

// 1. Copy tutorials directory
const tutorialsSrc = path.join(SRC_DIR, 'tutorials');
const tutorialsDest = path.join(DEST_DIR, 'tutorials');
if (fs.existsSync(tutorialsDest)) {
  fs.rmSync(tutorialsDest, { recursive: true, force: true });
}
if (fs.existsSync(tutorialsSrc)) {
  fs.cpSync(tutorialsSrc, tutorialsDest, { recursive: true });
}

// 2. Copy APPENDIX.md
const appendixSrc = path.join(SRC_DIR, 'APPENDIX.md');
const appendixDest = path.join(DEST_DIR, 'appendix.md'); // Use lowercase for better routing consistency
if (fs.existsSync(appendixSrc)) {
  fs.copyFileSync(appendixSrc, appendixDest);
}

// 3. Copy README.md as index.md
const readmeSrc = path.join(SRC_DIR, 'README.md');
const indexDestMdx = path.join(DEST_DIR, 'index.mdx');
const indexDestMd = path.join(DEST_DIR, 'index.md');

if (fs.existsSync(indexDestMdx)) {
  fs.rmSync(indexDestMdx);
}

if (fs.existsSync(readmeSrc)) {
  fs.copyFileSync(readmeSrc, indexDestMd);
}

// 4. Inject frontmatter AND rewrite links
function processMarkdown(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      processMarkdown(fullPath);
    } else if (file.isFile() && fullPath.endsWith('.md')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // 1. Rewrite relative links to absolute Astro routes
      content = rewriteLinks(content);

      // 2. Inject frontmatter if missing
      if (!content.startsWith('---')) {
        let title = file.name.replace('.md', '');
        let frontmatter = '';

        if (file.name === 'index.md') {
          frontmatter = `---
title: LangChain Logbook
description: The ultimate learning path for LangChain and AI Agents.
template: splash
hero:
  tagline: 从底层重新认识大语言模型应用架构，构建工业级 Agent
  image:
    file: ../../assets/houston.webp
  actions:
    - text: 开始阅读教程
      link: ${BASE_PATH}/tutorials/01_getting_started/
      icon: right-arrow
      variant: primary
    - text: 查看附录协议
      link: ${BASE_PATH}/appendix/
      icon: document
---

`;
        } else {
          // Try to extract H1
          const h1Match = content.match(/^#\s+(.+)$/m);
          if (h1Match) {
            title = h1Match[1].trim();
          }
          frontmatter = `---\ntitle: "${title.replace(/"/g, '\\"')}"\n---\n\n`;
        }
        
        content = frontmatter + content;
      }

      fs.writeFileSync(fullPath, content);
    }
  }
}

processMarkdown(DEST_DIR);

console.log('Successfully copied docs, injected frontmatter, and fixed 404 links');
