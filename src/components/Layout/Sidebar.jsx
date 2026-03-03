import { useTheme } from '../../utils/ThemeContext';

const NAV_ITEMS = [
  {
    id: 'test-engine',
    label: 'Test Engine',
    icon: '⚡',
    subtitle: 'Generate test cases',
    accentClass: 'text-accent-blue',
    hoverBg: 'hover:bg-accent-blue/10',
    activeBg: 'bg-accent-blue/15 border-l-2 border-accent-blue',
  },
  {
    id: 'log-analyzer',
    label: 'Log Analyzer',
    icon: '🔍',
    subtitle: 'Parse & analyze logs',
    accentClass: 'text-accent-cyan',
    hoverBg: 'hover:bg-accent-cyan/10',
    activeBg: 'bg-accent-cyan/15 border-l-2 border-accent-cyan',
  },
  {
    id: 'bug-reporter',
    label: 'Bug Reporter',
    icon: '🐛',
    subtitle: 'Generate bug reports',
    accentClass: 'text-accent-red',
    hoverBg: 'hover:bg-accent-red/10',
    activeBg: 'bg-accent-red/15 border-l-2 border-accent-red',
  },
];

export default function Sidebar({ active, onChange }) {
  const { isDark } = useTheme();

  return (
    <div className={`w-52 flex-shrink-0 flex flex-col h-full border-r
      ${isDark ? 'bg-dark-800 border-dark-400' : 'bg-light-800 border-light-600'}`}>

      {/* Nav items */}
      <nav className="flex-1 pt-4 px-2 space-y-1">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={`w-full text-left px-3 py-3 rounded-lg transition-all duration-150
              ${active === item.id
                ? item.activeBg + (isDark ? ' text-white' : ' text-dark-900')
                : item.hoverBg + (isDark ? ' text-light-400 hover:text-white' : ' text-dark-400 hover:text-dark-900')
              }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-lg leading-none">{item.icon}</span>
              <div>
                <div className={`text-sm font-semibold font-body ${active === item.id ? item.accentClass : ''}`}>
                  {item.label}
                </div>
                <div className={`text-xs mt-0.5 ${isDark ? 'text-dark-300' : 'text-light-400'}`}>
                  {item.subtitle}
                </div>
              </div>
            </div>
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className={`px-4 py-4 border-t text-xs font-mono
        ${isDark ? 'border-dark-400 text-dark-300' : 'border-light-600 text-light-400'}`}>
        <div className="flex items-center gap-1.5 mb-1">
          <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse-slow"></span>
          <span>Local Processing</span>
        </div>
        <div>Data stays on-device</div>
        <div>AES-256 session encryption</div>
      </div>
    </div>
  );
}
