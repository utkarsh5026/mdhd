import React from 'react';

const IPadFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    className="flex flex-col"
    style={{
      borderRadius: 18,
      border: '3px solid #1c1c1e',
      backgroundColor: '#000',
      overflow: 'hidden',
      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06), 0 0 0 1px rgba(0,0,0,0.4)',
    }}
  >
    {/* Status bar */}
    <div
      className="flex items-center justify-between px-5 shrink-0"
      style={{ backgroundColor: '#000', height: 28 }}
    >
      {/* Time */}
      <span
        className="text-[12px] font-semibold text-white/80 select-none"
        style={{
          fontFamily: '-apple-system, "SF Pro Text", system-ui, sans-serif',
          fontFeatureSettings: '"tnum"',
        }}
      >
        9:41
      </span>

      {/* Right status icons */}
      <div className="flex items-center gap-[5px]">
        {/* WiFi */}
        <svg width="13" height="10" viewBox="0 0 16 13" fill="none">
          <path
            d="M1 4c3.9-3.5 10.1-3.5 14 0"
            stroke="rgba(255,255,255,0.75)"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <path
            d="M3.5 7c2.5-2.3 6.5-2.3 9 0"
            stroke="rgba(255,255,255,0.75)"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <path
            d="M6 10c1.1-1 2.9-1 4 0"
            stroke="rgba(255,255,255,0.75)"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <circle cx="8" cy="12" r="1" fill="rgba(255,255,255,0.75)" />
        </svg>
        {/* Battery */}
        <svg width="22" height="10" viewBox="0 0 27 13" fill="none">
          <rect
            x="0.5"
            y="0.5"
            width="22"
            height="12"
            rx="3"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth="1"
          />
          <rect x="2" y="2" width="17" height="9" rx="1.5" fill="rgba(255,255,255,0.75)" />
          <path d="M24 4.5a1.5 1.5 0 0 1 0 4" fill="rgba(255,255,255,0.25)" />
        </svg>
      </div>
    </div>

    {/* Content */}
    <div className="w-full">{children}</div>

    {/* Home indicator */}
    <div className="flex justify-center py-1.5" style={{ backgroundColor: '#000' }}>
      <div
        className="rounded-full"
        style={{
          width: 100,
          height: 4,
          backgroundColor: 'rgba(255,255,255,0.2)',
        }}
      />
    </div>
  </div>
);

export default IPadFrame;
