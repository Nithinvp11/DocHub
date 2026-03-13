import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Octokit } from '@octokit/rest';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { decryptToken } from '@/lib/encryption';
import { WORKSPACE_PERMISSION } from '@/lib/workspace-permission-definitions';
import { assertPermission, WorkspacePermissionError } from '@/lib/workspace-permissions';

const snippetSchema = z.object({
  workspaceId: z.string().min(1),
  pathSpec: z.string().min(1),
  branch: z.string().optional(),
});

function parsePathSpec(pathSpec: string): {
  path: string;
  startLine?: number;
  endLine?: number;
} {
  const trimmed = pathSpec.trim();
  const match = trimmed.match(/^(?<path>[^#]+?)(?:#L(?<start>\d+)(?:-L?(?<end>\d+))?)?$/i);

  if (!match?.groups?.path) {
    return { path: trimmed };
  }

  const path = match.groups.path;
  const startLine = match.groups.start ? Number(match.groups.start) : undefined;
  const endLine = match.groups.end ? Number(match.groups.end) : startLine;

  return { path, startLine, endLine };
}

function getLanguageFromPath(path: string): string {
  const extension = path.split('.').pop()?.toLowerCase();
  if (!extension) return 'text';

  const map: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    py: 'python',
    java: 'java',
    cs: 'csharp',
    cpp: 'cpp',
    c: 'c',
    go: 'go',
    rs: 'rust',
    rb: 'ruby',
    php: 'php',
    swift: 'swift',
    kt: 'kotlin',
    sql: 'sql',
    sh: 'bash',
    ps1: 'powershell',
    yml: 'yaml',
    yaml: 'yaml',
    json: 'json',
    md: 'markdown',
    html: 'html',
    css: 'css',
    scss: 'scss',
    xml: 'xml',
    dockerfile: 'dockerfile',
  };

  return map[extension] || extension;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { workspaceId, pathSpec, branch } = snippetSchema.parse(body);

    await assertPermission(user.id, workspaceId, WORKSPACE_PERMISSION.GITHUB_VIEW);

    const integration = await prisma.workspaceGitHubIntegration.findUnique({
      where: { workspaceId },
      select: {
        repository: true,
        branch: true,
      },
    });

    if (!integration?.repository) {
      return NextResponse.json({ error: 'GitHub integration not configured' }, { status: 400 });
    }

    const githubAuth = await prisma.gitHubAuth.findUnique({
      where: { userId_workspaceId: { userId: user.id, workspaceId } },
      select: { accessToken: true },
    });

    if (!githubAuth?.accessToken) {
      return NextResponse.json({ error: 'GitHub account not connected' }, { status: 400 });
    }

    const [owner, repo] = integration.repository.split('/');
    if (!owner || !repo) {
      return NextResponse.json({ error: 'Invalid repository configuration' }, { status: 400 });
    }

    const token = decryptToken(githubAuth.accessToken);
    const octokit = new Octokit({ auth: token });

    const parsed = parsePathSpec(pathSpec);
    const normalizedPath = parsed.path.replace(/^\/+/, '');

    const response = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: normalizedPath,
      ref: branch || integration.branch || 'main',
    });

    if (Array.isArray(response.data) || !('content' in response.data)) {
      return NextResponse.json({ error: 'Path is a directory, not a file' }, { status: 400 });
    }

    const fileContent = Buffer.from(response.data.content, 'base64').toString('utf-8');
    const allLines = fileContent.split(/\r?\n/);

    let snippet = fileContent;
    let startLine: number | undefined;
    let endLine: number | undefined;

    if (parsed.startLine) {
      startLine = Math.max(1, parsed.startLine);
      endLine = Math.max(startLine, parsed.endLine || parsed.startLine);
      snippet = allLines.slice(startLine - 1, endLine).join('\n');
    }

    const language = getLanguageFromPath(normalizedPath);
    const selectedBranch = branch || integration.branch || 'main';

    return NextResponse.json({
      repository: integration.repository,
      branch: selectedBranch,
      path: normalizedPath,
      language,
      content: snippet,
      startLine,
      endLine,
      sha: response.data.sha,
      url: `https://github.com/${owner}/${repo}/blob/${selectedBranch}/${normalizedPath}${startLine ? `#L${startLine}${endLine ? `-L${endLine}` : ''}` : ''}`,
    });
  } catch (error) {
    if (error instanceof WorkspacePermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
    }

    console.error('[GitHub Snippet API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch GitHub code snippet' }, { status: 500 });
  }
}
