/**
 * Neural Log Analyzer
 * Parses log files locally: extracts timestamps, maps workflows,
 * identifies errors/exceptions/stack traces.
 */

// ── Regex patterns ────────────────────────────────────────────────────────────
const TIMESTAMP_RE = /(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:[.,]\d+)?(?:Z|[+-]\d{2}:?\d{2})?|\d{2}\/\d{2}\/\d{4}\s\d{2}:\d{2}:\d{2}|\d{2}:\d{2}:\d{2}(?:[.,]\d+)?)/i;
const LEVEL_RE = /\b(ERROR|FATAL|CRITICAL|WARN(?:ING)?|INFO|DEBUG|TRACE|SEVERE)\b/i;
const EXCEPTION_RE = /(?:Exception|Error|Fault|Crash|Panic|Traceback|Caused by)[\s:]/i;
const STACK_FRAME_RE = /^\s+at\s+[\w.$<>[\]]+\(.*\)$/m;
const HTTP_RE = /(?:GET|POST|PUT|DELETE|PATCH)\s+(\/[^\s]*)\s+HTTP\/[\d.]+\s+(\d{3})/i;
const REQUEST_ID_RE = /(?:requestId|traceId|correlationId|sessionId|userId)[=:\s]+([a-zA-Z0-9_-]+)/i;

// ── Severity mapping ──────────────────────────────────────────────────────────
const SEVERITY_RANK = { FATAL: 5, CRITICAL: 5, ERROR: 4, SEVERE: 4, WARN: 3, WARNING: 3, INFO: 2, DEBUG: 1, TRACE: 0 };

function getSeverity(levelStr) {
  if (!levelStr) return 0;
  return SEVERITY_RANK[levelStr.toUpperCase()] || 0;
}

// ── Parse a single log line ───────────────────────────────────────────────────
function parseLine(raw, lineNo) {
  const tsMatch = TIMESTAMP_RE.exec(raw);
  const lvMatch = LEVEL_RE.exec(raw);
  const httpMatch = HTTP_RE.exec(raw);
  const reqIdMatch = REQUEST_ID_RE.exec(raw);

  return {
    lineNo,
    raw,
    timestamp: tsMatch ? tsMatch[1] : null,
    level: lvMatch ? lvMatch[1].toUpperCase() : null,
    severity: lvMatch ? getSeverity(lvMatch[1]) : 0,
    isException: EXCEPTION_RE.test(raw),
    isStackFrame: STACK_FRAME_RE.test(raw),
    httpMethod: httpMatch ? httpMatch[0].split(' ')[0] : null,
    httpPath: httpMatch ? httpMatch[1] : null,
    httpStatus: httpMatch ? parseInt(httpMatch[2]) : null,
    requestId: reqIdMatch ? reqIdMatch[1] : null,
    message: raw.replace(TIMESTAMP_RE, '').replace(LEVEL_RE, '').trim(),
  };
}

// ── Group consecutive error + stack frames ───────────────────────────────────
function extractBugs(parsedLines) {
  const bugs = [];
  let current = null;

  parsedLines.forEach((line, i) => {
    if (line.severity >= 4 || line.isException) {
      if (current) bugs.push(current);
      current = {
        id: `BUG-${String(bugs.length + 1).padStart(3, '0')}`,
        level: line.level || 'ERROR',
        title: line.message.slice(0, 120),
        startLine: line.lineNo,
        endLine: line.lineNo,
        timestamp: line.timestamp,
        snippet: [line.raw],
        stackTrace: [],
        requestId: line.requestId,
      };
    } else if (current && (line.isStackFrame || line.isException)) {
      current.endLine = line.lineNo;
      current.snippet.push(line.raw);
      if (line.isStackFrame) current.stackTrace.push(line.raw.trim());
    } else if (current && line.lineNo > current.endLine + 3) {
      bugs.push(current);
      current = null;
    }
  });

  if (current) bugs.push(current);
  return bugs;
}

