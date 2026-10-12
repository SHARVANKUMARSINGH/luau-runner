#!/usr/bin/env node

/**
 * Push to GitHub Script
 * 
 * Interactive script that:
 * 1. Asks for a GitHub Personal Access Token (PAT)
 * 2. Creates a new GitHub repository named "Luau-runner" (or custom name)
 * 3. Initializes git, commits all project files, and pushes to GitHub
 * 4. Safely removes the token from local git config after pushing
 */

import readline from 'node:readline';
import { execSync } from 'node:child_process';
import process from 'node:process';

function prompt(question, isPassword = false) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    if (isPassword) {
      // In terminal, show prompt but avoid echoing sensitive tokens
      process.stdout.write(question);
      let input = '';
      
      const onData = (char) => {
        char = char.toString('utf8');
        switch (char) {
          case '\n':
          case '\r':
          case '\u0004':
            process.stdin.removeListener('data', onData);
            break;
          default:
            input += char;
            break;
        }
      };

      rl.question('', (ans) => {
        rl.close();
        resolve(ans.trim());
      });
    } else {
      rl.question(question, (ans) => {
        rl.close();
        resolve(ans.trim());
      });
    }
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
  const repoNameInput = await prompt('\n📁 Repository name [Luau-runner]: ');
  const repoName = repoNameInput.trim() || 'Luau-runner';

  const visibilityInput = await prompt('🔒 Visibility (public / private) [public]: ');
  const isPrivate = visibilityInput.toLowerCase().startsWith('pri');

  console.log(`\n📦 Creating repository "${repoName}" (${isPrivate ? 'Private' : 'Public'})...`);

  // 4. Create Repository via GitHub API
  let repo;
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
      repo = await res.json();
      console.log(`✅ Repository created: ${repo.html_url}`);
    } else if (res.status === 422) {
      console.log(`ℹ️  Repository "${repoName}" already exists on your account.`);
      const useExisting = await prompt('   Push to this existing repository? (y/n) [y]: ');
      if (useExisting && !useExisting.toLowerCase().startsWith('y')) {
        console.log('Aborted.');
        process.exit(0);
      }
      repo = {
        html_url: `https://github.com/${user.login}/${repoName}`,
        clone_url: `https://github.com/${user.login}/${repoName}.git`,
      };
    } else {
      const err = await res.text();
      console.error(`❌ Failed to create repository (${res.status}): ${err}`);
      process.exit(1);
    }
  } catch (e) {
    console.error('❌ Error creating repository:', e.message);
    process.exit(1);
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

  // Ensure git user config
  try {
    run('git config user.name');
  } catch {
    run(`git config user.name "${user.login}"`);
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
  const authenticatedUrl = `https://${token}@github.com/${user.login}/${repoName}.git`;
  const cleanUrl = `https://github.com/${user.login}/${repoName}.git`;

  try {
    run('git remote get-url origin');
    run(`git remote set-url origin "${authenticatedUrl}"`);
  } catch {
    run(`git remote add origin "${authenticatedUrl}"`);
  }

  console.log('🚀 Pushing code to GitHub (main branch)...');
  try {
    run('git push -u origin main');
    console.log('✅ Push successful!');
  } catch (e) {
    console.error('❌ Push failed:', e.message);
    console.log('   Attempting forced push (if repository had existing commits)...');
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
  console.log(`   👉 ${repo.html_url}`);
  console.log('=================================================\n');
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
