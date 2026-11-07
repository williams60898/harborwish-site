// Stage 8 switch: the quiz (/test/, /api/questions, /api/score) exists only where this is true.
// Changing QUIZ_PUBLIC or this logic needs the owner's approval (see CLAUDE.md).

const PREVIEW_SUFFIX = '-harborwish-site.williams60898.workers.dev';
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1']);

export interface QuizGateEnv {
  QUIZ_PUBLIC?: string;
}

/**
 * On when QUIZ_PUBLIC is "on" (reserved for launch day). Otherwise only on branch/version preview
 * hosts (`*-harborwish-site.williams60898.workers.dev`) and localhost / 127.0.0.1.
 * The production hosts (harborwish-site.williams60898.workers.dev, harborwish.com,
 * www.harborwish.com) never match, so they stay off.
 */
export function isQuizEnabled(request: Request, env: QuizGateEnv | undefined): boolean {
  if (env?.QUIZ_PUBLIC === 'on') return true;
  let host: string;
  try {
    host = new URL(request.url).hostname.toLowerCase();
  } catch {
    return false;
  }
  if (LOCAL_HOSTS.has(host)) return true;
  return host.endsWith(PREVIEW_SUFFIX) && host.length > PREVIEW_SUFFIX.length;
}

/** Hosts where the Turnstile hostname comparison is skipped (official test keys report example.com). */
export const isLocalHost = (host: string) => LOCAL_HOSTS.has(host.toLowerCase());
