import { useState, useEffect } from 'react';
import { useTheme } from '../../utils/ThemeContext';
import { generateBugReport, prefillFromBug, SEVERITY_OPTIONS, PRIORITY_OPTIONS, ENV_OPTIONS } from '../../utils/bugReporter';
import { Card, Button, TextArea, Input, Select, SectionHeader, Badge } from '../Layout/UIKit';

const isElectron = !!window.electronAPI;

const EMPTY_FORM = {
  testingBuild: '',
  serverUrl: '',
  environment: '',
  module: '',
  issueDetails: '',
  stepsToReproduce: '',
  expectedResult: '',
  actualResult: '',
  logEvidence: '',
  severity: 'High',
  priority: 'P2 - High',
  reporter: '',
  assignee: '',
};

export default function BugReporter({ prefillBug, onPrefillUsed }) {
  const { isDark } = useTheme();
  const [form, setForm] = useState(EMPTY_FORM);
  const [preview, setPreview] = useState('');
  const [exportStatus, setExportStatus] = useState('');
  const [copied, setCopied] = useState(false);
  const [view, setView] = useState('form'); // 'form' | 'preview'

  useEffect(() => {
    if (prefillBug) {
      const prefilled = prefillFromBug(prefillBug);
      setForm(prev => ({ ...prev, ...prefilled }));
      setView('form');
      onPrefillUsed && onPrefillUsed();
    }
  }, [prefillBug]);

  const set = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));

  const handleGenerate = () => {
    const { report } = generateBugReport(form);
    setPreview(report);
    setView('preview');
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(preview);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = async () => {
    const timestamp = new Date().toISOString().split('T')[0];
    const defaultName = `BugReport_${timestamp}.txt`;
    if (isElectron) {
      const saved = await window.electronAPI.saveFile({
        defaultName,
        content: preview,
        filters: [{ name: 'Text File', extensions: ['txt'] }],
      });
      if (saved) setExportStatus(`✓ Saved: ${saved.split('\\').pop()}`);
    } else {
      const blob = new Blob([preview], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = defaultName; a.click();
      setExportStatus('✓ Downloaded');
    }
    setTimeout(() => setExportStatus(''), 3000);
  };

  const handleReset = () => { setForm(EMPTY_FORM); setPreview(''); setView('form'); };

  const isFormValid = form.issueDetails.trim() && form.stepsToReproduce.trim() && form.expectedResult.trim();

  const fieldClass = `mb-4`;
  const labelClass = `block text-xs font-semibold font-mono uppercase tracking-wider mb-1.5 ${isDark ? 'text-dark-300' : 'text-light-400'}`;
  const requiredStar = <span className="text-accent-red ml-0.5">*</span>;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className={`flex-shrink-0 p-4 border-b ${isDark ? 'border-dark-400' : 'border-light-600'}`}>
        <div className="flex items-center justify-between">
          <SectionHeader
            title="Automated Bug Reporter"
            subtitle="Generate structured enterprise bug reports with log evidence"
            icon="🐛"
          />
          <div className="flex items-center gap-2">
            {prefillBug && (
              <Badge color="amber">Pre-filled from Log Analyzer</Badge>
            )}
            <div className={`flex rounded-lg border overflow-hidden ${isDark ? 'border-dark-400' : 'border-light-600'}`}>
              {['form', 'preview'].map(v => (
                <button key={v} onClick={() => setView(v)}
                  className={`px-4 py-1.5 text-xs font-semibold capitalize transition-colors
                    ${view === v
                      ? 'bg-accent-cyan text-dark-900'
                      : isDark ? 'bg-dark-700 text-dark-300 hover:text-light-400' : 'bg-light-700 text-light-400 hover:text-dark-700'
                    }`}>
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {view === 'form' ? (
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-0 divide-x h-full" style={{ gridTemplateColumns: '1fr 1fr' }}>

            {/* Left column: Build info + classification */}
            <div className={`p-5 ${isDark ? 'divide-dark-400' : 'divide-light-600'}`}>
              <div className={`text-xs font-mono font-bold uppercase tracking-widest mb-4 ${isDark ? 'text-accent-cyan' : 'text-accent-blue'}`}>
                ◈ Build Information
              </div>

              <div className={fieldClass}>
                <label className={labelClass}>Testing Build {requiredStar}</label>
                <Input value={form.testingBuild} onChange={set('testingBuild')} placeholder="e.g. v2.4.1-rc3, build #1092" />
              </div>
              <div className={fieldClass}>
                <label className={labelClass}>Testing Server URL {requiredStar}</label>
                <Input value={form.serverUrl} onChange={set('serverUrl')} placeholder="https://staging.app.com" />
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className={labelClass}>Environment</label>
                  <Select value={form.environment} onChange={set('environment')}
                    options={['', ...ENV_OPTIONS].map(v => ({ value: v, label: v || 'Select...' }))} className="w-full" />
                </div>
                <div>
                  <label className={labelClass}>Module / Feature</label>
                  <Input value={form.module} onChange={set('module')} placeholder="e.g. Auth, Dashboard" />
                </div>
              </div>

              <div className={`border-t pt-4 mt-2 ${isDark ? 'border-dark-400' : 'border-light-600'}`}>
                <div className={`text-xs font-mono font-bold uppercase tracking-widest mb-4 ${isDark ? 'text-accent-amber' : 'text-amber-600'}`}>
                  ◈ Classification
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className={labelClass}>Severity</label>
                    <Select value={form.severity} onChange={set('severity')}
                      options={SEVERITY_OPTIONS.map(v => ({ value: v, label: v }))} className="w-full" />
                  </div>
                  <div>
                    <label className={labelClass}>Priority</label>
                    <Select value={form.priority} onChange={set('priority')}
                      options={PRIORITY_OPTIONS.map(v => ({ value: v, label: v }))} className="w-full" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Reporter</label>
                    <Input value={form.reporter} onChange={set('reporter')} placeholder="Your name" />
                  </div>
                  <div>
                    <label className={labelClass}>Assigned To</label>
                    <Input value={form.assignee} onChange={set('assignee')} placeholder="Developer name" />
                  </div>
                </div>
              </div>
            </div>

            {/* Right column: Issue details */}
            <div className={`p-5 ${isDark ? 'border-dark-400' : 'border-light-600'}`}>
              <div className={`text-xs font-mono font-bold uppercase tracking-widest mb-4 ${isDark ? 'text-accent-red' : 'text-accent-red'}`}>
                ◈ Issue Details
              </div>

              <div className={fieldClass}>
                <label className={labelClass}>Issue Details {requiredStar}</label>
                <TextArea value={form.issueDetails} onChange={set('issueDetails')}
                  placeholder="Describe the issue clearly and concisely..." rows={3} />
              </div>
              <div className={fieldClass}>
                <label className={labelClass}>Steps to Reproduce {requiredStar}</label>
                <TextArea value={form.stepsToReproduce} onChange={set('stepsToReproduce')}
                  placeholder="1. Navigate to...\n2. Click on...\n3. Observe..." rows={4} />
              </div>
              <div className={fieldClass}>
                <label className={labelClass}>Expected Result {requiredStar}</label>
                <TextArea value={form.expectedResult} onChange={set('expectedResult')}
                  placeholder="What should happen?" rows={2} />
              </div>
              <div className={fieldClass}>
                <label className={labelClass}>Actual Result {requiredStar}</label>
                <TextArea value={form.actualResult} onChange={set('actualResult')}
                  placeholder="What actually happened?" rows={2} />
              </div>
              <div className={fieldClass}>
                <label className={labelClass}>Log Evidence</label>
                <TextArea value={form.logEvidence} onChange={set('logEvidence')}
                  placeholder="Paste log trace from Neural Log Analyzer (auto-filled when sent from analyzer)..." rows={4}
                  className="font-mono text-xs" />
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Preview */
        <div className="flex-1 overflow-y-auto p-5">
          {preview ? (
            <pre className={`text-xs font-mono leading-relaxed whitespace-pre-wrap selectable rounded-xl p-5 border
              ${isDark ? 'bg-dark-900 border-dark-400 text-light-400' : 'bg-gray-50 border-light-600 text-dark-800'}`}>
              {preview}
            </pre>
          ) : (
            <div className={`flex flex-col items-center justify-center h-full gap-3 ${isDark ? 'text-dark-300' : 'text-light-400'}`}>
              <div className="text-4xl opacity-20">📄</div>
              <div className="text-sm">Fill the form and click Generate Report</div>
            </div>
          )}
        </div>
      )}

      {/* Footer action bar */}
      <div className={`flex-shrink-0 flex items-center justify-between px-5 py-3 border-t
        ${isDark ? 'border-dark-400 bg-dark-800' : 'border-light-600 bg-light-700'}`}>
        <div className="flex items-center gap-2">
          {exportStatus && <span className="text-xs text-accent-green font-mono">{exportStatus}</span>}
          {preview && (
            <>
              <Button onClick={handleCopy} variant="secondary" size="sm" icon={copied ? '✓' : '⧉'}>
                {copied ? 'Copied!' : 'Copy Report'}
              </Button>
              <Button onClick={handleExport} variant="success" size="sm" icon="💾">
                Export .txt
              </Button>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleReset} variant="ghost" size="sm" icon="↺">Reset</Button>
          <Button
            onClick={handleGenerate}
            disabled={!isFormValid}
            variant="primary"
            size="sm"
            icon="▶"
          >
            Generate Report
          </Button>
        </div>
      </div>
    </div>
  );
}
