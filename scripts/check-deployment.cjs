#!/usr/bin/env node

const https = require('https');

const REPO_OWNER = 'sayedbaharun';
const REPO_NAME = 'mydub.ai-s0';

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m'
};

function fetchGitHubAPI(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: path,
      headers: {
        'User-Agent': 'Node.js Script',
        'Accept': 'application/vnd.github.v3+json'
      }
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function checkDeployment() {
  try {
    console.log(`\n🔍 Checking deployment status for ${REPO_OWNER}/${REPO_NAME}...\n`);

    // Get latest workflow runs
    const runs = await fetchGitHubAPI(`/repos/${REPO_OWNER}/${REPO_NAME}/actions/runs?per_page=5`);
    
    if (!runs.workflow_runs || runs.workflow_runs.length === 0) {
      console.log('No workflow runs found.');
      return;
    }

    console.log('📋 Recent GitHub Actions runs:\n');
    
    for (const run of runs.workflow_runs) {
      const status = run.status;
      const conclusion = run.conclusion;
      const workflow = run.name;
      const branch = run.head_branch;
      const commit = run.head_sha.substring(0, 7);
      const startTime = new Date(run.created_at);
      const updateTime = new Date(run.updated_at);
      
      let statusIcon = '⏳';
      let statusColor = colors.yellow;
      
      if (status === 'completed') {
        if (conclusion === 'success') {
          statusIcon = '✅';
          statusColor = colors.green;
        } else if (conclusion === 'failure') {
          statusIcon = '❌';
          statusColor = colors.red;
        } else if (conclusion === 'cancelled') {
          statusIcon = '🚫';
          statusColor = colors.gray;
        }
      } else if (status === 'in_progress') {
        statusIcon = '🔄';
        statusColor = colors.blue;
      }
      
      console.log(`${statusIcon} ${statusColor}${workflow}${colors.reset}`);
      console.log(`   Branch: ${branch} | Commit: ${commit}`);
      console.log(`   Status: ${status}${conclusion ? ` (${conclusion})` : ''}`);
      console.log(`   Started: ${startTime.toLocaleString()}`);
      
      if (status === 'in_progress') {
        const duration = Math.floor((Date.now() - startTime.getTime()) / 1000);
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        console.log(`   Duration: ${minutes}m ${seconds}s (running...)`);
      } else {
        const duration = Math.floor((updateTime - startTime) / 1000);
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        console.log(`   Duration: ${minutes}m ${seconds}s`);
      }
      
      console.log(`   URL: https://github.com/${REPO_OWNER}/${REPO_NAME}/actions/runs/${run.id}`);
      console.log();
    }

    // Check latest deployment status
    console.log('\n🚀 Checking Vercel deployments...\n');
    
    // Get latest deployment (using GitHub deployments API)
    const deployments = await fetchGitHubAPI(`/repos/${REPO_OWNER}/${REPO_NAME}/deployments?per_page=5`);
    
    if (deployments && deployments.length > 0) {
      console.log('📦 Recent deployments:\n');
      
      for (const deployment of deployments) {
        const env = deployment.environment;
        const ref = deployment.ref;
        const createdAt = new Date(deployment.created_at);
        
        // Get deployment status
        const statuses = await fetchGitHubAPI(`/repos/${REPO_OWNER}/${REPO_NAME}/deployments/${deployment.id}/statuses`);
        const latestStatus = statuses[0];
        
        if (latestStatus) {
          let statusIcon = '🚀';
          let statusColor = colors.blue;
          
          if (latestStatus.state === 'success') {
            statusIcon = '✅';
            statusColor = colors.green;
          } else if (latestStatus.state === 'failure' || latestStatus.state === 'error') {
            statusIcon = '❌';
            statusColor = colors.red;
          } else if (latestStatus.state === 'pending') {
            statusIcon = '⏳';
            statusColor = colors.yellow;
          }
          
          console.log(`${statusIcon} ${statusColor}${env}${colors.reset} deployment`);
          console.log(`   Branch/Ref: ${ref}`);
          console.log(`   Status: ${latestStatus.state}`);
          console.log(`   Created: ${createdAt.toLocaleString()}`);
          if (latestStatus.environment_url) {
            console.log(`   URL: ${latestStatus.environment_url}`);
          }
          console.log();
        }
      }
    } else {
      console.log('No deployments found via GitHub API.');
      console.log('Note: Vercel deployments might not be visible if not integrated with GitHub deployments API.\n');
    }

    // Summary
    const latestRun = runs.workflow_runs[0];
    if (latestRun) {
      console.log('\n📊 Summary:');
      console.log('─'.repeat(50));
      
      if (latestRun.status === 'in_progress') {
        console.log(`🔄 Build is currently ${colors.blue}IN PROGRESS${colors.reset}`);
        console.log(`⏱️  Started ${Math.floor((Date.now() - new Date(latestRun.created_at).getTime()) / 60000)} minutes ago`);
        console.log(`\n💡 Tip: The deployment usually takes 3-5 minutes.`);
      } else if (latestRun.conclusion === 'success') {
        console.log(`✅ Latest build ${colors.green}SUCCEEDED${colors.reset}`);
        console.log(`🌐 Your app should be live!`);
      } else if (latestRun.conclusion === 'failure') {
        console.log(`❌ Latest build ${colors.red}FAILED${colors.reset}`);
        console.log(`\n💡 Check the workflow logs for error details:`);
        console.log(`   https://github.com/${REPO_OWNER}/${REPO_NAME}/actions/runs/${latestRun.id}`);
      }
    }

  } catch (error) {
    console.error('Error checking deployment:', error.message);
    console.log('\n💡 You can also check manually at:');
    console.log(`   GitHub Actions: https://github.com/${REPO_OWNER}/${REPO_NAME}/actions`);
    console.log(`   Vercel Dashboard: https://vercel.com/dashboard`);
  }
}

// Run check and optionally watch
const args = process.argv.slice(2);
const watchMode = args.includes('--watch') || args.includes('-w');

if (watchMode) {
  console.log('👁️  Watching deployment status (refresh every 30 seconds)...');
  console.log('Press Ctrl+C to stop.\n');
  
  const runCheck = async () => {
    console.clear();
    await checkDeployment();
  };
  
  runCheck();
  setInterval(runCheck, 30000);
} else {
  checkDeployment();
}