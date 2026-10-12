#!/usr/bin/env node

/**
 * Update GitHub Repository Script
 * 
 * Usage:
 *   1. Interactive:
 *      ./update-github.sh
 *      npm run update-repo
 * 
 *   2. With token argument:
 *      ./update-github.sh <YOUR_GITHUB_TOKEN> "Optional commit message"
 * 
 *   3. With environment variable:
 *      GITHUB_TOKEN="ghp_xxx" ./update-github.sh
 */

import readline from 'node:readline';
import { execSync } from 'node:child_process';
import process from 'node:process';

function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (ans) => {
      rl.close();
      resolve(ans.trim());
    });
  });
}

function run(cmd, options = {}) {
  try {
    return execSync(cmd, { stdio: 'pipe', encoding: 'utf8', ...options }).trim();
  } catch (error) {
    throw new Error(error.stderr?.toString() || error.message);
  }
}

async function main() {
  console.log('\n=================================================');
  console.log('   🔄 Update GitHub Repository — Luau Runner');
  console.log('=================================================\n');

  // 1. Get current Git remote origin
  let remoteUrl = '';
  try {
    remoteUrl = run('git remote get-url origin');
  } catch {
    remoteUrl = 'https://github.com/SHARVANKUMARSINGH/luau-runner.git';
  }

  // Extract owner and repo from URL
  let repoOwner = 'SHARVANKUMARSINGH';
  let repoName = 'luau-runner';

  const match = remoteUrl.match(/github\.com[/:]([^/]+)\/([^/.]+)/);
  if (match) {
    repoOwner = match[1];
    repoName = match[2];
  }

  console.log(`📁 Target repository: https://github.com/${repoOwner}/${repoName}\n`);

  // 2. Obtain Token (from argv[2], env, or prompt)
  const args = process.argv.slice(2);
  let token = args[0] || process.env.GITHUB_TOKEN?.trim();

  if (!token) {
    console.log('ℹ️  Provide a GitHub Personal Access Token with "repo" permissions.');
    token = await prompt('🔑 Enter your GitHub Personal Access Token: ');
  }

  if (!token) {
    console.error('❌ Error: Personal Access Token is required to push updates.');
    process.exit(1);
  }

  // 3. Verify Token
  console.log('🔍 Verifying GitHub Token with API...');
  let user;
  try {
    const res = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'Luau-Runner-Updater',
        Accept: 'application/vnd.github+json',
      },
    });

    if (res.status === 401) {
      console.error('❌ Error: Invalid Personal Access Token (Bad credentials).');
      process.exit(1);
    }

    if (!res.ok) {
      const err = await res.text();
      console.error(`❌ Token check failed (${res.status}): ${err}`);
      process.exit(1);
    }

    user = await res.json();
    console.log(`✅ Authenticated as: @${user.login} (${user.name || user.login})`);
  } catch (e) {
    console.error('❌ Connection error to GitHub API:', e.message);
    process.exit(1);
  }

  // 4. Configure Git settings (HTTP/1.1 to prevent HTTP/2 PROTOCOL_ERROR)
  console.log('\n⚙️  Configuring Git network parameters (HTTP/1.1)...');
  run('git config http.version HTTP/1.1');
  run('git config http.postBuffer 524288000');

  try {
    run('git config user.name');
  } catch {
    run(`git config user.name "${user.name || user.login}"`);
  }

  try {
    run('git config user.email');
  } catch {
    const email = user.email || `${user.login}@users.noreply.github.com`;
    run(`git config user.email "${email}"`);
  }

  // 5. Stage and Commit changes if any exist
  console.log('📦 Checking for modified or new files...');
  run('git add .');

  const pendingChanges = run('git status --porcelain');
  if (pendingChanges) {
    let commitMsg = args[1] || '';
    if (!commitMsg) {
      commitMsg = await prompt('📝 Commit message [Update Luau Runner]: ');
    }
    if (!commitMsg.trim()) {
      commitMsg = 'Update Luau Runner: bug fixes and improvements';
    }

    console.log(`   Committing changes: "${commitMsg}"...`);
    run(`git commit -m "${commitMsg.replace(/"/g, '\\"')}"`);
    console.log('   ✅ Changes committed successfully.');
  } else {
    console.log('   ℹ️  Working tree is clean. Pushing existing local commits...');
  }

  // Ensure branch is main
  run('git branch -M main');

  // 6. Push to GitHub with authenticated URL
  const cleanUrl = `https://github.com/${repoOwner}/${repoName}.git`;
  const encodedToken = encodeURIComponent(token);
  const authenticatedUrl = `https://${encodedToken}@github.com/${repoOwner}/${repoName}.git`;

  console.log(`\n🚀 Pushing code to https://github.com/${repoOwner}/${repoName} (main branch)...`);

  try {
    run(`git remote set-url origin "${authenticatedUrl}"`);
  } catch {
    run(`git remote add origin "${authenticatedUrl}"`);
  }

  try {
    run('git push -u origin main');
    console.log('✅ Push succeeded!');
  } catch (err) {
    console.warn('⚠️ Standard push failed, checking if remote requires merge or force push...');
    console.log('   Error details:', err.message);
    
    const tryForce = await prompt('Force push to overwrite remote branch? (y/N): ');
    if (tryForce.toLowerCase().startsWith('y')) {
      try {
        run('git push -u origin main --force');
        console.log('✅ Force push succeeded!');
      } catch (err2) {
        console.error('❌ Force push failed:', err2.message);
        process.exit(1);
      }
    } else {
      console.log('❌ Push aborted.');
      process.exit(1);
    }
  } finally {
    // SECURITY: Always clean sensitive token from git remote config
    try {
      run(`git remote set-url origin "${cleanUrl}"`);
    } catch {
      // Ignore
    }
  }

  console.log('\n=================================================');
  console.log('   🎉 REPOSITORY UPDATED SUCCESSFULLY!');
  console.log(`   👉 https://github.com/${repoOwner}/${repoName}`);
  console.log('=================================================\n');
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
