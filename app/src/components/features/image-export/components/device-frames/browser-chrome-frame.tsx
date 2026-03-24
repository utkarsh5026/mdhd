import React from 'react';

const BrowserChromeFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    className="flex flex-col"
    style={{ borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 0 rgba(255,255,255,0.04)' }}
  >
    {/* Tab bar */}
    <div
      className="flex items-end px-2.5 pt-2 gap-0.5"
      style={{ backgroundColor: '#202124', height: 38 }}
    >
      {/* Traffic lights */}
      <div className="flex items-center gap-2 px-2 pb-1.5 shrink-0">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#FF5F57' }} />
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#FEBC2E' }} />
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#28C840' }} />
      </div>

      {/* Active tab */}
      <div
        className="flex items-center h-7.5 pl-3 pr-2 gap-2 select-none"
        style={{
          backgroundColor: '#292a2d',
          borderRadius: '8px 8px 0 0',
          maxWidth: 220,
          minWidth: 120,
        }}
      >
        {/* Favicon placeholder */}
        <div
          className="w-3.5 h-3.5 rounded shrink-0"
          style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
        />
        <span
          className="text-[12px] text-white/70 truncate"
          style={{ fontFamily: 'system-ui, -apple-system, sans-serif', letterSpacing: '-0.01em' }}
        >
          Preview
        </span>
        {/* Close icon */}
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          className="shrink-0 opacity-0 group-hover:opacity-100"
        >
          <path d="M4 4l6 6M10 4l-6 6" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" />
        </svg>
      </div>

      {/* Inactive tab */}
      <div className="flex items-center h-6.5 px-3 mb-0.5 select-none" style={{ maxWidth: 160 }}>
        <span className="text-[11px] text-white/30 truncate">New Tab</span>
      </div>
    </div>

    {/* Toolbar / URL bar */}
    <div
      className="flex items-center px-3 h-9.5 gap-2"
      style={{ backgroundColor: '#292a2d', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Nav buttons */}
      <div className="flex items-center gap-1 shrink-0">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M10 3L5 8l5 5"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M6 3l5 5-5 5"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {/* Reload */}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="ml-0.5">
          <path
            d="M13 8a5 5 0 1 1-1.5-3.5M13 3v2.5H10.5"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* URL box */}
      <div
        className="flex-1 h-6.5 rounded-full flex items-center px-3 gap-1.5"
        style={{ backgroundColor: '#202124' }}
      >
        {/* Lock icon */}
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0">
          <rect
            x="2.5"
            y="5"
            width="7"
            height="5.5"
            rx="1"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="1"
          />
          <path
            d="M4 5V3.5a2 2 0 0 1 4 0V5"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="1"
            strokeLinecap="round"
          />
        </svg>
        <span
          className="text-[12px] text-white/40 select-none truncate"
          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
        >
          localhost:5173
        </span>
      </div>

      {/* Extension / menu icons */}
      <div className="flex items-center gap-1.5 shrink-0">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="4" cy="8" r="1" fill="rgba(255,255,255,0.25)" />
          <circle cx="8" cy="8" r="1" fill="rgba(255,255,255,0.25)" />
          <circle cx="12" cy="8" r="1" fill="rgba(255,255,255,0.25)" />
        </svg>
      </div>
    </div>

    {/* Content */}
    <div>{children}</div>
  </div>
);

export default BrowserChromeFrame;
