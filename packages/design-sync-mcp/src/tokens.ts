import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';
import { repoRoot, tokensSourceDir, tokensBuildFile } from './paths.js';

export interface FlatToken {
  name: string;
  type: 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN';
  value: string | number | boolean;
}

function latestSourceMtime(): number {
  return readdirSync(tokensSourceDir)
    .filter((file) => file.endsWith('.json'))
    .map((file) => statSync(path.join(tokensSourceDir, file)).mtimeMs)
    .reduce((latest, mtime) => Math.max(latest, mtime), 0);
}

function isStale(): boolean {
  if (!existsSync(tokensBuildFile)) {
    return true;
  }
  return latestSourceMtime() > statSync(tokensBuildFile).mtimeMs;
}

/**
 * Always returns tokens fresh from the source JSON — rebuilds packages/tokens
 * first if any source file has changed since the last build, so callers never
 * see a stale snapshot.
 */
export function loadTokens(): FlatToken[] {
  if (isStale()) {
    execFileSync('npm', ['run', 'build', '-w', 'packages/tokens'], {
      cwd: repoRoot,
      stdio: 'ignore'
    });
  }

  return JSON.parse(readFileSync(tokensBuildFile, 'utf8')) as FlatToken[];
}

export interface TokenDiff {
  onlyInProject: FlatToken[];
  onlyInFigma: FlatToken[];
  changed: Array<{ name: string; project: FlatToken; figma: FlatToken }>;
}

/**
 * Compares the project's tokens against a caller-supplied snapshot of Figma's
 * current variables (same { name, type, value } shape — normalize colors to
 * hex and dimensions to plain numbers before calling this).
 */
export function diffTokens(figmaVariables: FlatToken[]): TokenDiff {
  const projectTokens = loadTokens();
  const projectByName = new Map(projectTokens.map((token) => [token.name, token]));
  const figmaByName = new Map(figmaVariables.map((token) => [token.name, token]));

  const onlyInProject = projectTokens.filter((token) => !figmaByName.has(token.name));
  const onlyInFigma = figmaVariables.filter((token) => !projectByName.has(token.name));
  const changed = projectTokens.flatMap((project) => {
    const figma = figmaByName.get(project.name);
    if (!figma) {
      return [];
    }
    return figma.type !== project.type || figma.value !== project.value ? [{ name: project.name, project, figma }] : [];
  });

  return { onlyInProject, onlyInFigma, changed };
}
