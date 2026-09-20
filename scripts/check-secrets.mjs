#!/usr/bin/env node
/**
 * Secret scanner.
 *
 * Refuses to let a credential reach the repository. It runs as the first step
 * of `pnpm verify`, so a change that carries a password, a key or a live
 * connection string fails before anything else is checked.
 *
 * What it looks for:
 *   - files that should never be committed at all (.env and friends),
 *   - connection strings carrying a real password,
 *   - private keys, cloud access keys and common provider tokens,
 *   - secret-named variables assigned a credential-shaped literal,
 *   - database credentials exposed through a NEXT_PUBLIC_ variable,
 *   - values left in .env.example, which must document names only.
 *
 * It reports the file, the line and the name of the offending variable -
 * never the value. A scanner that echoed the secret it found would write it
 * into CI logs, which is the problem it exists to prevent.
 *
 * The assignment rule is deliberately narrow. It fires only on a quoted
 * literal that looks like a credential: long enough, no spaces, mixed
 * character classes, and not an identifier, enum member, URL or path.
 * Reading a value from the environment - the pattern the whole project uses
 * - never matches. A scanner that cries wolf is one people learn to skip.
 *
 * Usage:
 *   node scripts/check-secrets.mjs            scan the repository
 *   node scripts/check-secrets.mjs --staged   scan what is staged for commit
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const STAGED = process.argv.includes('--staged');
const NUL = String.fromCharCode(0);
const NEWLINE = String.fromCharCode(10);

/** Directories never worth scanning: generated, vendored or enormous. */
const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  '.next',
  '.turbo',
  'dist',
  'build',
  'out',
  'coverage',
  '.pnpm-store',
  'test-results',
  'playwright-report',
  'uploads',
]);

/** File types a secret could plausibly be committed in. */
const SCAN_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.json',
  '.yaml',
  '.yml',
  '.md',
  '.sql',
  '.prisma',
  '.css',
  '.html',
  '.sh',
  '.env',
  '.example',
  '.toml',
  '.txt',
]);

/** Files that must never be committed, whatever they contain. */
const FORBIDDEN_FILES = [
  /(^|\/)\.env$/,
  /(^|\/)\.env\.local$/,
  /(^|\/)\.env\.development$/,
  /(^|\/)\.env\.production$/,
  /(^|\/)\.env\.[^/]*\.local$/,
  /(^|\/)id_rsa$/,
  /(^|\/)id_ed25519$/,
  /\.pem$/,
  /\.pfx$/,
  /\.p12$/,
  /\.keystore$/,
];

/** Words that make a variable name worth inspecting. */
const SECRET_NAME =
  /^[A-Za-z0-9_.]*(password|passwd|secret|token|api[_-]?key|apikey|access[_-]?key|private[_-]?key|credential|auth[_-]?token|client[_-]?secret|session[_-]?secret|encryption[_-]?key)[A-Za-z0-9_.]*$/i;

/**
 * Passwords that are obviously stand-ins rather than credentials. A sample
 * connection string in a test or a document needs one of these.
 */
const PLACEHOLDER_PASSWORD =
  /^(placeholder|changeme|change-me|change_me|example|sample|secret|password|passwd|pass|test|dummy|fake|redacted|xxx+|\*+|\.\.\.|\$\{[^}]*\}|<[^>]*>)$/i;

const RULES = [
  {
    id: 'private-key',
    description: 'A private key block.',
    test: (line) => /-----BEGIN (RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----/.test(line),
  },
  {
    id: 'connection-string-password',
    description:
      'A connection string carrying a password. Build the URL from environment variables instead.',
    test: (line) => {
      const match =
        /\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis|amqp):\/\/[^\s:'"`@/]+:([^\s'"`@/]+)@/i.exec(
          line,
        );
      if (!match) return false;
      const password = match[1];
      // A variable reference is the correct form, not a leak.
      if (password.startsWith('$') || password.startsWith('%')) return false;
      if (PLACEHOLDER_PASSWORD.test(password)) return false;
      // One or two characters is a stand-in, not a password anyone chose.
      return password.length > 2;
    },
  },
  {
    id: 'aws-access-key',
    description: 'An AWS access key id.',
    test: (line) => /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/.test(line),
  },
  {
    id: 'github-token',
    description: 'A GitHub token.',
    test: (line) => /\bgh[pousr]_[A-Za-z0-9]{36,}\b/.test(line),
  },
  {
    id: 'slack-token',
    description: 'A Slack token.',
    test: (line) => /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/.test(line),
  },
  {
    id: 'stripe-key',
    description: 'A Stripe secret key.',
    test: (line) => /\bsk_(?:live|test)_[A-Za-z0-9]{16,}\b/.test(line),
  },
  {
    id: 'google-api-key',
    description: 'A Google API key.',
    test: (line) => /\bAIza[0-9A-Za-z_-]{35}\b/.test(line),
  },
  {
    id: 'json-web-token',
    description: 'A signed JSON Web Token.',
    test: (line) => /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/.test(line),
  },
  {
    id: 'public-database-variable',
    description:
      'A database or secret value exposed through a NEXT_PUBLIC_ variable, which is compiled into the browser bundle.',
    test: (line) =>
      /NEXT_PUBLIC_[A-Z0-9_]*(?:DATABASE|DB_|PASSWORD|SECRET|PRIVATE_KEY)[A-Z0-9_]*/.test(line),
  },
];

