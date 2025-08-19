#!/usr/bin/env node

/**
 * Script to find potential "0" rendering issues in React components
 * Looks for patterns that might accidentally render the number 0
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 Searching for potential "0" rendering issues...\n');

// Patterns that might cause 0 to render
const patterns = [
  // {someValue && <Component />} where someValue could be 0
  /\{([^}]+)&&/g,
  // {count} or {length} without proper checks
  /\{(count|length|size|total|items|results)\}/gi,
  // Conditional rendering with numeric values
  /\{[\w.]+\s*\?\s*[\w.]+\s*:\s*0\}/g,
  // Direct numeric rendering
  />\s*\{0\}\s*</g,
];

const srcPath = path.join(__dirname, '../src');

// Simple file finder without glob
function findFiles(dir, pattern) {
  const results = [];
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      results.push(...findFiles(filePath, pattern));
    } else if (stat.isFile() && (file.endsWith('.tsx') || file.endsWith('.jsx'))) {
      results.push(path.relative(srcPath, filePath));
    }
  }
  
  return results;
}

const files = findFiles(srcPath, '**/*.{tsx,jsx}');

let issuesFound = [];

files.forEach(file => {
  const filePath = path.join(srcPath, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    patterns.forEach(pattern => {
      const matches = line.match(pattern);
      if (matches) {
        // Check if it's likely to be a problem
        if (line.includes('&&') && !line.includes('> 0') && !line.includes('!== 0')) {
          // This could render 0 if the value is 0
          const variable = line.match(/\{([^&]+)&&/);
          if (variable && variable[1].match(/(count|length|size|total|items|queuedCount)/i)) {
            issuesFound.push({
              file,
              line: index + 1,
              code: line.trim(),
              issue: `Potential "0" render: Use {${variable[1]} > 0 && ...} instead`
            });
          }
        }
      }
    });
  });
});

if (issuesFound.length > 0) {
  console.log(`Found ${issuesFound.length} potential issues:\n`);
  issuesFound.forEach(issue => {
    console.log(`📍 ${issue.file}:${issue.line}`);
    console.log(`   Code: ${issue.code}`);
    console.log(`   Fix: ${issue.issue}\n`);
  });
} else {
  console.log('✅ No obvious "0" rendering issues found');
}

// Special check for HomePage.tsx
const homePagePath = path.join(srcPath, 'pages/HomePage.tsx');
if (fs.existsSync(homePagePath)) {
  const content = fs.readFileSync(homePagePath, 'utf8');
  
  // Look for any standalone numbers
  const standaloneNumbers = content.match(/^\s*\d+\s*$/gm);
  if (standaloneNumbers) {
    console.log('\n⚠️  Found standalone numbers in HomePage.tsx:');
    standaloneNumbers.forEach(num => {
      console.log(`   "${num.trim()}"`);
    });
  }
  
  // Check for debug outputs
  const debugOutputs = content.match(/console\.(log|debug|info).*\(/g);
  if (debugOutputs) {
    console.log('\n⚠️  Found console outputs in HomePage.tsx that might be rendering:');
    debugOutputs.forEach(output => {
      console.log(`   ${output}`);
    });
  }
}