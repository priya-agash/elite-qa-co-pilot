import { useState, useEffect } from 'react';
import { useTheme } from '../../utils/ThemeContext';

const isElectron = !!window.electronAPI;

export default function TitleBar({ activeTab }) {
  const { isDark, toggle } = useTheme();
  const [isMax, setIsMax] = useState(false);

  useEffect(() => {
    if (!isElectron) return;
    window.electronAPI.isMaximized().then(setIsMax);
    window.electronAPI.onMaximized(setIsMax);
  }, []);

  const tabs = ['Test Engine', 'Log Analyzer', 'Bug Reporter'];

  return (
    <div className={`flex items-center justify-between h-10 px-4 select-none drag-region z-50
      ${isDark ? 'bg-dark-800 border-b border-dark-400' : 'bg-light-700 border-b border-light-600'}`}>

      {/* Left: Logo + app name */}
      <div className="flex items-center gap-2 no-drag">
        <div className="w-6 h-6 rounded flex items-center justify-center bg-gradient-to-br from-accent-cyan to-accent-blue">
          <span className="text-xs font-bold text-dark-900">Q</span>
        </div>
        <span className={`font-display text-xs font-bold tracking-widest uppercase
          ${isDark ? 'text-light-400' : 'text-dark-300'}`}>
          Elite QA Co-Pilot
        </span>
        <span className={`text-xs px-1.5 py-0.5 rounded font-mono
          ${isDark ? 'bg-dark-500 text-accent-cyan' : 'bg-light-600 text-accent-blue'}`}>
          v1.0
        </span>
      </div>

      {/* Center: Current tab indicator */}
      <div className={`absolute left-1/2 -translate-x-1/2 text-xs font-display tracking-widest uppercase
        ${isDark ? 'text-dark-300' : 'text-light-500'}`}>
        {activeTab}
      </div>

      {/* Right: Theme + window controls */}
      <div className="flex items-center gap-1 no-drag">
        {/* Theme toggle */}
        <button
          onClick={toggle}
          className={`w-7 h-7 rounded flex items-center justify-center text-xs transition-colors
            ${isDark ? 'hover:bg-dark-500 text-light-400' : 'hover:bg-light-600 text-dark-400'}`}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? '☀' : '◑'}
        </button>

        {isElectron && (
          <>
            {/* Minimize */}
            <button
              onClick={() => window.electronAPI.minimizeWindow()}
              className={`w-7 h-7 rounded flex items-center justify-center text-sm transition-colors
                ${isDark ? 'hover:bg-dark-500 text-light-400' : 'hover:bg-light-600 text-dark-400'}`}
            >
              ─
            </button>
            {/* Maximize */}
            <button
              onClick={() => window.electronAPI.maximizeWindow()}
              className={`w-7 h-7 rounded flex items-center justify-center text-xs transition-colors
                ${isDark ? 'hover:bg-dark-500 text-light-400' : 'hover:bg-light-600 text-dark-400'}`}
            >
              {isMax ? '❐' : '□'}
            </button>
            {/* Close */}
            <button
              onClick={() => window.electronAPI.closeWindow()}
              className="w-7 h-7 rounded flex items-center justify-center text-sm transition-colors hover:bg-accent-red/80 hover:text-white text-light-400"
            >
              ✕
            </button>
          </>
        )}
      </div>
    </div>
  );
}
