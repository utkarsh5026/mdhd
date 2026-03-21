import React from 'react';

const IPhoneFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    className="flex flex-col"
    style={{
      borderRadius: 44,
      border: '4px solid #1c1c1e',
      backgroundColor: '#000',
      overflow: 'hidden',
      boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.08), 0 0 0 1px rgba(0,0,0,0.5)',
    }}
  >
    {/* Status bar */}
    <div
      className="flex items-center justify-between px-7 shrink-0"
      style={{ backgroundColor: '#000', height: 48 }}
    >
      {/* Time */}
      <span
        className="text-[14px] font-semibold text-white/90 select-none"
        style={{
          fontFamily: '-apple-system, "SF Pro Text", system-ui, sans-serif',
          fontFeatureSettings: '"tnum"',
          letterSpacing: '0.02em',
        }}
      >
        9:41
      </span>

      {/* Dynamic Island */}
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{
          width: 120,
          height: 34,
          borderRadius: 20,
          backgroundColor: '#000',
        }}
      />

      {/* Right status icons */}
      <div className="flex items-center gap-[5px]">
        {/* Cellular */}
        <svg width="16" height="12" viewBox="0 0 20 14" fill="none">
          <rect x="0" y="10" width="3.5" height="4" rx="0.7" fill="rgba(255,255,255,0.85)" />
          <rect x="5" y="7" width="3.5" height="7" rx="0.7" fill="rgba(255,255,255,0.85)" />
          <rect x="10" y="4" width="3.5" height="10" rx="0.7" fill="rgba(255,255,255,0.85)" />
          <rect x="15" y="0" width="3.5" height="14" rx="0.7" fill="rgba(255,255,255,0.85)" />
        </svg>
        {/* WiFi */}
        <svg width="14" height="12" viewBox="0 0 16 13" fill="none">
          <path
            d="M1 4c3.9-3.5 10.1-3.5 14 0"
            stroke="rgba(255,255,255,0.85)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M3.5 7c2.5-2.3 6.5-2.3 9 0"
            stroke="rgba(255,255,255,0.85)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M6 10c1.1-1 2.9-1 4 0"
            stroke="rgba(255,255,255,0.85)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="8" cy="12" r="1" fill="rgba(255,255,255,0.85)" />
        </svg>
        {/* Battery */}
        <svg width="24" height="11" viewBox="0 0 27 13" fill="none">
          <rect
            x="0.5"
            y="0.5"
            width="22"
            height="12"
            rx="3"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="1"
          />
          <rect x="2" y="2" width="17" height="9" rx="1.5" fill="rgba(255,255,255,0.85)" />
          <path d="M24 4.5a1.5 1.5 0 0 1 0 4" fill="rgba(255,255,255,0.3)" />
        </svg>
      </div>
    </div>

    {/* Content */}
    <div className="w-full">{children}</div>

    {/* Home indicator */}
    <div className="flex justify-center py-2" style={{ backgroundColor: '#000' }}>
      <div
        className="rounded-full"
        style={{
          width: 120,
          height: 5,
          backgroundColor: 'rgba(255,255,255,0.25)',
        }}
      />
    </div>
  </div>
);

export default IPhoneFrame;
