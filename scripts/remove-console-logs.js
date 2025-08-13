#!/usr/bin/env node

/**
 * Remove Console Logs Script
 * Removes console.log, console.warn statements from source files
 * Keeps console.error in catch blocks for error handling
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

const srcDir = path.join(__dirname, '../src');

// Pattern to match console statements
const consolePattern = /console\.(log|warn|info|debug).*?\);?\s*(?:\n|$)/g;
// Pattern to match console.error (we'll keep these in catch blocks)
const consoleErrorPattern = /console\.error.*?\);?\s*(?:\n|$)/g;

let totalRemoved = 0;
const modifiedFiles = [];

async function processFile(filePath) {
  try {
    const content = await readFile(filePath, 'utf8');
    let modified = content;
    let fileModified = false;

    // Remove console.log, warn, info, debug
    const matches = content.match(consolePattern);
    if (matches) {
      modified = modified.replace(consolePattern, '');
      totalRemoved += matches.length;
      fileModified = true;
    }

    // For console.error, only remove if not in a catch block
    const errorMatches = [...content.matchAll(/console\.error[^;]+;/g)];
    for (const match of errorMatches) {
      const index = match.index;
      const before = content.substring(Math.max(0, index - 100), index);
      
      // Check if it's in a catch block by looking for 'catch' keyword before
      if (!before.includes('catch')) {
        modified = modified.replace(match[0], '');
        totalRemoved++;
        fileModified = true;
      }
    }

    if (fileModified) {
      await writeFile(filePath, modified);
      modifiedFiles.push(filePath);
      console.log(`✓ Processed ${path.relative(srcDir, filePath)}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

async function walkDir(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and test directories
      if (!file.includes('node_modules') && !file.includes('__tests__')) {
        await walkDir(filePath);
      }
    } else if (file.match(/\.(ts|tsx|js|jsx)$/)) {
      await processFile(filePath);
    }
  }
}

async function main() {
  console.log('🧹 Removing console statements from source files...\n');
  
  await walkDir(srcDir);
  
  console.log('\n📊 Summary:');
  console.log(`- Total console statements removed: ${totalRemoved}`);
  console.log(`- Files modified: ${modifiedFiles.length}`);
  
  if (modifiedFiles.length > 0) {
    console.log('\n📝 Modified files:');
    modifiedFiles.forEach(file => {
      console.log(`  - ${path.relative(srcDir, file)}`);
    });
  }
  
  console.log('\n✅ Console cleanup complete!');
  console.log('Note: console.error statements in catch blocks were preserved.');
}

main().catch(console.error);