#!/usr/bin/env node
// Local-only diagnostic: never invokes Firebase, authenticates, or sends a log.
// Only selected structured error fields are printed, with common secrets redacted.
import {openSync, closeSync, fstatSync, readSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

export function redact(value) {
  return String(value)
    .replace(/-----BEGIN [^-]*PRIVATE KEY-----[\s\S]*?-----END [^-]*PRIVATE KEY-----/g, '[key omitted]')
    .replace(/\x1b\[[0-?]*[ -/]*[@-~]/g, '')
    .replace(/\bBearer\s+[^\s,;]+/gi, 'Bearer [redacted]')
    .replace(/https?:\/\/[^\s"<>]+/gi, '[URL omitted]')
    .replace(/\b(?:access[_-]?token|refresh[_-]?token|id[_-]?token|client[_-]?secret|password|authorization|cookie|api[_-]?key)\b\s*[:=]\s*(?:"[^"]*"|'[^']*'|[^\s,;]+)/gi, '[credential omitted]')
    .replace(/\b(?:ya29\.[A-Za-z0-9._-]+|AIza[A-Za-z0-9_-]+|sk-[A-Za-z0-9_-]+|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)/g, '[token omitted]')
    .replace(/\b1\/\/[A-Za-z0-9._-]+/g, '[token omitted]')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email omitted]')
    .replace(/[A-Za-z0-9_+\/=.-]{48,}/g, '[opaque value omitted]')
    .replace(/[\x00-\x1f\x7f-\x9f]/g, ' ')
    .slice(0, 1600);
}

export function extractErrors(text) {
  const records = [];
  for (const line of text.split(/\r?\n/)) {
    const start = line.indexOf('{');
    if (start < 0) continue;
    let data;
    try { data = JSON.parse(line.slice(start)); } catch { continue; }
    // Known response wrappers only; do not inspect or print arbitrary header fields.
    const candidates = [data?.error, data?.result?.error, data?.operation?.error];
    for (const error of candidates) {
      if (!error || typeof error !== 'object' || typeof error.message !== 'string') continue;
      const item = {message: redact(error.message)};
      if (Number.isInteger(error.code)) item.code = error.code;
      if (typeof error.status === 'string' && /^[A-Z_]{3,64}$/.test(error.status)) item.status = error.status;
      const reasons = (Array.isArray(error.details) ? error.details : [])
        .map(d => d?.reason).filter(r => typeof r === 'string' && /^[A-Z_]{3,64}$/.test(r));
      if (reasons.length) item.reasons = [...new Set(reasons)];
      records.push(item);
    }
  }
  const distinct = [...new Map(records.map(e => [JSON.stringify(e), e])).values()];
  // Prefer underlying API errors over a later generic CLI wrapper.
  const specific = distinct.filter(e => e.code !== undefined || e.status || e.reasons);
  return (specific.length ? specific : distinct).slice(-3);
}

export function runDiagnostic(path = 'firebase-debug.log') {
  let fd;
  try {
    fd = openSync(path, 'r');
    const stats = fstatSync(fd);
    if (!stats.isFile()) throw new Error('not-file');
    const length = Math.min(stats.size, 2 * 1024 * 1024);
    const buffer = Buffer.alloc(length);
    const count = readSync(fd, buffer, 0, length, stats.size - length);
    const errors = extractErrors(buffer.subarray(0, count).toString('utf8'));
    console.log('Firebase diagnostic — local log only; no cloud changes or network requests.');
    if (!errors.length) {
      console.log('No structured API error was found in the available log. Do not share the full log.');
      console.log('Report this message so the next diagnostic can be chosen.');
      return 2;
    }
    console.log('Selected error fields (common credentials and email addresses redacted):');
    for (const error of errors) console.log(JSON.stringify(error, null, 2));
    console.log('This diagnostic does not establish project ownership, name availability, or a successful deployment.');
    return 0;
  } catch {
    console.error('Could not read firebase-debug.log. Run from the same repository folder as the failed deployment.');
    return 2;
  } finally {
    if (fd !== undefined) closeSync(fd);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = runDiagnostic(process.argv[2]);
}