/**
 * An inline waiver. A line carrying this marker, or following one, is not
 * scanned. It is for the rare case where the literal is the point of the
 * code - a test proving a password is redacted needs a password to redact.
 */
const SUPPRESSED = /check-secrets-ignore/;

/**
 * Files exempt from the pattern rules, each for a stated reason.
 *
 * An exception is a decision on the record. Widening a pattern so one file
 * passes would weaken that rule everywhere else.
 */
const EXEMPT = new Map([
  ['scripts/check-secrets.mjs', 'The scanner necessarily contains the patterns it searches for.'],
]);

function relativePath(absolute) {
  return relative(ROOT, absolute).split(sep).join('/');
}

async function walk(dir, files = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      await walk(join(dir, entry.name), files);
    } else if (entry.isFile()) {
      files.push(join(dir, entry.name));
    }
  }
  return files;
}

function gitFiles(staged) {
  try {
    const args = staged ? ['diff', '--cached', '--name-only', '--diff-filter=ACMR'] : ['ls-files'];
    return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' })
      .split(/\r?\n/)
      .filter(Boolean)
      .map((file) => join(ROOT, file));
  } catch {
    return null;
  }
}

/**
 * Paths git is told to ignore.
 *
 * Used when scanning the working tree, where `.env` is expected to exist and
 * expected to be ignored. An ignored file cannot leak by being committed, so
 * flagging it would be noise; a file of the same name that is *not* ignored
 * is exactly what this scanner is for.
 */
function ignoredPaths(files) {
  const ignored = new Set();
  if (files.length === 0) return ignored;
  try {
    const output = execFileSync('git', ['check-ignore', '--stdin'], {
      cwd: ROOT,
      encoding: 'utf8',
      input: files.map(relativePath).join(NEWLINE),
    });
    for (const line of output.split(/\r?\n/)) {
      if (line) ignored.add(join(ROOT, line));
    }
  } catch {
    // `git check-ignore` exits non-zero when nothing matched, which is fine.
  }
  return ignored;
}

function shouldScan(file) {
  const index = file.lastIndexOf('.');
  const extension = index === -1 ? '' : file.slice(index).toLowerCase();
  if (SCAN_EXTENSIONS.has(extension)) return true;
  return /(^|[\\/])\.env(\.|$)/.test(file);
}

/** Shannon entropy per character, used to tell a credential from a word. */
function entropy(value) {
  const counts = new Map();
  for (const character of value) counts.set(character, (counts.get(character) ?? 0) + 1);
  let bits = 0;
  for (const count of counts.values()) {
    const probability = count / value.length;
    bits -= probability * Math.log2(probability);
  }
  return bits;
}

/**
 * True when a literal looks like a credential rather than a word, an
 * identifier, a URL, a path or a message.
 */
function looksLikeCredential(value) {
  if (value.length < 12 || value.length > 200) return false;
  if (/\s/.test(value)) return false;
  // An identifier, an enum member or a constant name.
  if (/^[A-Z][A-Z0-9_]*$/.test(value)) return false;
  if (/^[a-z][a-zA-Z0-9]*$/.test(value)) return false;
  if (/^[a-z0-9]+(?:[-_][a-z0-9]+)+$/.test(value)) return false;
  // A URL, a path, a media type or a template expression.
  if (/^(?:https?:|\/|\.\/|\.\.\/|data:|[a-z]+\/[a-z]+$)/i.test(value)) return false;
  if (value.includes('${') || value.includes('process.env')) return false;
  // A credential mixes character classes; a sentence fragment does not.
  const classes =
    Number(/[A-Za-z]/.test(value)) +
    Number(/[0-9]/.test(value)) +
    Number(/[^A-Za-z0-9]/.test(value));
  if (classes < 2) return false;
  return entropy(value) >= 3.2;
}

/**
 * Finds `NAME = 'literal'` or `name: "literal"` where the name sounds like a
 * secret and the literal looks like one. Anything unquoted is an expression,
 * not a hardcoded value, so it is left alone.
 */
