import React from 'react';

const BrowserArcFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    className="flex"
    style={{ borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 0 rgba(255,255,255,0.03)' }}
  >
    {/* Arc sidebar */}
    <div
      className="flex flex-col items-center py-4 gap-3 shrink-0"
      style={{
        backgroundColor: '#1a1a2e',
        width: 48,
        background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
      }}
    >
      {/* Space switcher */}
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="5" stroke="rgba(255,255,255,0.35)" strokeWidth="1.2" />
        </svg>
      </div>

      {/* Separator */}
      <div className="w-5 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />

      {/* Pinned tabs */}
      {[
        { bg: 'linear-gradient(135deg, #ff6b6b, #ee5a24)', letter: 'G' },
        { bg: 'linear-gradient(135deg, #feca57, #f0932b)', letter: 'Y' },
        { bg: 'linear-gradient(135deg, #48dbfb, #0abde3)', letter: 'T' },
        { bg: 'linear-gradient(135deg, #ff9ff3, #f368e0)', letter: 'D' },
        { bg: 'linear-gradient(135deg, #54a0ff, #2e86de)', letter: 'S' },
      ].map((tab, i) => (
        <div
          key={i}
          className="w-7 h-7 rounded-lg flex items-center justify-center select-none"
          style={{ background: tab.bg }}
        >
          <span
            className="text-[10px] font-bold text-white"
            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
          >
            {tab.letter}
          </span>
        </div>
      ))}

      <div className="flex-1" />

      {/* Bottom icon */}
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M8 3v10M3 8h10"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </div>

    {/* Main content area */}
    <div className="flex-1 flex flex-col" style={{ backgroundColor: '#0d1117' }}>
      {/* Compact URL bar */}
      <div
        className="flex items-center justify-center h-8.5 gap-2"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
      >
        {/* Shield icon */}
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className="shrink-0">
          <path
            d="M6 1L2 3v3c0 2.5 1.7 4.3 4 5 2.3-.7 4-2.5 4-5V3L6 1z"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="1"
          />
        </svg>
        <div
          className="h-5.5 rounded-md flex items-center px-3 select-none"
          style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
        >
          <span
            className="text-[11px] text-white/30"
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif', letterSpacing: '0.01em' }}
          >
            localhost:5173
          </span>
        </div>
      </div>

      {/* Content */}
      <div>{children}</div>
    </div>
  </div>
);

export default BrowserArcFrame;
