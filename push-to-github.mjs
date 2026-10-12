#!/usr/bin/env node

/**
 * Push to GitHub Script
 * 
 * Interactive script that:
 * 1. Asks for a GitHub Personal Access Token (PAT)
 * 2. Creates or connects to a GitHub repository named "luau-runner" (or custom name)
 * 3. Sanitizes repository names (replaces spaces with hyphens)
 * 4. Configures HTTP/1.1 to prevent HTTP/2 PROTOCOL_ERROR
 * 5. Commits and pushes all project files to GitHub
 * 6. Safely cleans the token from git config after pushing
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
  console.log('   🚀 Push Luau Runner to GitHub Repository');
  console.log('=================================================\n');

  // 1. Get GitHub Token
  let token = process.env.GITHUB_TOKEN?.trim();

  if (!token) {
    console.log('ℹ️  You need a GitHub Personal Access Token (classic or fine-grained)');
    console.log('   with "repo" permissions to create and push repositories.');
    console.log('   (Generate one at: https://github.com/settings/tokens)\n');
    token = await prompt('🔑 Enter your GitHub Personal Access Token: ');
  }

  if (!token) {
    console.error('❌ Error: Personal Access Token is required.');
    process.exit(1);
  }

  console.log('\n🔍 Verifying GitHub Token with API...');

  // 2. Validate token and get user info
  let user;
  try {
    const res = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'Luau-Runner-Uploader',
        Accept: 'application/vnd.github+json',
      },
    });

    if (res.status === 401) {
      console.error('❌ Error: Invalid Personal Access Token (Bad credentials).');
      process.exit(1);
    }

    if (!res.ok) {
      const err = await res.text();
      console.error(`❌ Error verifying token (${res.status}): ${err}`);
      process.exit(1);
    }

    user = await res.json();
    console.log(`✅ Authenticated as: @${user.login} (${user.name || user.login})`);
  } catch (e) {
    console.error('❌ Connection error to GitHub API:', e.message);
    process.exit(1);
  }

  // 3. Repository Name & Visibility
  const repoNameInput = await prompt('\n📁 Repository name [luau-runner]: ');
  // Sanitize repo name: replace spaces and invalid characters with hyphens
  let rawName = repoNameInput.trim() || 'luau-runner';
  let repoName = rawName.replace(/[\s_]+/g, '-').replace(/[^a-zA-Z0-9.-]/g, '');

  if (repoName !== rawName) {
    console.log(`ℹ️  Sanitized repository name for GitHub: "${repoName}"`);
  }

  const visibilityInput = await prompt('🔒 Visibility (public / private) [public]: ');
  const isPrivate = visibilityInput.toLowerCase().startsWith('pri');

  console.log(`\n📦 Checking / Creating repository "${repoName}" (${isPrivate ? 'Private' : 'Public'})...`);

  // 4. Create Repository via GitHub API or use existing
  let actualRepoName = repoName;
  let repoUrl = `https://github.com/${user.login}/${repoName}`;

  try {
    const res = await fetch('https://api.github.com/user/repos', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'Luau-Runner-Uploader',
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: repoName,
        description: 'Online Luau Runner — Professional Roblox Scripting IDE with real WebAssembly execution',
        private: isPrivate,
        auto_init: false,
      }),
    });

    if (res.status === 201) {
      const data = await res.json();
      actualRepoName = data.name;
      repoUrl = data.html_url;
      console.log(`✅ Repository created: ${repoUrl}`);
    } else if (res.status === 422) {
      console.log(`ℹ️  Repository "${repoName}" already exists on your GitHub account.`);
      actualRepoName = repoName;
      repoUrl = `https://github.com/${user.login}/${actualRepoName}`;
    } else {
      const err = await res.text();
      console.warn(`⚠️ API response (${res.status}): ${err}`);
      console.log(`   Proceeding with repository URL: ${repoUrl}`);
    }
  } catch (e) {
    console.warn('⚠️ GitHub API check warning:', e.message);
    console.log(`   Proceeding with repository URL: ${repoUrl}`);
  }

  // 5. Git setup and commit
  console.log('\n⚙️  Setting up local Git repository...');

  // Initialize git if not already
  try {
    run('git status');
  } catch {
    console.log('   Initializing git repository (git init)...');
    run('git init');
  }

  // Configure HTTP/1.1 to prevent HTTP/2 stream PROTOCOL_ERROR
  run('git config http.version HTTP/1.1');
  run('git config http.postBuffer 524288000');

  // Ensure git user config
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

  // Stage all files
  console.log('   Staging all project files (git add .)...');
  run('git add .');

  // Commit if changes exist
  const status = run('git status --porcelain');
  if (status) {
    console.log('   Creating commit...');
    run('git commit -m "Initial commit: Online Luau Runner for Roblox"');
  } else {
    console.log('   All files already committed.');
  }

  // Ensure branch is main
  run('git branch -M main');

  // 6. Set authenticated remote and push
  console.log('   Configuring remote origin...');
  const encodedToken = encodeURIComponent(token);
  const authenticatedUrl = `https://${encodedToken}@github.com/${user.login}/${actualRepoName}.git`;
  const cleanUrl = `https://github.com/${user.login}/${actualRepoName}.git`;

  try {
    run('git remote get-url origin');
    run(`git remote set-url origin "${authenticatedUrl}"`);
  } catch {
    run(`git remote add origin "${authenticatedUrl}"`);
  }

  console.log(`🚀 Pushing code to https://github.com/${user.login}/${actualRepoName} (main branch)...`);
  try {
    run('git push -u origin main');
    console.log('✅ Push successful!');
  } catch (e) {
    console.warn('⚠️ Normal push output:', e.message);
    console.log('   Attempting force push (if remote repository had existing content)...');
    try {
      run('git push -u origin main --force');
      console.log('✅ Push successful (forced)!');
    } catch (e2) {
      console.error('❌ Could not push to repository:', e2.message);
      // Clean token before exiting
      run(`git remote set-url origin "${cleanUrl}"`);
      process.exit(1);
    }
  } finally {
    // SECURITY: Clean sensitive token from git config
    try {
      run(`git remote set-url origin "${cleanUrl}"`);
    } catch {
      // Ignore
    }
  }

  console.log('\n=================================================');
  console.log('   🎉 ALL DONE! Your repository is live at:');
  console.log(`   👉 ${repoUrl}`);
  console.log('=================================================\n');
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
