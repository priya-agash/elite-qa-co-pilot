import { useState, useCallback } from 'react';
import { useTheme } from '../../utils/ThemeContext';
import { analyzeLog, getLevelColor, getLevelBg } from '../../utils/logAnalyzer';
import { Card, Button, Badge, SectionHeader, StatusDot } from '../Layout/UIKit';

const isElectron = !!window.electronAPI;

function StatCard({ label, value, color, isDark }) {
  return (
    <div className={`rounded-lg p-3 border ${isDark ? 'bg-dark-600 border-dark-400' : 'bg-light-700 border-light-600'}`}>
      <div className={`text-xs font-mono uppercase tracking-wider mb-1 ${isDark ? 'text-dark-300' : 'text-light-400'}`}>
        {label}
      </div>
      <div className={`text-2xl font-display font-bold ${color}`}>{value}</div>
    </div>
  );
}

export default function LogAnalyzer({ onBugToReporter }) {
  const { isDark } = useTheme();
  const [result, setResult] = useState(null);
  const [fileName, setFileName] = useState('');
  const [activeTab, setActiveTab] = useState('workflow');
  const [selectedBug, setSelectedBug] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);

  const processLog = (content, name) => {
    setLoading(true);
    setFileName(name);
    setTimeout(() => {
      const analyzed = analyzeLog(content);
      setResult(analyzed);
      setActiveTab('workflow');
      setSelectedBug(null);
      setLoading(false);
    }, 200);
  };

  const handleFileOpen = async () => {
    if (!isElectron) return;
    const file = await window.electronAPI.openFile([
      { name: 'Log Files', extensions: ['log', 'txt', 'text'] },
    ]);
    if (file) processLog(file.content, file.name);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => processLog(ev.target.result, file.name);
    reader.readAsText(file);
  }, []);

  const handlePaste = (e) => {
    const text = e.clipboardData.getData('text');
    if (text.length > 50) processLog(text, 'pasted-log.txt');
  };

  const copySnippet = (text) => navigator.clipboard.writeText(text);

  const sendToReporter = (bug) => {
    onBugToReporter && onBugToReporter(bug);
  };

  if (!result) {
    return (
      <div className="flex flex-col h-full p-5">
        <SectionHeader
          title="Neural Log Analyzer"
          subtitle="Upload log files to map workflows, detect errors, and extract stack traces"
          icon="🔍"
        />

        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onPaste={handlePaste}
          className={`flex-1 flex flex-col items-center justify-center rounded-xl border-2 border-dashed
            transition-all duration-200 cursor-default
            ${dragging
              ? 'border-accent-cyan bg-accent-cyan/5 scale-[1.01]'
              : isDark ? 'border-dark-400 hover:border-dark-300 bg-dark-700' : 'border-light-600 hover:border-light-500 bg-light-800'
            }`}
        >
          <div className="text-5xl mb-4 opacity-30">📋</div>
          <div className={`text-base font-semibold mb-2 ${isDark ? 'text-light-400' : 'text-dark-700'}`}>
            Drop log file here
          </div>
          <div className={`text-sm mb-6 ${isDark ? 'text-dark-300' : 'text-light-400'}`}>
            Supports .log, .txt — or paste log content (Ctrl+V)
          </div>
          {isElectron && (
            <Button onClick={handleFileOpen} variant="primary" size="md" icon="📂">
              Browse Log File
            </Button>
          )}
          {loading && (
            <div className="mt-4 text-accent-cyan text-sm font-mono animate-pulse">
              Analyzing log...
            </div>
          )}
        </div>
      </div>
    );
  }

  const { stats, workflow, bugs } = result;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className={`flex-shrink-0 p-4 border-b ${isDark ? 'border-dark-400' : 'border-light-600'}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <SectionHeader title="Neural Log Analyzer" icon="🔍" />
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-mono px-2 py-1 rounded ${isDark ? 'bg-dark-600 text-accent-cyan' : 'bg-light-700 text-accent-blue'}`}>
              {fileName}
            </span>
            <Button onClick={() => { setResult(null); setFileName(''); }} variant="secondary" size="sm" icon="✕">
              New
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-2">
          <StatCard label="Total Lines" value={stats.totalLines.toLocaleString()} color={isDark ? 'text-light-400' : 'text-dark-700'} isDark={isDark} />
          <StatCard label="Bugs Found" value={stats.bugCount} color="text-accent-red" isDark={isDark} />
          <StatCard label="Errors" value={stats.errorCount} color="text-accent-amber" isDark={isDark} />
          <StatCard label="Warnings" value={stats.warnCount} color="text-accent-cyan" isDark={isDark} />
          <StatCard label="HTTP Errors" value={stats.httpErrors} color="text-accent-purple" isDark={isDark} />
        </div>

        {stats.timeRange.start !== 'N/A' && (
          <div className={`mt-2 text-xs font-mono ${isDark ? 'text-dark-300' : 'text-light-400'}`}>
            Time range: {stats.timeRange.start} → {stats.timeRange.end}
          </div>
        )}
      </div>

      {/* Tab switcher */}
      <div className={`flex-shrink-0 flex border-b ${isDark ? 'border-dark-400 bg-dark-800' : 'border-light-600 bg-light-700'}`}>
        {[
          { id: 'workflow', label: `Workflow (${workflow.length})`, icon: '🗺' },
          { id: 'bugs', label: `Bugs (${bugs.length})`, icon: '🐛' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 text-sm font-semibold transition-all border-b-2
              ${activeTab === tab.id
                ? 'border-accent-cyan text-accent-cyan'
                : isDark ? 'border-transparent text-dark-300 hover:text-light-400' : 'border-transparent text-light-400 hover:text-dark-700'
              }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">

        {/* Workflow tab */}
        {activeTab === 'workflow' && (
          <div className="space-y-1.5 animate-fadeIn">
            {workflow.length === 0 && (
              <div className={`text-center py-12 text-sm ${isDark ? 'text-dark-300' : 'text-light-400'}`}>
                No significant workflow events detected.
              </div>
            )}
            {workflow.map(step => (
              <div key={step.idx}
                className={`flex items-start gap-3 px-3 py-2 rounded-lg border text-sm
                  ${getLevelBg(step.level)} ${isDark ? '' : 'border-light-600'}`}
              >
                <span className={`text-xs font-mono mt-0.5 w-8 text-right flex-shrink-0 ${isDark ? 'text-dark-300' : 'text-light-400'}`}>
                  {step.idx}
                </span>
                {step.timestamp && (
                  <span className={`text-xs font-mono mt-0.5 flex-shrink-0 w-24 truncate ${isDark ? 'text-dark-300' : 'text-light-400'}`}>
                    {step.timestamp.split('T').pop()?.split('.')[0] || step.timestamp}
                  </span>
                )}
                <span className={`flex-1 font-mono text-xs selectable ${getLevelColor(step.level)}`}>
                  {step.action}
                </span>
                <span className={`text-xs font-mono flex-shrink-0 ${isDark ? 'text-dark-300' : 'text-light-400'}`}>
                  L{step.lineNo}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Bugs tab */}
        {activeTab === 'bugs' && (
          <div className="space-y-3 animate-fadeIn">
            {bugs.length === 0 && (
              <div className={`text-center py-12 ${isDark ? 'text-dark-300' : 'text-light-400'}`}>
                <div className="text-4xl mb-2 opacity-20">✓</div>
                <div className="text-sm">No bugs detected in this log.</div>
              </div>
            )}
            {bugs.map(bug => (
              <Card key={bug.id} className="overflow-hidden">
                <div
                  className="flex items-start justify-between p-3 cursor-pointer gap-3"
                  onClick={() => setSelectedBug(selectedBug?.id === bug.id ? null : bug)}
                >
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <span className={`text-xs font-mono mt-0.5 flex-shrink-0 ${isDark ? 'text-dark-300' : 'text-light-400'}`}>
                      {bug.id}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isDark ? 'text-light-400' : 'text-dark-800'}`}>
                        {bug.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge color={bug.level === 'ERROR' || bug.level === 'FATAL' ? 'red' : 'amber'}>
                          {bug.level}
                        </Badge>
                        {bug.timestamp && (
                          <span className={`text-xs font-mono ${isDark ? 'text-dark-300' : 'text-light-400'}`}>
                            {bug.timestamp}
                          </span>
                        )}
                        <span className={`text-xs font-mono ${isDark ? 'text-dark-300' : 'text-light-400'}`}>
                          Lines {bug.startLine}–{bug.endLine}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <Button
                      onClick={(e) => { e.stopPropagation(); sendToReporter(bug); }}
                      variant="secondary" size="sm" icon="📝"
                    >
                      Report
                    </Button>
                    <Button
                      onClick={(e) => { e.stopPropagation(); copySnippet(bug.snippet.join('\n')); }}
                      variant="ghost" size="sm" icon="⧉"
                    >
                      Copy
                    </Button>
                  </div>
                </div>

                {selectedBug?.id === bug.id && (
                  <div className={`border-t animate-slideUp ${isDark ? 'border-dark-400' : 'border-light-600'}`}>
                    <pre className={`p-3 text-xs font-mono overflow-x-auto selectable leading-relaxed
                      ${isDark ? 'bg-dark-900 text-accent-red/90' : 'bg-red-50 text-red-800'}`}>
                      {bug.snippet.join('\n')}
                    </pre>
                    {bug.stackTrace.length > 0 && (
                      <div className={`p-3 border-t ${isDark ? 'border-dark-400' : 'border-light-600'}`}>
                        <div className={`text-xs font-mono font-bold mb-2 uppercase tracking-wider
                          ${isDark ? 'text-dark-300' : 'text-light-400'}`}>
                          Stack Trace
                        </div>
                        {bug.stackTrace.slice(0, 8).map((f, i) => (
                          <div key={i} className={`text-xs font-mono ${isDark ? 'text-accent-cyan/70' : 'text-blue-600'}`}>
                            {f}
                          </div>
                        ))}
                        {bug.stackTrace.length > 8 && (
                          <div className={`text-xs font-mono ${isDark ? 'text-dark-300' : 'text-light-400'}`}>
                            ... +{bug.stackTrace.length - 8} more frames
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
