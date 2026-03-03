import { useTheme } from '../../utils/ThemeContext';

export function Card({ children, className = '', glow }) {
  const { isDark } = useTheme();
  return (
    <div className={`rounded-xl border transition-all duration-200
      ${isDark
        ? 'bg-dark-700 border-dark-400 ' + (glow ? 'shadow-glow-cyan hover:shadow-glow-cyan' : '')
        : 'bg-light-800 border-light-600 shadow-sm'
      } ${className}`}>
      {children}
    </div>
  );
}

export function Button({ children, onClick, variant = 'primary', size = 'md', disabled, className = '', icon }) {
  const { isDark } = useTheme();

  const base = 'inline-flex items-center gap-2 font-semibold rounded-lg transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed no-drag';

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const variants = {
    primary: 'bg-gradient-to-r from-accent-cyan to-accent-blue text-dark-900 hover:opacity-90 shadow-glow-cyan',
    secondary: isDark
      ? 'bg-dark-500 border border-dark-300 text-light-400 hover:bg-dark-400 hover:text-white'
      : 'bg-light-700 border border-light-500 text-dark-400 hover:bg-light-600 hover:text-dark-900',
    danger: 'bg-gradient-to-r from-accent-red/80 to-accent-red text-white hover:opacity-90',
    ghost: isDark
      ? 'text-light-400 hover:bg-dark-500 hover:text-white'
      : 'text-dark-400 hover:bg-light-600 hover:text-dark-900',
    success: 'bg-gradient-to-r from-accent-green/80 to-accent-green text-dark-900 hover:opacity-90',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {icon && <span>{icon}</span>}
      {children}
    </button>
  );
}

export function Badge({ children, color = 'default' }) {
  const colors = {
    default: 'bg-dark-400 text-light-400',
    blue: 'bg-accent-blue/15 text-accent-blue border border-accent-blue/30',
    cyan: 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30',
    green: 'bg-accent-green/10 text-accent-green border border-accent-green/30',
    amber: 'bg-accent-amber/10 text-accent-amber border border-accent-amber/30',
    red: 'bg-accent-red/10 text-accent-red border border-accent-red/30',
    purple: 'bg-accent-purple/10 text-accent-purple border border-accent-purple/30',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold font-mono ${colors[color]}`}>
      {children}
    </span>
  );
}

export function TextArea({ value, onChange, placeholder, rows = 4, className = '', readOnly }) {
  const { isDark } = useTheme();
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      readOnly={readOnly}
      className={`w-full rounded-lg border px-3 py-2.5 text-sm font-mono resize-none outline-none
        focus:ring-1 transition-colors selectable
        ${isDark
          ? 'bg-dark-600 border-dark-400 text-light-400 placeholder-dark-300 focus:border-accent-cyan focus:ring-accent-cyan/20'
          : 'bg-white border-light-600 text-dark-800 placeholder-light-400 focus:border-accent-blue focus:ring-accent-blue/20'
        } ${className}`}
    />
  );
}

export function Input({ value, onChange, placeholder, className = '', type = 'text' }) {
  const { isDark } = useTheme();
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full rounded-lg border px-3 py-2 text-sm outline-none
        focus:ring-1 transition-colors selectable
        ${isDark
          ? 'bg-dark-600 border-dark-400 text-light-400 placeholder-dark-300 focus:border-accent-cyan focus:ring-accent-cyan/20'
          : 'bg-white border-light-600 text-dark-800 placeholder-light-400 focus:border-accent-blue focus:ring-accent-blue/20'
        } ${className}`}
    />
  );
}

export function Select({ value, onChange, options, className = '' }) {
  const { isDark } = useTheme();
  return (
    <select
      value={value}
      onChange={onChange}
      className={`rounded-lg border px-3 py-2 text-sm outline-none cursor-pointer
        focus:ring-1 transition-colors
        ${isDark
          ? 'bg-dark-600 border-dark-400 text-light-400 focus:border-accent-cyan focus:ring-accent-cyan/20'
          : 'bg-white border-light-600 text-dark-800 focus:border-accent-blue focus:ring-accent-blue/20'
        } ${className}`}
    >
      {options.map(o => (
        <option key={o.value || o} value={o.value || o}>
          {o.label || o}
        </option>
      ))}
    </select>
  );
}

export function Divider() {
  const { isDark } = useTheme();
  return <div className={`h-px my-4 ${isDark ? 'bg-dark-400' : 'bg-light-600'}`} />;
}

export function StatusDot({ color }) {
  const colors = {
    green: 'bg-accent-green',
    red: 'bg-accent-red',
    amber: 'bg-accent-amber',
    cyan: 'bg-accent-cyan',
    blue: 'bg-accent-blue',
  };
  return <span className={`inline-block w-2 h-2 rounded-full ${colors[color] || colors.cyan} animate-pulse-slow`} />;
}

export function SectionHeader({ title, subtitle, icon, action }) {
  const { isDark } = useTheme();
  return (
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-2.5">
        {icon && <span className="text-xl">{icon}</span>}
        <div>
          <h2 className={`font-display font-bold text-sm tracking-widest uppercase
            ${isDark ? 'text-gradient-cyan' : 'text-accent-blue'}`}>
            {title}
          </h2>
          {subtitle && (
            <p className={`text-xs mt-0.5 ${isDark ? 'text-dark-300' : 'text-light-400'}`}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function CopyButton({ text, label = 'Copy' }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button onClick={copy} variant="ghost" size="sm" icon={copied ? '✓' : '⧉'}>
      {copied ? 'Copied!' : label}
    </Button>
  );
}

// Need useState for CopyButton
import { useState } from 'react';
