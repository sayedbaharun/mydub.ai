#!/usr/bin/env node

/**
 * Bundle Analysis Script
 * Analyzes the production build and generates a detailed report
 */

const fs = require('fs');
const path = require('path');
const { gzipSync } = require('zlib');
const { glob } = require('glob');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Configuration
const config = {
  distPath: path.join(__dirname, '..', 'dist'),
  budgets: {
    js: 300 * 1024, // 300KB per JS file
    css: 100 * 1024, // 100KB per CSS file
    image: 500 * 1024, // 500KB per image
    total: 2 * 1024 * 1024, // 2MB total
  },
  criticalFiles: ['index.html', 'main.js', 'main.css'],
};

// Utility functions
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileSize(filePath) {
  const stats = fs.statSync(filePath);
  return stats.size;
}

function getGzipSize(filePath) {
  const content = fs.readFileSync(filePath);
  return gzipSync(content).length;
}

function analyzeFile(filePath) {
  const size = getFileSize(filePath);
  const gzipSize = getGzipSize(filePath);
  const compression = ((1 - gzipSize / size) * 100).toFixed(1);
  
  return {
    path: path.relative(config.distPath, filePath),
    size,
    gzipSize,
    compression: `${compression}%`,
  };
}

function checkBudget(file, budgets) {
  const ext = path.extname(file.path).toLowerCase();
  let budget = budgets.total;
  
  if (ext === '.js') budget = budgets.js;
  else if (ext === '.css') budget = budgets.css;
  else if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'].includes(ext)) budget = budgets.image;
  
  return {
    overBudget: file.size > budget,
    budget,
    percentage: ((file.size / budget) * 100).toFixed(1),
  };
}

