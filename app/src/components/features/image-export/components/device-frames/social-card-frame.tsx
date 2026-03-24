import React from 'react';

const SocialCardFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    className="flex flex-col"
    style={{
      borderRadius: 16,
      overflow: 'hidden',
      backgroundColor: '#15202b',
      border: '1px solid rgba(255,255,255,0.08)',
    }}
  >
    {/* Post header */}
    <div className="flex items-start gap-3 px-4 pt-3 pb-2">
      {/* Avatar */}
      <div
        className="shrink-0"
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #1da1f2 0%, #6c5ce7 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
          <path
            d="M8 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM3 13c0-2.2 2.2-4 5-4s5 1.8 5 4"
            stroke="rgba(255,255,255,0.9)"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Name & handle */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span
            className="text-[14px] font-bold text-white select-none truncate"
            style={{ fontFamily: '-apple-system, "Segoe UI", system-ui, sans-serif' }}
          >
            User
          </span>
          {/* Verified badge */}
          <svg width="16" height="16" viewBox="0 0 22 22" fill="none" className="shrink-0">
            <circle cx="11" cy="11" r="9" fill="#1da1f2" />
            <path
              d="M7 11.5l2.5 2.5L15 8.5"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <span
          className="text-[13px] text-white/40 select-none"
          style={{ fontFamily: '-apple-system, "Segoe UI", system-ui, sans-serif' }}
        >
          @user
        </span>
      </div>

      {/* Platform icon (X / Twitter) */}
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="shrink-0 mt-0.5">
        <path
          d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
          fill="rgba(255,255,255,0.5)"
        />
      </svg>
    </div>

    {/* Post text area (subtle) */}
    <div className="px-4 pb-2">
      <div className="flex gap-1">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="rounded-full"
            style={{
              height: 4,
              width: i === 2 ? 32 : 48,
              backgroundColor: 'rgba(255,255,255,0.06)',
            }}
          />
        ))}
      </div>
    </div>

    {/* Media embed (content goes here) */}
    <div className="mx-4 mb-2" style={{ borderRadius: 12, overflow: 'hidden' }}>
      {children}
    </div>

    {/* Timestamp */}
    <div className="px-4 pb-2">
      <span
        className="text-[12px] text-white/30 select-none"
        style={{ fontFamily: '-apple-system, "Segoe UI", system-ui, sans-serif' }}
      >
        3:42 PM · Mar 22, 2026
      </span>
    </div>

    {/* Engagement stats divider */}
    <div className="mx-4" style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.08)' }} />

    {/* Engagement stats */}
    <div className="flex items-center gap-6 px-4 py-2.5">
      <span
        className="text-[13px] text-white/30 select-none"
        style={{ fontFamily: '-apple-system, "Segoe UI", system-ui, sans-serif' }}
      >
        <span className="font-bold text-white/60">128</span> Reposts
      </span>
      <span
        className="text-[13px] text-white/30 select-none"
        style={{ fontFamily: '-apple-system, "Segoe UI", system-ui, sans-serif' }}
      >
        <span className="font-bold text-white/60">1.4K</span> Likes
      </span>
      <span
        className="text-[13px] text-white/30 select-none"
        style={{ fontFamily: '-apple-system, "Segoe UI", system-ui, sans-serif' }}
      >
        <span className="font-bold text-white/60">89</span> Bookmarks
      </span>
    </div>

    {/* Action bar divider */}
    <div className="mx-4" style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.08)' }} />

    {/* Action bar */}
    <div className="flex items-center justify-around px-4 py-2.5">
      {/* Reply */}
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 21c-4.97 0-9-3.582-9-8s4.03-8 9-8 9 3.582 9 8c0 1.5-.5 2.9-1.36 4.08L21 21l-4.64-1.36C15.07 20.46 13.6 21 12 21z"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
      {/* Repost */}
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path
          d="M17 2l4 4-4 4M7 22l-4-4 4-4M21 6H8a4 4 0 0 0-4 4M3 18h13a4 4 0 0 0 4-4"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {/* Like */}
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 21C12 21 3 15 3 9a4.5 4.5 0 0 1 9-1 4.5 4.5 0 0 1 9 1c0 6-9 12-9 12z"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
      {/* Share */}
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path
          d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M8 8l4-4 4 4M12 4v12"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  </div>
);

export default SocialCardFrame;
