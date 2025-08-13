#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Running ESLint to identify all errors...');

try {
  // Run ESLint and capture JSON output
  const eslintOutput = execSync('npx eslint . --format json', { 
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'ignore'] // Ignore stderr to avoid error output
  });
  
  const results = JSON.parse(eslintOutput);
  const errors = [];
  
  // Collect all errors
  results.forEach(file => {
    if (file.errorCount > 0) {
      file.messages.forEach(msg => {
        if (msg.severity === 2) { // Error level
          errors.push({
            file: file.filePath.replace(process.cwd(), '.'),
            line: msg.line,
            column: msg.column,
            message: msg.message,
            ruleId: msg.ruleId,
            fix: msg.fix
          });
        }
      });
    }
  });
  
  console.log(`\n📊 Found ${errors.length} errors to fix\n`);
  
  // Group errors by rule
  const errorsByRule = {};
  errors.forEach(error => {
    if (!errorsByRule[error.ruleId]) {
      errorsByRule[error.ruleId] = [];
    }
    errorsByRule[error.ruleId].push(error);
  });
  
  // Display summary
  console.log('🔧 Errors by rule:');
  Object.entries(errorsByRule).forEach(([rule, errs]) => {
    console.log(`  ${rule}: ${errs.length} errors`);
  });
  
  // Auto-fixable errors
  const fixableErrors = errors.filter(e => e.fix);
  if (fixableErrors.length > 0) {
    console.log(`\n🚀 Running ESLint --fix for ${fixableErrors.length} auto-fixable errors...`);
    execSync('npx eslint . --fix', { stdio: 'inherit' });
  }
  
  // Manual fixes needed
  const manualErrors = errors.filter(e => !e.fix);
  if (manualErrors.length > 0) {
    console.log(`\n⚠️  ${manualErrors.length} errors require manual fixes:\n`);
    manualErrors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.file}:${error.line}:${error.column}`);
      console.log(`   Rule: ${error.ruleId}`);
      console.log(`   Message: ${error.message}\n`);
    });
  }
  
  // Re-run to check remaining errors
  console.log('\n🔍 Checking remaining errors after auto-fix...');
  try {
    execSync('npm run lint', { stdio: 'inherit' });
    console.log('\n✅ All ESLint errors fixed!');
  } catch (e) {
    console.log('\n⚠️  Some errors still remain. Please fix them manually.');
  }
  
} catch (error) {
  console.error('Error running ESLint:', error.message);
  process.exit(1);
}