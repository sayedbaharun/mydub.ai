#!/usr/bin/env node

/**
 * Bundle Analysis Script
 * Analyzes the production build and generates a detailed report
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

// Bundle size thresholds (in KB)
const THRESHOLDS = {
  criticalChunk: 50,    // Critical chunks should be under 50KB
  asyncChunk: 200,      // Async chunks should be under 200KB
  totalBundle: 1000,    // Total bundle should be under 1MB
  cssBundle: 100,       // CSS bundle should be under 100KB
};

async function analyzeBundle() {
  console.log('🔍 Starting bundle analysis...\n');

  try {
    // Build the project with stats
    console.log('📦 Building project with bundle stats...');
    await execAsync('npm run build', { 
      cwd: rootDir,
      env: { ...process.env, VITE_BUNDLE_ANALYZER: 'true' }
    });

    // Read the generated stats
    const statsPath = path.join(rootDir, 'dist', 'stats.html');
    const distPath = path.join(rootDir, 'dist');
    
    // Get all JS files
    const jsFiles = await getFilesWithExtension(distPath, '.js');
    const cssFiles = await getFilesWithExtension(distPath, '.css');

    // Analyze JS bundles
    console.log('\n📊 JavaScript Bundle Analysis:');
    console.log('━'.repeat(50));
    
    let totalJsSize = 0;
    const jsAnalysis = [];
    
    for (const file of jsFiles) {
      const stats = await fs.stat(file);
      const sizeKB = stats.size / 1024;
      totalJsSize += sizeKB;
      
      const fileName = path.basename(file);
      const isCore = fileName.includes('react-core') || fileName.includes('vendor');
      const threshold = isCore ? THRESHOLDS.criticalChunk : THRESHOLDS.asyncChunk;
      const status = sizeKB > threshold ? '❌' : '✅';
      
      jsAnalysis.push({
        file: fileName,
        size: sizeKB,
        status,
        threshold
      });
    }

    // Sort by size
    jsAnalysis.sort((a, b) => b.size - a.size);
    
    // Display JS analysis
    jsAnalysis.forEach(({ file, size, status, threshold }) => {
      console.log(`${status} ${file.padEnd(40)} ${size.toFixed(2)} KB (limit: ${threshold} KB)`);
    });

    // Analyze CSS bundles
    console.log('\n🎨 CSS Bundle Analysis:');
    console.log('━'.repeat(50));
    
    let totalCssSize = 0;
    
    for (const file of cssFiles) {
      const stats = await fs.stat(file);
      const sizeKB = stats.size / 1024;
      totalCssSize += sizeKB;
      
      const fileName = path.basename(file);
      const status = sizeKB > THRESHOLDS.cssBundle ? '❌' : '✅';
      
      console.log(`${status} ${fileName.padEnd(40)} ${sizeKB.toFixed(2)} KB`);
    }

    // Summary
    console.log('\n📈 Bundle Size Summary:');
    console.log('━'.repeat(50));
    console.log(`Total JavaScript: ${totalJsSize.toFixed(2)} KB`);
    console.log(`Total CSS: ${totalCssSize.toFixed(2)} KB`);
    console.log(`Total Bundle: ${(totalJsSize + totalCssSize).toFixed(2)} KB`);
    
    const totalStatus = (totalJsSize + totalCssSize) < THRESHOLDS.totalBundle ? '✅' : '❌';
    console.log(`\nOverall Status: ${totalStatus} (limit: ${THRESHOLDS.totalBundle} KB)`);

    // Recommendations
    console.log('\n💡 Optimization Recommendations:');
    console.log('━'.repeat(50));
    
    const largeChunks = jsAnalysis.filter(a => a.status === '❌');
    if (largeChunks.length > 0) {
      console.log('\n🚨 Large chunks detected:');
      largeChunks.forEach(({ file, size, threshold }) => {
        console.log(`   - ${file}: ${size.toFixed(2)} KB (exceeds ${threshold} KB limit)`);
        
        // Specific recommendations
        if (file.includes('ai-libs')) {
          console.log('     → Consider lazy loading AI libraries only when chat is accessed');
        } else if (file.includes('charts')) {
          console.log('     → Load chart libraries only on dashboard/analytics pages');
        } else if (file.includes('editor')) {
          console.log('     → Monaco editor should be loaded on-demand');
        } else if (file.includes('vendor') || file.includes('react-core')) {
          console.log('     → Review dependencies and remove unused imports');
        }
      });
    }

    // Check for duplicate dependencies
    console.log('\n🔍 Checking for optimization opportunities...');
    await checkDuplicateDependencies();

    // Generate detailed report
    await generateReport({
      jsAnalysis,
      totalJsSize,
      totalCssSize,
      timestamp: new Date().toISOString()
    });

    console.log('\n✅ Bundle analysis complete!');
    console.log(`📊 Detailed visualization available at: ${statsPath}`);
    
  } catch (error) {
    console.error('❌ Bundle analysis failed:', error);
    process.exit(1);
  }
}

async function getFilesWithExtension(dir, ext) {
  const files = [];
  
  async function walk(currentDir) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.name.endsWith(ext)) {
        files.push(fullPath);
      }
    }
  }
  
  await walk(dir);
  return files;
}

async function checkDuplicateDependencies() {
  try {
    const { stdout } = await execAsync('npm ls --depth=0 --json', { cwd: rootDir });
    const deps = JSON.parse(stdout);
    
    // Check for common optimization opportunities
    const suggestions = [];
    
    if (deps.dependencies['moment']) {
      suggestions.push('Consider replacing moment.js with date-fns (smaller bundle)');
    }
    
    if (deps.dependencies['lodash']) {
      suggestions.push('Use lodash-es and import specific functions');
    }
    
    if (suggestions.length > 0) {
      console.log('\n💡 Dependency optimization suggestions:');
      suggestions.forEach(s => console.log(`   - ${s}`));
    }
  } catch (error) {
    // Ignore errors in dependency checking
  }
}

async function generateReport(data) {
  const reportPath = path.join(rootDir, 'dist', 'bundle-report.json');
  await fs.writeFile(reportPath, JSON.stringify(data, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
}

// Run the analysis
analyzeBundle();