function findHardcodedSecret(line) {
  const pattern = /([A-Za-z0-9_.]+)\s*[:=]\s*(['"])([^'"]*)\2/g;
  let match;
  while ((match = pattern.exec(line)) !== null) {
    const [, name, , value] = match;
    if (!SECRET_NAME.test(name)) continue;
    if (PLACEHOLDER_PASSWORD.test(value)) continue;
    if (looksLikeCredential(value)) return name;
  }

  // The same thing in dotenv form: SECRET_NAME=value, usually unquoted.
  const env = /^\s*(?:export\s+)?([A-Z][A-Z0-9_]*)\s*=\s*([^\s#]+)\s*$/.exec(line);
  if (env && SECRET_NAME.test(env[1])) {
    const value = env[2].replace(/^(['"])(.*)\1$/, '$2');
    if (!PLACEHOLDER_PASSWORD.test(value) && looksLikeCredential(value)) return env[1];
  }

  return null;
}

function scanFile(absolute) {
  const file = relativePath(absolute);
  const findings = [];

  for (const pattern of FORBIDDEN_FILES) {
    if (pattern.test(file)) {
      return [
        {
          file,
          line: 0,
          rule: 'committed-secret-file',
          detail: 'This file holds real values and must never be committed. Keep it ignored.',
        },
      ];
    }
  }

  if (EXEMPT.has(file)) return findings;
  if (!shouldScan(absolute)) return findings;

  try {
    if (statSync(absolute).size > 2_000_000) return findings;
  } catch {
    return findings;
  }

  let text;
  try {
    text = readFileSync(absolute, 'utf8');
  } catch {
    return findings;
  }
  // A NUL byte means the file is binary, whatever its extension claims.
  if (text.includes(NUL)) return findings;

  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    if (line.length > 4000) return;
    // An explicit, reviewable waiver: a line carrying `check-secrets-ignore`,
    // or following one, is not scanned.
    if (SUPPRESSED.test(line) || (index > 0 && SUPPRESSED.test(lines[index - 1]))) return;

    for (const rule of RULES) {
      if (rule.test(line)) {
        findings.push({ file, line: index + 1, rule: rule.id, detail: rule.description });
      }
    }

    const name = findHardcodedSecret(line);
    if (name) {
      findings.push({
        file,
        line: index + 1,
        rule: 'hardcoded-secret',
        // The variable name, never the value.
        detail: `"${name}" is assigned a literal that looks like a credential. Read it from the environment instead.`,
      });
    }
  });

  return findings;
}

/** `.env.example` documents variable names; every secret value must be empty. */
function scanEnvExample() {
  const findings = [];
  const file = '.env.example';
  let text;
  try {
    text = readFileSync(join(ROOT, file), 'utf8');
  } catch {
    return findings;
  }

  text.split(/\r?\n/).forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    const equals = trimmed.indexOf('=');
    if (equals <= 0) return;

    const name = trimmed.slice(0, equals).trim();
    const value = trimmed
      .slice(equals + 1)
      .trim()
      .replace(/^(['"])(.*)\1$/, '$2');
    if (!value) return;
    if (!SECRET_NAME.test(name) && !/DATABASE_URL|DIRECT_URL/.test(name)) return;
    // A numeric setting such as PASSWORD_HASH_ROUNDS is configuration, and
    // documenting its default is what the example file is for.
    if (/^\d+(?:\.\d+)?$/.test(value)) return;
    if (PLACEHOLDER_PASSWORD.test(value)) return;

    findings.push({
      file,
      line: index + 1,
      rule: 'value-in-the-example-file',
      detail: `"${name}" must be left empty in the example file.`,
    });
  });

  return findings;
}

async function main() {
  const tracked = gitFiles(STAGED);

  if (STAGED && tracked === null) {
    console.error('check-secrets: --staged needs a git repository.');
    process.exit(2);
  }

  /*
    Prefer what git knows about. Before the first commit it knows about
    nothing, and a scanner reporting "0 files, nothing found" would pass
    `pnpm verify` without having looked at anything - so fall back to the
    working tree, minus whatever git is told to ignore.
  */
  let files;
  let usedGit = true;
  if (tracked && tracked.length > 0) {
    files = tracked;
  } else {
    usedGit = false;
    const walked = await walk(ROOT);
    const ignored = ignoredPaths(walked);
    files = walked.filter((file) => !ignored.has(file));
  }

  const findings = [];
  for (const file of files) findings.push(...scanFile(file));
  findings.push(...scanEnvExample());

  const scope = usedGit
    ? STAGED
      ? 'staged files'
      : 'tracked files'
    : 'files in the working tree (git tracks nothing yet)';

  if (findings.length === 0) {
    console.log(`check-secrets: ${files.length} ${scope} scanned, nothing found.`);
    return;
  }

  console.error(`check-secrets: ${findings.length} finding(s) across ${files.length} ${scope}.`);
  console.error('');
  for (const finding of findings) {
    const where = finding.line ? `${finding.file}:${finding.line}` : finding.file;
    console.error(`  ${where}`);
    console.error(`    [${finding.rule}] ${finding.detail}`);
  }
  console.error('');
  console.error('No value is printed above, on purpose. Move the value into the environment,');
  console.error('rotate it if it was ever committed, and keep .env.example to names only.');
  process.exit(1);
}

main().catch((error) => {
  console.error(`check-secrets: ${error instanceof Error ? error.message : 'failed'}`);
  process.exit(2);
});
