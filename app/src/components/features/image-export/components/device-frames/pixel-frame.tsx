import React from 'react';

const PixelFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    className="flex flex-col"
    style={{
      borderRadius: 32,
      border: '4px solid #2c2c2c',
      backgroundColor: '#000',
      overflow: 'hidden',
      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.04), 0 0 0 1px rgba(0,0,0,0.4)',
    }}
  >
    {/* Status bar */}
    <div
      className="flex items-center justify-between px-6 shrink-0"
      style={{ backgroundColor: '#000', height: 40 }}
    >
      {/* Time */}
      <span
        className="text-[13px] text-white/85 select-none"
        style={{
          fontFamily: '"Google Sans Text", "Product Sans", "Roboto", system-ui, sans-serif',
          fontWeight: 500,
          letterSpacing: '0.01em',
        }}
      >
        12:30
      </span>

      {/* Camera hole punch */}
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{
          width: 12,
          height: 12,
          borderRadius: '50%',
          backgroundColor: '#0a0a0a',
          border: '1.5px solid #222',
          boxShadow: 'inset 0 0 2px rgba(0,0,0,0.8)',
        }}
      />

      {/* Right status icons */}
      <div className="flex items-center gap-[6px]">
        {/* Mobile data */}
        <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
          <path d="M2 10h2V4H2v6zm4 2h2V2H6v10zm4-6h2V4h-2v2z" fill="rgba(255,255,255,0.7)" />
        </svg>
        {/* WiFi */}
        <svg width="14" height="12" viewBox="0 0 16 13" fill="none">
          <path
            d="M1 4.5c3.9-3.3 10.1-3.3 14 0"
            stroke="rgba(255,255,255,0.7)"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <path
            d="M3.5 7.2c2.5-2 6.5-2 9 0"
            stroke="rgba(255,255,255,0.7)"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <circle cx="8" cy="10.5" r="1.5" fill="rgba(255,255,255,0.7)" />
        </svg>
        {/* Battery (pill style) */}
        <svg width="22" height="11" viewBox="0 0 24 12" fill="none">
          <rect
            x="0.5"
            y="0.5"
            width="20"
            height="11"
            rx="3"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth="1"
          />
          <rect x="2" y="2" width="15" height="8" rx="2" fill="rgba(255,255,255,0.7)" />
          <path d="M22 4a1.5 1.5 0 0 1 0 4" fill="rgba(255,255,255,0.25)" />
        </svg>
      </div>
    </div>

    {/* Content */}
    <div className="w-full">{children}</div>

    {/* Navigation bar (Material You pill) */}
    <div className="flex justify-center py-2" style={{ backgroundColor: '#000' }}>
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

export default PixelFrame;
