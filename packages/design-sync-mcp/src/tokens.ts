import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';
import { repoRoot, tokensSourceDir, tokensBuildFile } from './paths.js';

export type TokenValue = string | number | boolean;

export interface FlatToken {
  name: string;
  type: 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN';
  values: {
    light: TokenValue;
    dark: TokenValue;
  };
}

/** Recursively finds every .json file under dir — tokens now live nested under global/semantic/component. */
function findJsonFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return findJsonFiles(entryPath);
    }
    return entry.name.endsWith('.json') ? [entryPath] : [];
  });
}

function latestSourceMtime(): number {
  return findJsonFiles(tokensSourceDir)
    .map((file) => statSync(file).mtimeMs)
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
 * see a stale snapshot. Each token carries both light and dark values (equal
 * to each other for tokens with no dark override).
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
  changed: Array<{ name: string; mode: 'light' | 'dark'; project: TokenValue; figma: TokenValue }>;
}

/**
 * Compares the project's tokens against a caller-supplied snapshot of Figma's
 * current variables (same { name, type, values: { light, dark } } shape —
 * read each variable's value for both the Light and Dark mode IDs in the
 * collection, normalize colors to hex and dimensions to plain numbers).
 * Light and dark are diffed independently, so a token that's only wrong in
 * one mode doesn't get reported as if the whole token were broken.
 */
export function diffTokens(figmaVariables: FlatToken[]): TokenDiff {
  const projectTokens = loadTokens();
  const projectByName = new Map(projectTokens.map((token) => [token.name, token]));
  const figmaByName = new Map(figmaVariables.map((token) => [token.name, token]));

  const onlyInProject = projectTokens.filter((token) => !figmaByName.has(token.name));
  const onlyInFigma = figmaVariables.filter((token) => !projectByName.has(token.name));

  const changed = projectTokens.flatMap((project) => {
    const figma = figmaByName.get(project.name);
    if (!figma || figma.type !== project.type) {
      return [];
    }

    const diffs: TokenDiff['changed'] = [];
    if (figma.values.light !== project.values.light) {
      diffs.push({ name: project.name, mode: 'light', project: project.values.light, figma: figma.values.light });
    }
    if (figma.values.dark !== project.values.dark) {
      diffs.push({ name: project.name, mode: 'dark', project: project.values.dark, figma: figma.values.dark });
    }
    return diffs;
  });

  return { onlyInProject, onlyInFigma, changed };
}
