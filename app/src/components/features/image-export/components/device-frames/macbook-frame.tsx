import React from 'react';

const MacBookFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex flex-col items-center">
    {/* Screen */}
    <div
      className="w-full"
      style={{
        borderRadius: '10px 10px 0 0',
        border: '2px solid #1c1c1e',
        borderBottom: 'none',
        backgroundColor: '#0a0a0a',
        padding: '6px 6px 0',
        overflow: 'hidden',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.04)',
      }}
    >
      {/* Top bezel with camera */}
      <div className="flex justify-center" style={{ paddingBottom: 4 }}>
        {/* Notch */}
        <div
          className="flex items-center justify-center"
          style={{
            width: 80,
            height: 18,
            borderRadius: '0 0 8px 8px',
            backgroundColor: '#0a0a0a',
          }}
        >
          {/* Camera */}
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: '#1a1a1a',
              border: '1px solid #333',
              boxShadow: 'inset 0 0 1px rgba(255,255,255,0.08)',
            }}
          />
        </div>
      </div>

      {/* Screen content */}
      <div style={{ borderRadius: '4px 4px 0 0', overflow: 'hidden' }}>{children}</div>
    </div>

    {/* Hinge */}
    <div
      className="w-full"
      style={{
        height: 8,
        background: 'linear-gradient(180deg, #303030 0%, #1e1e1e 40%, #1a1a1a 100%)',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        position: 'relative',
      }}
    >
      {/* Hinge indent */}
      <div
        className="absolute left-1/2 -translate-x-1/2 top-0"
        style={{
          width: '30%',
          height: '100%',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 100%)',
          borderRadius: '0 0 4px 4px',
        }}
      />
    </div>

    {/* Bottom base */}
    <div
      style={{
        width: '108%',
        height: 5,
        background: 'linear-gradient(180deg, #1e1e1e 0%, #171717 100%)',
        borderRadius: '0 0 8px 8px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
      }}
    />
  </div>
);

export default MacBookFrame;
