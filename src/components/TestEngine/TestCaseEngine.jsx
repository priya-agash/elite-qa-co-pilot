import { useState, useMemo } from 'react';
import { useTheme } from '../../utils/ThemeContext';
import { parseRequirements, exportToZohoCSV, getCategoryColor, getPriorityColor, CATEGORIES } from '../../utils/testCaseEngine';
import { Card, Button, TextArea, Badge, SectionHeader, Select } from '../Layout/UIKit';

const isElectron = !!window.electronAPI;

export default function TestCaseEngine() {
  const { isDark } = useTheme();
  const [requirementText, setRequirementText] = useState('');
  const [testCases, setTestCases] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exportStatus, setExportStatus] = useState('');

  const handleGenerate = () => {
    if (!requirementText.trim()) return;
    setLoading(true);
    setTimeout(() => {
      const cases = parseRequirements(requirementText);
      setTestCases(cases);
      setActiveFilter('All');
      setLoading(false);
    }, 300);
  };

  const handleFileOpen = async () => {
    if (!isElectron) return;
    const file = await window.electronAPI.openFile([
      { name: 'Text Files', extensions: ['txt', 'pdf', 'md'] },
    ]);
    if (file) setRequirementText(file.content);
  };

  const filtered = useMemo(() => {
    if (activeFilter === 'All') return testCases;
    return testCases.filter(tc => tc.category === activeFilter);
  }, [testCases, activeFilter]);

  const counts = useMemo(() => {
    const c = { All: testCases.length };
    CATEGORIES.forEach(cat => {
      c[cat] = testCases.filter(tc => tc.category === cat).length;
    });
    return c;
  }, [testCases]);

  const handleExport = async (format = 'csv') => {
    if (testCases.length === 0) return;
    const csv = exportToZohoCSV(format === 'all' ? testCases : filtered);
    const timestamp = new Date().toISOString().split('T')[0];
    const defaultName = `ZohoQA_TestCases_${timestamp}.csv`;

    if (isElectron) {
      const saved = await window.electronAPI.saveFile({
        defaultName,
        content: csv,
        filters: [{ name: 'CSV', extensions: ['csv'] }],
      });
      if (saved) setExportStatus(`✓ Exported to ${saved.split('\\').pop()}`);
    } else {
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = defaultName; a.click();
      setExportStatus('✓ Downloaded');
    }
    setTimeout(() => setExportStatus(''), 3000);
  };

  const catColorMap = {
    Functional: 'blue', Edge: 'amber', Negative: 'red',
    Security: 'purple', Scalability: 'green', Boundary: 'cyan',
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top input panel */}
      <div className={`p-5 border-b flex-shrink-0 ${isDark ? 'border-dark-400' : 'border-light-600'}`}>
        <SectionHeader
          title="Smart Test Case Engine"
          subtitle="Paste requirements or load a document — generate categorized test cases instantly"
          icon="⚡"
          action={
            <div className="flex gap-2">
              {isElectron && (
                <Button onClick={handleFileOpen} variant="secondary" size="sm" icon="📂">
                  Load File
                </Button>
              )}
              <Button
                onClick={handleGenerate}
                disabled={!requirementText.trim() || loading}
                variant="primary"
                size="sm"
                icon={loading ? '⟳' : '▶'}
              >
                {loading ? 'Generating...' : 'Generate'}
              </Button>
            </div>
          }
        />

        <TextArea
          value={requirementText}
          onChange={e => setRequirementText(e.target.value)}
          placeholder={`Paste your requirement change set here...\n\nExample:\n• User must be able to login with email and password\n• System shall validate password complexity (min 8 chars, 1 number, 1 special char)\n• Session must expire after 30 minutes of inactivity\n• Admin users can access bulk data export functionality`}
          rows={5}
          className="text-xs"
        />
      </div>

      {/* Results area */}
      {testCases.length > 0 && (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Filter bar + export */}
          <div className={`flex items-center justify-between px-5 py-3 border-b flex-shrink-0
            ${isDark ? 'border-dark-400 bg-dark-800' : 'border-light-600 bg-light-700'}`}>

            <div className="flex items-center gap-1.5 flex-wrap">
              {['All', ...CATEGORIES].map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold font-mono transition-all
                    ${activeFilter === cat
                      ? (cat === 'All' ? 'bg-accent-cyan text-dark-900' : getCategoryColor(cat))
                      : (isDark ? 'text-dark-300 hover:text-light-400 bg-dark-600' : 'text-light-400 hover:text-dark-700 bg-light-600')
                    }`}
                >
                  {cat} {counts[cat] > 0 ? `(${counts[cat]})` : ''}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {exportStatus && (
                <span className="text-xs text-accent-green font-mono">{exportStatus}</span>
              )}
              <Button onClick={() => handleExport('current')} variant="success" size="sm" icon="📊">
                Export to Zoho CSV
              </Button>
              <Button onClick={() => handleExport('all')} variant="secondary" size="sm" icon="⬇">
                All ({testCases.length})
              </Button>
            </div>
          </div>

          {/* Test cases list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 animate-fadeIn">
            {filtered.map(tc => (
              <Card key={tc.id}
                className={`cursor-pointer transition-all duration-150
                  ${expandedId === tc.id ? 'ring-1 ring-accent-cyan/30' : ''}`}
              >
                <div
                  onClick={() => setExpandedId(expandedId === tc.id ? null : tc.id)}
                  className="flex items-start justify-between p-3 gap-3"
                >
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <span className={`text-xs font-mono mt-0.5 flex-shrink-0 ${isDark ? 'text-dark-300' : 'text-light-400'}`}>
                      {tc.id}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium leading-snug truncate
                        ${isDark ? 'text-light-400' : 'text-dark-800'}`}>
                        {tc.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge color={catColorMap[tc.category]}>{tc.category}</Badge>
                        <span className={`text-xs font-mono ${getPriorityColor(tc.priority)}`}>
                          {tc.priority}
                        </span>
                        <span className={`text-xs ${isDark ? 'text-dark-300' : 'text-light-400'}`}>
                          {tc.type}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className={`text-xs flex-shrink-0 mt-1 ${isDark ? 'text-dark-300' : 'text-light-400'}`}>
                    {expandedId === tc.id ? '▲' : '▼'}
                  </span>
                </div>

                {expandedId === tc.id && (
                  <div className={`border-t px-4 pb-4 pt-3 space-y-3 animate-slideUp
                    ${isDark ? 'border-dark-400' : 'border-light-600'}`}>
                    {[
                      ['Preconditions', tc.preconditions],
                      ['Test Steps', tc.steps],
                      ['Expected Result', tc.expected],
                    ].map(([label, val]) => (
                      <div key={label}>
                        <div className={`text-xs font-semibold font-mono mb-1 uppercase tracking-wider
                          ${isDark ? 'text-dark-300' : 'text-light-400'}`}>
                          {label}
                        </div>
                        <p className={`text-xs leading-relaxed selectable whitespace-pre-line
                          ${isDark ? 'text-light-400' : 'text-dark-700'}`}>
                          {val}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))}

            {filtered.length === 0 && (
              <div className={`text-center py-12 text-sm ${isDark ? 'text-dark-300' : 'text-light-400'}`}>
                No test cases match this filter.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {testCases.length === 0 && !loading && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="text-5xl opacity-20">⚡</div>
          <div className={`text-sm ${isDark ? 'text-dark-300' : 'text-light-400'}`}>
            Paste requirements above and click Generate
          </div>
          <div className="flex gap-2">
            {CATEGORIES.map(cat => (
              <Badge key={cat} color={catColorMap[cat]}>{cat}</Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