// ── Build workflow timeline ───────────────────────────────────────────────────
function buildWorkflow(parsedLines) {
  const steps = [];
  let lastTs = null;
  let stepIdx = 0;

  parsedLines.forEach(line => {
    // Only include INFO+ with timestamps or HTTP entries
    if ((line.severity >= 2 || line.httpStatus) && !line.isStackFrame) {
      const ts = line.timestamp || lastTs;
      lastTs = ts || lastTs;

      let action = line.message;
      if (line.httpStatus) {
        const statusLabel = line.httpStatus >= 500 ? '🔴' : line.httpStatus >= 400 ? '🟡' : '🟢';
        action = `${statusLabel} HTTP ${line.httpMethod} ${line.httpPath} → ${line.httpStatus}`;
      }

      // De-dupe consecutive identical steps
      if (steps.length === 0 || steps[steps.length - 1].action !== action) {
        steps.push({
          idx: ++stepIdx,
          timestamp: ts,
          level: line.level || 'INFO',
          action: action.slice(0, 200),
          lineNo: line.lineNo,
        });
      }
    }
  });

  return steps.slice(0, 50); // Cap at 50 workflow steps
}

// ── Stats summary ─────────────────────────────────────────────────────────────
function buildStats(parsedLines, bugs) {
  const counts = { FATAL: 0, CRITICAL: 0, ERROR: 0, WARN: 0, WARNING: 0, INFO: 0, DEBUG: 0 };
  parsedLines.forEach(l => { if (l.level && counts[l.level] !== undefined) counts[l.level]++; });

  const httpErrors = parsedLines.filter(l => l.httpStatus && l.httpStatus >= 400);
  const uniqueRequests = new Set(parsedLines.map(l => l.requestId).filter(Boolean));

  return {
    totalLines: parsedLines.length,
    bugCount: bugs.length,
    errorCount: counts.ERROR + counts.FATAL + counts.CRITICAL,
    warnCount: counts.WARN + counts.WARNING,
    infoCount: counts.INFO,
    httpErrors: httpErrors.length,
    uniqueRequests: uniqueRequests.size,
    timeRange: {
      start: parsedLines.find(l => l.timestamp)?.timestamp || 'N/A',
      end: [...parsedLines].reverse().find(l => l.timestamp)?.timestamp || 'N/A',
    },
  };
}

// ── Main export ───────────────────────────────────────────────────────────────
export function analyzeLog(rawContent) {
  const lines = rawContent.split('\n');
  const parsedLines = lines.map((raw, i) => parseLine(raw, i + 1));
  const bugs = extractBugs(parsedLines);
  const workflow = buildWorkflow(parsedLines);
  const stats = buildStats(parsedLines, bugs);

  return { parsedLines, bugs, workflow, stats };
}

export function getLevelColor(level) {
  const map = {
    FATAL: 'text-accent-red',
    CRITICAL: 'text-accent-red',
    ERROR: 'text-accent-red',
    SEVERE: 'text-accent-red',
    WARN: 'text-accent-amber',
    WARNING: 'text-accent-amber',
    INFO: 'text-accent-cyan',
    DEBUG: 'text-light-400',
    TRACE: 'text-dark-300',
  };
  return map[level] || 'text-gray-400';
}

export function getLevelBg(level) {
  const map = {
    FATAL: 'bg-accent-red/10 border-accent-red/30',
    CRITICAL: 'bg-accent-red/10 border-accent-red/30',
    ERROR: 'bg-accent-red/8 border-accent-red/20',
    WARN: 'bg-accent-amber/10 border-accent-amber/30',
    WARNING: 'bg-accent-amber/10 border-accent-amber/30',
    INFO: 'bg-accent-cyan/5 border-accent-cyan/20',
  };
  return map[level] || 'bg-dark-600 border-dark-400';
}
