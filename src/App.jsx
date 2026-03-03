import { useState } from 'react';
import { ThemeProvider, useTheme } from './utils/ThemeContext';
import TitleBar from './components/Layout/TitleBar';
import Sidebar from './components/Layout/Sidebar';
import TestCaseEngine from './components/TestEngine/TestCaseEngine';
import LogAnalyzer from './components/LogAnalyzer/LogAnalyzer';
import BugReporter from './components/BugReporter/BugReporter';
import './styles/globals.css';

function AppContent() {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('test-engine');
  const [prefillBug, setPrefillBug] = useState(null);

  const handleBugToReporter = (bug) => {
    setPrefillBug(bug);
    setActiveTab('bug-reporter');
  };

  const TAB_LABELS = {
    'test-engine': 'Smart Test Case Engine',
    'log-analyzer': 'Neural Log Analyzer',
    'bug-reporter': 'Automated Bug Reporter',
  };

  return (
    <div className={`flex flex-col h-screen overflow-hidden
      ${isDark ? 'bg-dark-800 text-light-400' : 'bg-light-800 text-dark-800'}`}>

      {/* Title bar */}
      <TitleBar activeTab={TAB_LABELS[activeTab]} />

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar active={activeTab} onChange={setActiveTab} />

        <main className="flex-1 overflow-hidden animate-fadeIn">
          {activeTab === 'test-engine' && <TestCaseEngine />}
          {activeTab === 'log-analyzer' && (
            <LogAnalyzer onBugToReporter={handleBugToReporter} />
          )}
          {activeTab === 'bug-reporter' && (
            <BugReporter
              prefillBug={prefillBug}
              onPrefillUsed={() => setPrefillBug(null)}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
