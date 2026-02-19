import { Octokit } from '@octokit/rest';
import crypto from 'crypto';

export interface GitHubConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export function createGitHubClient(accessToken?: string) {
  return new Octokit({
    auth: accessToken || process.env.GITHUB_TOKEN,
  });
}

export async function getRepositoryContent(
  owner: string,
  repo: string,
  path: string = '',
  accessToken?: string
) {
  const octokit = createGitHubClient(accessToken);

  try {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path,
    });

    return data;
  } catch (error) {
    console.error('Error fetching repository content:', error);
    throw error;
  }
}

export async function getRepositoryTree(
  owner: string,
  repo: string,
  branch: string = 'main',
  accessToken?: string
) {
  const octokit = createGitHubClient(accessToken);

  try {
    const { data: refData } = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${branch}`,
    });

    const { data: treeData } = await octokit.git.getTree({
      owner,
      repo,
      tree_sha: refData.object.sha,
      recursive: 'true',
    });

    return treeData.tree;
  } catch (error) {
    console.error('Error fetching repository tree:', error);
    throw error;
  }
}

export async function getFileContent(
  owner: string,
  repo: string,
  path: string,
  accessToken?: string
): Promise<{ content: string; sha: string } | null> {
  const octokit = createGitHubClient(accessToken);

  try {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path,
    });

    if ('content' in data && 'sha' in data) {
      return {
        content: Buffer.from(data.content, 'base64').toString('utf-8'),
        sha: data.sha,
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching file content:', error);
    return null;
  }
}

export async function listUserRepositories(accessToken: string) {
  const octokit = createGitHubClient(accessToken);

  try {
    const { data } = await octokit.repos.listForAuthenticatedUser({
      sort: 'updated',
      per_page: 100,
    });

    return data;
  } catch (error) {
    console.error('Error listing repositories:', error);
    throw error;
  }
}

// OAuth Functions
export function generateGitHubAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID || '',
    redirect_uri: process.env.GITHUB_REDIRECT_URI || '',
    scope: 'repo,user:email,read:user',
    state,
  });

  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string): Promise<{
  access_token: string;
  scope: string;
  token_type: string;
}> {
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: process.env.GITHUB_REDIRECT_URI,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to exchange code for token');
  }

  return response.json();
}

export async function getAuthenticatedUser(accessToken: string): Promise<{
  login: string;
  id: number;
  avatar_url: string;
  name: string | null;
  email: string | null;
}> {
  const octokit = createGitHubClient(accessToken);
  const { data } = await octokit.users.getAuthenticated();
  return data;
}

// File Operations
export async function createOrUpdateFile(
  accessToken: string,
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string,
  branch: string = 'main',
  sha?: string
): Promise<{
  commit: { sha: string };
  content: { sha: string };
}> {
  const octokit = createGitHubClient(accessToken);

  const contentBase64 = Buffer.from(content, 'utf-8').toString('base64');

  const { data } = await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message,
    content: contentBase64,
    branch,
    sha,
  });

  return data as { commit: { sha: string }; content: { sha: string } };
}

export async function deleteFile(
  accessToken: string,
  owner: string,
  repo: string,
  path: string,
  message: string,
  sha: string,
  branch: string = 'main'
): Promise<void> {
  const octokit = createGitHubClient(accessToken);

  await octokit.repos.deleteFile({
    owner,
    repo,
    path,
    message,
    sha,
    branch,
  });
}

export async function getFileCommits(
  accessToken: string,
  owner: string,
  repo: string,
  path: string,
  branch: string = 'main'
): Promise<
  Array<{
    sha: string;
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
  }>
> {
  const octokit = createGitHubClient(accessToken);

  const { data } = await octokit.repos.listCommits({
    owner,
    repo,
    path,
    sha: branch,
    per_page: 10,
  });

  return data.map((commit) => ({
    sha: commit.sha,
    message: commit.commit.message,
    author: {
      name: commit.commit.author?.name || 'Unknown',
      email: commit.commit.author?.email || '',
      date: commit.commit.author?.date || new Date().toISOString(),
    },
  }));
}

// Content Conversion
export function generateContentHash(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

export function htmlToMarkdown(html: string): string {
  let markdown = html;

  markdown = markdown
    .replace(/<p[^>]*>(.*?)<\/p>/g, '$1\n\n')
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<strong[^>]*>(.*?)<\/strong>/g, '**$1**')
    .replace(/<b[^>]*>(.*?)<\/b>/g, '**$1**')
    .replace(/<em[^>]*>(.*?)<\/em>/g, '*$1*')
    .replace(/<i[^>]*>(.*?)<\/i>/g, '*$1*')
    .replace(/<u[^>]*>(.*?)<\/u>/g, '<u>$1</u>')
    .replace(/<code[^>]*>(.*?)<\/code>/g, '`$1`')
    .replace(/<h1[^>]*>(.*?)<\/h1>/g, '# $1\n\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/g, '## $1\n\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/g, '### $1\n\n')
    .replace(/<h4[^>]*>(.*?)<\/h4>/g, '#### $1\n\n')
    .replace(/<h5[^>]*>(.*?)<\/h5>/g, '##### $1\n\n')
    .replace(/<h6[^>]*>(.*?)<\/h6>/g, '###### $1\n\n')
    .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/g, '[$2]($1)')
    .replace(/<ul[^>]*>(.*?)<\/ul>/gs, '$1')
    .replace(/<ol[^>]*>(.*?)<\/ol>/gs, '$1')
    .replace(/<li[^>]*>(.*?)<\/li>/g, '- $1\n')
    .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gs, '> $1\n')
    .replace(/<pre[^>]*>(.*?)<\/pre>/gs, '```\n$1\n```\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return markdown;
}

export function markdownToHtml(markdown: string): string {
  let html = markdown;

  html = html
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
    .replace(/^##### (.*$)/gim, '<h5>$1</h5>')
    .replace(/^###### (.*$)/gim, '<h6>$1</h6>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
    .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
    .replace(/^- (.*$)/gim, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(.+)$/gim, '<p>$1</p>')
    .replace(/<\/p><p><h/g, '</p><h')
    .replace(/<\/h([1-6])><p>/g, '</h$1>')
    .trim();

  return html;
}
