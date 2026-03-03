/**
 * Smart Test Case Engine
 * Parses requirement text and generates categorized test cases locally.
 */

const CATEGORIES = ['Functional', 'Edge', 'Negative', 'Security', 'Scalability', 'Boundary'];

// ── Keyword maps for intent detection ─────────────────────────────────────────
const FUNCTIONAL_KEYWORDS = ['should', 'must', 'shall', 'will', 'allow', 'enable', 'provide', 'display', 'create', 'update', 'delete', 'submit', 'login', 'logout', 'upload', 'download', 'search', 'filter', 'sort'];
const SECURITY_KEYWORDS = ['auth', 'password', 'token', 'session', 'encrypt', 'permission', 'role', 'access', 'secure', 'ssl', 'tls', 'user', 'admin', 'privilege', 'credential', 'login'];
const SCALABILITY_KEYWORDS = ['load', 'performance', 'concurrent', 'parallel', 'scale', 'speed', 'throughput', 'capacity', 'limit', 'bulk', 'batch', 'large', 'heavy'];
const BOUNDARY_KEYWORDS = ['min', 'max', 'minimum', 'maximum', 'limit', 'length', 'size', 'range', 'threshold', 'boundary', 'exceed', 'character', 'digit', 'number'];

// ── Template generators ───────────────────────────────────────────────────────
function generateFunctional(req, idx) {
  return [
    {
      id: `TC-F-${idx}01`,
      category: 'Functional',
      title: `Verify: ${req.slice(0, 60)}`,
      preconditions: 'User is authenticated and system is in default state.',
      steps: `1. Navigate to the relevant module.\n2. Perform the action described: "${req}".\n3. Observe system response.`,
      expected: 'System processes the request successfully and provides appropriate confirmation/output.',
      priority: 'High',
      type: 'Positive',
    },
    {
      id: `TC-F-${idx}02`,
      category: 'Functional',
      title: `Validate data persistence after: ${req.slice(0, 45)}`,
      preconditions: 'Database is accessible and test data is pre-loaded.',
      steps: `1. Execute the action: "${req}".\n2. Refresh the page/reload the view.\n3. Verify data is persisted correctly.`,
      expected: 'Data remains consistent across page reloads and sessions.',
      priority: 'High',
      type: 'Positive',
    },
  ];
}

function generateEdge(req, idx) {
  return [
    {
      id: `TC-E-${idx}01`,
      category: 'Edge',
      title: `Empty input handling for: ${req.slice(0, 50)}`,
      preconditions: 'Form/input fields are visible.',
      steps: `1. Leave all required fields empty.\n2. Attempt to submit/execute the action.\n3. Observe error handling.`,
      expected: 'System displays a clear validation error without crashing.',
      priority: 'Medium',
      type: 'Boundary',
    },
    {
      id: `TC-E-${idx}02`,
      category: 'Edge',
      title: `Special characters & unicode in: ${req.slice(0, 45)}`,
      preconditions: 'Input fields accept text.',
      steps: `1. Enter special characters: !@#$%^&*()<>?{}[]|\\;:'"\` and unicode: "日本語テスト\".\n2. Submit.\n3. Observe system response.`,
      expected: 'System either accepts gracefully or rejects with proper error message. No XSS or injection.',
      priority: 'Medium',
      type: 'Negative',
    },
  ];
}

function generateNegative(req, idx) {
  return [
    {
      id: `TC-N-${idx}01`,
      category: 'Negative',
      title: `Invalid data rejection for: ${req.slice(0, 50)}`,
      preconditions: 'User has access to the input form.',
      steps: `1. Enter obviously invalid data (wrong format, type mismatch).\n2. Execute the action.\n3. Check error response.`,
      expected: 'System rejects input with clear, user-friendly error message. No unhandled exceptions.',
      priority: 'High',
      type: 'Negative',
    },
    {
      id: `TC-N-${idx}02`,
      category: 'Negative',
      title: `Unauthorized access attempt: ${req.slice(0, 48)}`,
      preconditions: 'User is logged out or has insufficient permissions.',
      steps: `1. Attempt to access/perform: "${req}" without authentication.\n2. Observe system response.`,
      expected: 'System returns 401/403. User is redirected to login. No data leakage.',
      priority: 'Critical',
      type: 'Negative',
    },
  ];
}

function generateSecurity(req, idx) {
  return [
    {
      id: `TC-S-${idx}01`,
      category: 'Security',
      title: `SQL Injection test on: ${req.slice(0, 52)}`,
      preconditions: 'Input fields are accessible.',
      steps: `1. Enter SQL payload: "' OR '1'='1; DROP TABLE users;--" into input fields.\n2. Submit.\n3. Analyze response and server logs.`,
      expected: 'Input is sanitized. No SQL executed. Error logged server-side without exposing stack trace.',
      priority: 'Critical',
      type: 'Security',
    },
    {
      id: `TC-S-${idx}02`,
      category: 'Security',
      title: `XSS attack vector for: ${req.slice(0, 52)}`,
      preconditions: 'Text input field is present.',
      steps: `1. Enter XSS payload: "<script>alert('XSS')</script>".\n2. Save and reload the page.\n3. Check if script executes.`,
      expected: 'Script is escaped/rejected. No execution. Content Security Policy enforced.',
      priority: 'Critical',
      type: 'Security',
    },
    {
      id: `TC-S-${idx}03`,
      category: 'Security',
      title: `Session token validation: ${req.slice(0, 48)}`,
      preconditions: 'User is authenticated.',
      steps: `1. Capture session token.\n2. Invalidate session server-side.\n3. Replay requests with old token.\n4. Observe response.`,
      expected: 'Old tokens are rejected. Session expiry enforced. Proper 401 returned.',
      priority: 'Critical',
      type: 'Security',
    },
  ];
}

