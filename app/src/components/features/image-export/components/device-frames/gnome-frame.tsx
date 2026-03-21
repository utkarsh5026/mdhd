import React from 'react';

const GnomeFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    className="flex flex-col"
    style={{
      borderRadius: 12,
      overflow: 'hidden',
      boxShadow: '0 4px 16px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.04)',
    }}
  >
    {/* GNOME Header Bar */}
    <div
      className="flex items-center h-[38px] shrink-0"
      style={{
        background: 'linear-gradient(180deg, #3d3846 0%, #352f3a 100%)',
        borderBottom: '1px solid rgba(0,0,0,0.3)',
      }}
    >
      {/* Close button (left side, GNOME style) */}
      <div className="flex items-center pl-3 shrink-0">
        <div
          className="flex items-center justify-center"
          style={{
            width: 20,
            height: 20,
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path
              d="M1 1l6 6M7 1l-6 6"
              stroke="rgba(255,255,255,0.7)"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      {/* Title (centered in GNOME style) */}
      <div className="flex-1 flex items-center justify-center">
        <span
          className="text-[13px] text-white/80 font-medium select-none"
          style={{
            fontFamily: '"Cantarell", "Noto Sans", system-ui, sans-serif',
            letterSpacing: '0.01em',
          }}
        >
          Preview
        </span>
      </div>

      {/* Right side spacer (matches close button width for centering) */}
      <div style={{ width: 44 }} />
    </div>

    {/* Content */}
    <div>{children}</div>
  </div>
);

export default GnomeFrame;
