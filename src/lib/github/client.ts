/**
 * GitHub API Client
 * Wrapper around Octokit with automatic authentication
 */

import { Octokit } from '@octokit/rest';
import { prisma } from '@/lib/prisma';

export interface GitHubFile {
  path: string;
  content: string;
  sha?: string;
}

export interface GitHubCommit {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
  };
  date: string;
}

export interface GitHubPR {
  number: number;
  title: string;
  body?: string;
  state: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  merged_at?: string | null;
  closed_at?: string | null;
  user: {
    login: string;
    avatar_url: string;
  };
  head: {
    ref: string;
  };
  base: {
    ref: string;
  };
}

/**
 * Get authenticated Octokit client for a user
 */
export async function getGitHubClient(userId: string): Promise<Octokit> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      accounts: {
        where: { provider: 'github' },
        take: 1,
      },
    },
  });

  if (!user?.accounts[0]?.access_token) {
    throw new Error('GitHub account not connected');
  }

  return new Octokit({
    auth: user.accounts[0].access_token,
  });
}

/**
 * Get file content from GitHub
 */
export async function getFileContent(
  octokit: Octokit,
  owner: string,
  repo: string,
  path: string,
  branch = 'main'
): Promise<{ content: string; sha: string }> {
  try {
    const response = await octokit.repos.getContent({
      owner,
      repo,
      path,
      ref: branch,
    });

    if ('content' in response.data && typeof response.data.content === 'string') {
      const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
      return {
        content,
        sha: response.data.sha,
      };
    }

    throw new Error('File not found or is a directory');
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
      throw new Error('File not found on GitHub');
    }
    throw error;
  }
}

/**
 * Create or update file on GitHub
 */
export async function createOrUpdateFile(
  octokit: Octokit,
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string,
  branch = 'main',
  sha?: string
): Promise<{ sha: string; commit: string }> {
  const contentBase64 = Buffer.from(content, 'utf-8').toString('base64');

  const response = await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message,
    content: contentBase64,
    branch,
    ...(sha && { sha }),
  });

  return {
    sha: response.data.content?.sha || '',
    commit: response.data.commit.sha || '',
  };
}

/**
 * Create a new branch
 */
export async function createBranch(
  octokit: Octokit,
  owner: string,
  repo: string,
  newBranch: string,
  fromBranch = 'main'
): Promise<void> {
  // Get the SHA of the base branch
  const { data: ref } = await octokit.git.getRef({
    owner,
    repo,
    ref: `heads/${fromBranch}`,
  });

  // Create new branch
  await octokit.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${newBranch}`,
    sha: ref.object.sha,
  });
}

/**
 * Create a pull request
 */
export async function createPullRequest(
  octokit: Octokit,
  owner: string,
  repo: string,
  title: string,
  head: string,
  base: string,
  body?: string,
  draft = false
): Promise<GitHubPR> {
  const response = await octokit.pulls.create({
    owner,
    repo,
    title,
    head,
    base,
    body,
    draft,
  });

  return response.data as GitHubPR;
}

/**
 * List pull requests
 */
export async function listPullRequests(
  octokit: Octokit,
  owner: string,
  repo: string,
  state: 'open' | 'closed' | 'all' = 'open'
): Promise<GitHubPR[]> {
  const response = await octokit.pulls.list({
    owner,
    repo,
    state,
    per_page: 100,
  });

  return response.data as GitHubPR[];
}

/**
 * Get pull request details
 */
export async function getPullRequest(
  octokit: Octokit,
  owner: string,
  repo: string,
  prNumber: number
): Promise<GitHubPR> {
  const response = await octokit.pulls.get({
    owner,
    repo,
    pull_number: prNumber,
  });

  return response.data as GitHubPR;
}

/**
 * List files changed in a pull request
 */
export async function getPullRequestFiles(
  octokit: Octokit,
  owner: string,
  repo: string,
  prNumber: number
): Promise<string[]> {
  const response = await octokit.pulls.listFiles({
    owner,
    repo,
    pull_number: prNumber,
    per_page: 100,
  });

  return response.data.map((file) => file.filename);
}

/**
 * Check if user has write access to repository
 */
export async function hasWriteAccess(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<boolean> {
  try {
    const { data } = await octokit.repos.get({
      owner,
      repo,
    });

    return data.permissions?.push === true;
  } catch {
    return false;
  }
}

/**
 * Get repository details
 */
export async function getRepository(octokit: Octokit, owner: string, repo: string) {
  const { data } = await octokit.repos.get({
    owner,
    repo,
  });

  return data;
}

/**
 * List user's repositories
 */
export async function listUserRepositories(
  octokit: Octokit,
  affiliation: 'owner' | 'collaborator' | 'organization_member' = 'owner'
) {
  const { data } = await octokit.repos.listForAuthenticatedUser({
    affiliation,
    per_page: 100,
    sort: 'updated',
  });

  return data;
}