function generateScalability(req, idx) {
  return [
    {
      id: `TC-SC-${idx}01`,
      category: 'Scalability',
      title: `Concurrent users load test: ${req.slice(0, 46)}`,
      preconditions: 'Performance testing environment configured.',
      steps: `1. Simulate 100 concurrent users performing: "${req}".\n2. Monitor response times.\n3. Check for errors under load.`,
      expected: 'Response time < 2s for 95th percentile. Error rate < 1%. No crashes.',
      priority: 'High',
      type: 'Performance',
    },
    {
      id: `TC-SC-${idx}02`,
      category: 'Scalability',
      title: `Bulk data processing: ${req.slice(0, 52)}`,
      preconditions: 'Large dataset (10,000+ records) is available.',
      steps: `1. Execute action with maximum data payload.\n2. Monitor memory usage, CPU, and response time.\n3. Check for timeouts or OOM errors.`,
      expected: 'System handles bulk operations without memory leaks or timeouts within SLA thresholds.',
      priority: 'Medium',
      type: 'Performance',
    },
  ];
}

function generateBoundary(req, idx) {
  return [
    {
      id: `TC-B-${idx}01`,
      category: 'Boundary',
      title: `Maximum length input: ${req.slice(0, 52)}`,
      preconditions: 'Input field with defined max length.',
      steps: `1. Enter exactly the maximum allowed characters.\n2. Submit.\n3. Then enter max+1 characters.\n4. Submit again.`,
      expected: 'Max length accepted. Max+1 rejected with clear message. No truncation without warning.',
      priority: 'Medium',
      type: 'Boundary',
    },
    {
      id: `TC-B-${idx}02`,
      category: 'Boundary',
      title: `Numeric boundary values: ${req.slice(0, 51)}`,
      preconditions: 'Numeric input fields present.',
      steps: `1. Enter: 0, -1, max_int (2147483647), max_int+1, decimals.\n2. Submit each.\n3. Observe behavior.`,
      expected: 'Valid ranges accepted. Out-of-range values rejected with descriptive error. No integer overflow.',
      priority: 'High',
      type: 'Boundary',
    },
  ];
}

// ── Main parser ───────────────────────────────────────────────────────────────
export function parseRequirements(text) {
  if (!text || text.trim().length === 0) return [];

  // Split into individual requirements by lines, bullets, or numbered items
  const lines = text
    .split(/\n|•|·|\d+\.\s/)
    .map(l => l.trim())
    .filter(l => l.length > 10);

  const allTestCases = [];
  const seen = new Set();

  lines.forEach((req, idx) => {
    const lower = req.toLowerCase();
    const i = String(idx + 1).padStart(3, '0');

    // Always generate functional
    generateFunctional(req, i).forEach(tc => allTestCases.push(tc));
    generateEdge(req, i).forEach(tc => allTestCases.push(tc));
    generateNegative(req, i).forEach(tc => allTestCases.push(tc));
    generateBoundary(req, i).forEach(tc => allTestCases.push(tc));

    // Conditional categories
    if (SECURITY_KEYWORDS.some(k => lower.includes(k))) {
      generateSecurity(req, i).forEach(tc => allTestCases.push(tc));
    }
    if (SCALABILITY_KEYWORDS.some(k => lower.includes(k))) {
      generateScalability(req, i).forEach(tc => allTestCases.push(tc));
    }
  });

  return allTestCases;
}

// ── Zoho Sheets CSV export ────────────────────────────────────────────────────
export function exportToZohoCSV(testCases) {
  const headers = [
    'Test Case ID',
    'Category',
    'Title',
    'Type',
    'Priority',
    'Preconditions',
    'Test Steps',
    'Expected Result',
    'Status',
    'Assigned To',
    'Created Date',
    'Notes',
  ];

  const rows = testCases.map(tc => [
    tc.id,
    tc.category,
    tc.title,
    tc.type,
    tc.priority,
    tc.preconditions,
    tc.steps,
    tc.expected,
    'Not Executed',
    '',
    new Date().toISOString().split('T')[0],
    '',
  ]);

  const escape = (v) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = [headers, ...rows].map(row => row.map(escape).join(',')).join('\r\n');
  return csv;
}

export function getCategoryColor(cat) {
  const map = {
    Functional: 'text-accent-blue border-accent-blue bg-accent-blue/10',
    Edge: 'text-accent-amber border-accent-amber bg-accent-amber/10',
    Negative: 'text-accent-red border-accent-red bg-accent-red/10',
    Security: 'text-accent-purple border-accent-purple bg-accent-purple/10',
    Scalability: 'text-accent-green border-accent-green bg-accent-green/10',
    Boundary: 'text-accent-cyan border-accent-cyan bg-accent-cyan/10',
  };
  return map[cat] || 'text-gray-400 border-gray-400 bg-gray-400/10';
}

export function getPriorityColor(p) {
  const map = {
    Critical: 'text-accent-red',
    High: 'text-accent-amber',
    Medium: 'text-accent-cyan',
    Low: 'text-light-400',
  };
  return map[p] || 'text-gray-400';
}

export { CATEGORIES };