async function analyzeBundle() {
  console.log(`${colors.blue}${colors.bright}🔍 Analyzing bundle...${colors.reset}\n`);

  // Check if dist directory exists
  if (!fs.existsSync(config.distPath)) {
    console.error(`${colors.red}❌ Dist directory not found. Run 'npm run build' first.${colors.reset}`);
    process.exit(1);
  }

  // Get all files
  const files = await glob('**/*', { 
    cwd: config.distPath, 
    nodir: true,
    absolute: true,
  });

  // Analyze each file
  const analyzedFiles = files.map(analyzeFile);
  
  // Sort by size
  analyzedFiles.sort((a, b) => b.size - a.size);

  // Calculate totals
  const totals = analyzedFiles.reduce((acc, file) => {
    acc.size += file.size;
    acc.gzipSize += file.gzipSize;
    return acc;
  }, { size: 0, gzipSize: 0 });

  // Group by type
  const filesByType = {};
  analyzedFiles.forEach(file => {
    const ext = path.extname(file.path).toLowerCase() || 'other';
    if (!filesByType[ext]) {
      filesByType[ext] = { files: [], totalSize: 0, totalGzipSize: 0 };
    }
    filesByType[ext].files.push(file);
    filesByType[ext].totalSize += file.size;
    filesByType[ext].totalGzipSize += file.gzipSize;
  });

  // Print summary
  console.log(`${colors.cyan}${colors.bright}📊 Bundle Summary${colors.reset}`);
  console.log('═══════════════════════════════════════\n');
  
  console.log(`Total files: ${colors.green}${files.length}${colors.reset}`);
  console.log(`Total size: ${colors.green}${formatBytes(totals.size)}${colors.reset}`);
  console.log(`Total gzip size: ${colors.green}${formatBytes(totals.gzipSize)}${colors.reset}`);
  console.log(`Average compression: ${colors.green}${((1 - totals.gzipSize / totals.size) * 100).toFixed(1)}%${colors.reset}\n`);

  // Print breakdown by type
  console.log(`${colors.cyan}${colors.bright}📁 Breakdown by Type${colors.reset}`);
  console.log('═══════════════════════════════════════\n');
  
  Object.entries(filesByType)
    .sort((a, b) => b[1].totalSize - a[1].totalSize)
    .forEach(([ext, data]) => {
      console.log(`${colors.yellow}${ext === 'other' ? 'Other' : ext.toUpperCase()} files:${colors.reset}`);
      console.log(`  Count: ${data.files.length}`);
      console.log(`  Size: ${formatBytes(data.totalSize)} (gzip: ${formatBytes(data.totalGzipSize)})`);
      console.log(`  Average: ${formatBytes(data.totalSize / data.files.length)}\n`);
    });

  // Print largest files
  console.log(`${colors.cyan}${colors.bright}📦 Largest Files (Top 10)${colors.reset}`);
  console.log('═══════════════════════════════════════\n');
  
  analyzedFiles.slice(0, 10).forEach((file, index) => {
    const budgetCheck = checkBudget(file, config.budgets);
    const status = budgetCheck.overBudget ? `${colors.red}⚠️` : `${colors.green}✅`;
    
    console.log(`${index + 1}. ${file.path}`);
    console.log(`   Size: ${formatBytes(file.size)} (gzip: ${formatBytes(file.gzipSize)})`);
    console.log(`   Compression: ${file.compression}`);
    console.log(`   Budget: ${status} ${budgetCheck.percentage}% of ${formatBytes(budgetCheck.budget)}${colors.reset}\n`);
  });

  // Check critical files
  console.log(`${colors.cyan}${colors.bright}🎯 Critical Files${colors.reset}`);
  console.log('═══════════════════════════════════════\n');
  
  config.criticalFiles.forEach(criticalFile => {
    const found = analyzedFiles.find(f => f.path.includes(criticalFile));
    if (found) {
      console.log(`${colors.green}✅ ${criticalFile}${colors.reset}`);
      console.log(`   Size: ${formatBytes(found.size)} (gzip: ${formatBytes(found.gzipSize)})`);
    } else {
      console.log(`${colors.red}❌ ${criticalFile} not found${colors.reset}`);
    }
  });

  // Budget warnings
  const overBudgetFiles = analyzedFiles.filter(file => checkBudget(file, config.budgets).overBudget);
  
  if (overBudgetFiles.length > 0) {
    console.log(`\n${colors.red}${colors.bright}⚠️  Budget Warnings${colors.reset}`);
    console.log('═══════════════════════════════════════\n');
    
    overBudgetFiles.forEach(file => {
      const budgetCheck = checkBudget(file, config.budgets);
      console.log(`${colors.red}• ${file.path}${colors.reset}`);
      console.log(`  ${formatBytes(file.size)} exceeds budget of ${formatBytes(budgetCheck.budget)} by ${formatBytes(file.size - budgetCheck.budget)}`);
    });
  }

  // Generate JSON report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalFiles: files.length,
      totalSize: totals.size,
      totalGzipSize: totals.gzipSize,
      averageCompression: ((1 - totals.gzipSize / totals.size) * 100).toFixed(1) + '%',
    },
    filesByType,
    largestFiles: analyzedFiles.slice(0, 20),
    overBudgetFiles,
    budgets: config.budgets,
  };

  fs.writeFileSync(
    path.join(config.distPath, 'bundle-analysis.json'),
    JSON.stringify(report, null, 2)
  );

  console.log(`\n${colors.green}${colors.bright}✅ Analysis complete!${colors.reset}`);
  console.log(`${colors.blue}📄 Detailed report saved to: dist/bundle-analysis.json${colors.reset}\n`);

  // Exit with error if budget exceeded
  if (totals.size > config.budgets.total) {
    console.error(`${colors.red}❌ Total bundle size (${formatBytes(totals.size)}) exceeds budget (${formatBytes(config.budgets.total)})${colors.reset}`);
    process.exit(1);
  }
}

// Run analysis
analyzeBundle().catch(error => {
  console.error(`${colors.red}❌ Analysis failed:${colors.reset}`, error);
  process.exit(1);
});