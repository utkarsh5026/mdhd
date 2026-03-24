import React from 'react';

const AppleWatchFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-center">
    {/* Watch body */}
    <div
      className="flex flex-col relative"
      style={{
        borderRadius: 40,
        border: '3px solid #2a2a2c',
        backgroundColor: '#000',
        overflow: 'hidden',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06), 0 2px 12px rgba(0,0,0,0.5)',
      }}
    >
      {/* Top sensor housing */}
      <div className="flex justify-center" style={{ backgroundColor: '#000', paddingTop: 6 }}>
        <div
          style={{
            width: 24,
            height: 4,
            borderRadius: 2,
            backgroundColor: '#1a1a1c',
          }}
        />
      </div>

      {/* Screen content with subtle bezel */}
      <div
        className="mx-1 my-1"
        style={{
          borderRadius: 34,
          overflow: 'hidden',
        }}
      >
        {children}
      </div>

      {/* Bottom spacer */}
      <div style={{ backgroundColor: '#000', height: 6 }} />
    </div>

    {/* Digital Crown + Side button */}
    <div className="flex flex-col gap-2 -ml-[2px]" style={{ paddingTop: 12, paddingBottom: 20 }}>
      {/* Digital Crown */}
      <div
        style={{
          width: 6,
          height: 20,
          borderRadius: '0 3px 3px 0',
          background: 'linear-gradient(180deg, #3a3a3c 0%, #2a2a2c 50%, #3a3a3c 100%)',
          boxShadow: '1px 0 2px rgba(0,0,0,0.3)',
        }}
      >
        {/* Crown ridges */}
        <div className="flex flex-col justify-center items-end h-full gap-[2px] pr-[1px]">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              style={{
                width: 3,
                height: 1,
                backgroundColor: 'rgba(255,255,255,0.08)',
                borderRadius: 1,
              }}
            />
          ))}
        </div>
      </div>

      {/* Side button */}
      <div
        style={{
          width: 5,
          height: 12,
          borderRadius: '0 2px 2px 0',
          background: 'linear-gradient(180deg, #3a3a3c 0%, #2a2a2c 100%)',
          boxShadow: '1px 0 2px rgba(0,0,0,0.3)',
        }}
      />
    </div>
  </div>
);

export default AppleWatchFrame;
