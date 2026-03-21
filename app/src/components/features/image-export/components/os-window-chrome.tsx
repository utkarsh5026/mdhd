import { Minus, Square, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { BsGrid1X2Fill, BsWindowStack } from 'react-icons/bs';
import { FaApple, FaWifi, FaWindows } from 'react-icons/fa';
import {
  IoChatbubble,
  IoCompass,
  IoDocumentText,
  IoGrid,
  IoImage,
  IoMail,
  IoMusicalNotes,
  IoVideocam,
} from 'react-icons/io5';
import { MdSearch, MdVolumeUp, MdWifi } from 'react-icons/md';

import { SHADOW_MAP } from '../utils/constants';
import { LanguageIcon } from '../utils/language-icons';

function useCurrentTime() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

interface BatteryState {
  level: number;
  charging: boolean;
}

function useBattery(): BatteryState {
  const [battery, setBattery] = useState<BatteryState>({ level: 1, charging: false });
  useEffect(() => {
    if (!('getBattery' in navigator)) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let bat: any;
    const update = () => {
      if (bat) setBattery({ level: bat.level, charging: bat.charging });
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (navigator as any).getBattery().then((b: any) => {
      bat = b;
      update();
      b.addEventListener('levelchange', update);
      b.addEventListener('chargingchange', update);
    });
    return () => {
      bat?.removeEventListener('levelchange', update);
      bat?.removeEventListener('chargingchange', update);
    };
  }, []);
  return battery;
}

const BatterySvg: React.FC<{ level: number; charging: boolean }> = ({ level, charging }) => {
  const fillWidth = Math.max(1, Math.round(level * 14));
  const fillColor = charging
    ? 'rgba(100,220,100,0.8)'
    : level < 0.2
      ? 'rgba(255,80,80,0.85)'
      : 'rgba(255,255,255,0.65)';
  return (
    <svg width="18" height="9" viewBox="0 0 25 11" fill="none">
      <rect x="0.5" y="0.5" width="19" height="10" rx="2" stroke="rgba(255,255,255,0.5)" />
      <rect x="2" y="2" width={fillWidth} height="7" rx="1" fill={fillColor} />
      <path d="M21 3.5a2 2 0 0 1 0 4" fill="rgba(255,255,255,0.3)" />
    </svg>
  );
};

const MACOS_FOCUSED_COLORS = ['#FF5F57', '#FEBC2E', '#28C840'];
const MACOS_UNFOCUSED_COLOR = '#555555';

const MacOSTrafficLights: React.FC<{ focused: boolean }> = ({ focused }) => (
  <div className="flex items-center gap-2 shrink-0">
    {MACOS_FOCUSED_COLORS.map((color, i) => (
      <div
        key={i}
        className="w-3 h-3 rounded-full"
        style={{
          backgroundColor: focused ? color : MACOS_UNFOCUSED_COLOR,
          border: focused ? `0.5px solid rgba(0,0,0,0.12)` : '0.5px solid rgba(0,0,0,0.06)',
        }}
      />
    ))}
  </div>
);

export interface MacOSTitleBarProps {
  focused: boolean;
  frosted: boolean;
  title: string;
  titlePosition: 'left' | 'center' | 'right';
  showIcon: boolean;
  language: string;
  themeBg: string;
}

export const MacOSTitleBar: React.FC<MacOSTitleBarProps> = ({
  focused,
  frosted,
  title,
  titlePosition,
  showIcon,
  language,
  themeBg,
}) => (
  <div
    className="relative flex items-center px-4 h-13 border-b border-gray-500/12 "
    style={{ backgroundColor: themeBg }}
  >
    {/* Frosted glass overlay — simulates vibrancy */}
    {frosted && <div className="absolute inset-0 bg-white/6 pointer-events-none" />}

    {/* Traffic lights */}
    <MacOSTrafficLights focused={focused} />

    {/* Title */}
    {title && (
      <TitleLabel
        title={title}
        titlePosition={titlePosition}
        showIcon={showIcon}
        language={language}
        focused={focused}
        offset={titlePosition === 'left' ? 12 : 0}
      />
    )}
  </div>
);

const WindowsControlButton: React.FC<{
  children: React.ReactNode;
  isClose?: boolean;
}> = ({ children, isClose }) => (
  <div
    className="flex items-center justify-center w-11.5 h-8"
    style={isClose ? { borderTopRightRadius: 'inherit' } : undefined}
  >
    {children}
  </div>
);

const WindowsControls: React.FC<{ focused: boolean }> = ({ focused }) => (
  <div className="flex items-center ml-auto shrink-0" style={{ opacity: focused ? 1 : 0.35 }}>
    <WindowsControlButton>
      <Minus className="w-3 h-3 opacity-50" />
    </WindowsControlButton>
    <WindowsControlButton>
      <Square className="w-2.5 h-2.5 opacity-50" />
    </WindowsControlButton>
    <WindowsControlButton isClose>
      <X className="w-3 h-3 opacity-50" />
    </WindowsControlButton>
  </div>
);

export interface WindowsTitleBarProps {
  focused: boolean;
  accentColor: string;
  title: string;
  titlePosition: 'left' | 'center' | 'right';
  showIcon: boolean;
  language: string;
  themeBg: string;
}

export const WindowsTitleBar: React.FC<WindowsTitleBarProps> = ({
  focused,
  accentColor,
  title,
  titlePosition,
  showIcon,
  language,
  themeBg,
}) => (
  <div className="relative">
    {/* Windows 11 accent top border (visible when focused) */}
    {focused && accentColor && <div className="h-0.5" style={{ backgroundColor: accentColor }} />}

    <div
      className="flex items-center pl-4 h-9 border-b border-gray-500/8"
      style={{ backgroundColor: themeBg }}
    >
      {/* Title */}
      {title && (
        <TitleLabel
          title={title}
          titlePosition={titlePosition}
          showIcon={showIcon}
          language={language}
          focused={focused}
          offset={0}
        />
      )}

      {/* Window controls */}
      <WindowsControls focused={focused} />
    </div>
  </div>
);

interface TitleLabelProps {
  title: string;
  titlePosition: 'left' | 'center' | 'right';
  showIcon: boolean;
  language: string;
  focused: boolean;
  offset: number;
}

const TitleLabel: React.FC<TitleLabelProps> = ({
  title,
  titlePosition,
  showIcon,
  language,
  focused,
  offset,
}) => {
  const positionClassName =
    titlePosition === 'center'
      ? 'absolute left-1/2 -translate-x-1/2'
      : titlePosition === 'right'
        ? 'ml-auto mr-2'
        : '';

  return (
    <span
      className={`flex items-center gap-1.5 text-[13px] text-gray-400 select-none whitespace-nowrap ${positionClassName}`}
      style={{
        fontFamily: 'system-ui, -apple-system, sans-serif',
        opacity: focused ? 0.7 : 0.35,
        ...(titlePosition === 'left' ? { marginLeft: offset } : {}),
      }}
    >
      {showIcon && <LanguageIcon language={language} className="w-3.5 h-3.5 opacity-80 shrink-0" />}
      {title}
    </span>
  );
};

const MACOS_MENU_ITEMS = ['File', 'Edit', 'View', 'Go', 'Window', 'Help'];

export const MENU_BAR_HEIGHT = 24;

const MACOS_SYSTEM_FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif';

export const MacOSMenuBar: React.FC<{ appName?: string }> = ({ appName = 'Code' }) => {
  const now = useCurrentTime();
  const battery = useBattery();
  const timeStr = now.toLocaleString('en-US', {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div className="absolute top-0 left-0 right-0 h-6 bg-[rgba(30,30,30,0.82)] backdrop-blur-[20px] flex items-center pr-2 pl-2.5 z-5 ">
      {/* Left: Apple logo + app name + menus */}
      <div className="flex items-center">
        <FaApple size={13} color="rgba(255,255,255,0.88)" style={{ marginRight: 18 }} />
        <span
          className="text-[13px] font-semibold leading-none text-white/88 select-none whitespace-nowrap mr-4"
          style={{ fontFamily: MACOS_SYSTEM_FONT, letterSpacing: -0.08 }}
        >
          {appName}
        </span>
        {MACOS_MENU_ITEMS.map((item) => (
          <span
            key={item}
            className="text-[13px] leading-none text-white/88 select-none whitespace-nowrap mr-3.5 opacity-85"
            style={{ fontFamily: MACOS_SYSTEM_FONT, letterSpacing: -0.08 }}
          >
            {item}
          </span>
        ))}
      </div>

      {/* Right: system tray icons */}
      <div className="ml-auto flex items-center gap-1.75">
        <MdSearch size={14} color="rgba(255,255,255,0.65)" />
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
          <rect x="1" y="4" width="14" height="2.5" rx="1.25" fill="rgba(255,255,255,0.65)" />
          <rect x="1" y="9.5" width="14" height="2.5" rx="1.25" fill="rgba(255,255,255,0.65)" />
        </svg>
        <MdWifi size={14} color="rgba(255,255,255,0.75)" />
        <BatterySvg level={battery.level} charging={battery.charging} />
        <span
          className="text-[11.5px] leading-none text-white/88 select-none whitespace-nowrap opacity-80 ml-px"
          style={{ fontFamily: MACOS_SYSTEM_FONT, letterSpacing: -0.08 }}
        >
          {timeStr}
        </span>
      </div>
    </div>
  );
};

const DOCK_APPS = [
  IoCompass,
  IoDocumentText,
  IoChatbubble,
  IoGrid,
  IoMusicalNotes,
  IoVideocam,
  IoImage,
  IoMail,
] as const;

export const DOCK_HEIGHT = 54;

export const MacOSDock: React.FC = () => (
  <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 z-5 flex items-center gap-1.5 py-1 px-2 rounded-2xl bg-[rgba(40,40,40,0.45)] border-[0.5px] border-white/18">
    {DOCK_APPS.map((Icon, i) => (
      <div
        key={i}
        className="w-9 h-9 rounded-lg bg-white/8 border-[0.5px] border-white/12 flex items-center justify-center"
      >
        <Icon size={20} color="rgba(255,255,255,0.7)" />
      </div>
    ))}
  </div>
);

const WinStartIcon: React.FC = () => <FaWindows size={16} color="rgba(255,255,255,0.85)" />;

const WinSearchIcon: React.FC = () => <MdSearch size={16} color="rgba(255,255,255,0.7)" />;

const WinTaskViewIcon: React.FC = () => <BsWindowStack size={14} color="rgba(255,255,255,0.65)" />;

const WinWidgetsIcon: React.FC = () => <BsGrid1X2Fill size={14} color="rgba(255,255,255,0.65)" />;

const WinSpeakerIcon: React.FC = () => <MdVolumeUp size={14} color="rgba(255,255,255,0.6)" />;

const WIN_FONT_FAMILY = '"Segoe UI", system-ui, sans-serif';

export const TASKBAR_HEIGHT = 44;

export const WindowsTaskbar: React.FC = () => {
  const now = useCurrentTime();
  const battery = useBattery();
  const timeStr = now.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const dateStr = now.toLocaleDateString('en-US');

  return (
    <div className="absolute bottom-0 left-0 right-0 h-11 bg-[rgba(30,30,30,0.88)] border-t border-white/6 flex items-center justify-center z-5">
      {/* Center: taskbar icons */}
      <div className="flex items-center gap-1">
        {[WinStartIcon, WinSearchIcon, WinTaskViewIcon, WinWidgetsIcon].map((Icon, i) => (
          <div key={i} className="w-9 h-8 flex items-center justify-center rounded">
            <Icon />
          </div>
        ))}
      </div>

      {/* Right: system tray */}
      <div className="absolute right-3 flex items-center gap-2">
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
          <path d="M1 5L5 1l4 4" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" />
        </svg>
        <FaWifi />
        <WinSpeakerIcon />
        <BatterySvg level={battery.level} charging={battery.charging} />
        <div className="flex flex-col items-end leading-tight">
          <span
            className="text-[11px] text-white/75 select-none whitespace-nowrap"
            style={{ fontFamily: WIN_FONT_FAMILY }}
          >
            {timeStr}
          </span>
          <span
            className="text-[10px] text-white/75 select-none whitespace-nowrap opacity-70"
            style={{ fontFamily: WIN_FONT_FAMILY }}
          >
            {dateStr}
          </span>
        </div>
      </div>
    </div>
  );
};

export const GNOME_TOP_BAR_HEIGHT = 28;

const GNOME_FONT = '"Ubuntu", "Cantarell", system-ui, sans-serif';

export const GnomeTopBar: React.FC<{ appName?: string }> = ({ appName = 'Files' }) => {
  const now = useCurrentTime();
  const battery = useBattery();
  const timeStr = now.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div
      className="absolute top-0 left-0 right-0 z-5 flex items-center px-3"
      style={{ height: GNOME_TOP_BAR_HEIGHT, backgroundColor: 'rgba(24,24,24,0.97)' }}
    >
      {/* Left: Activities */}
      <span
        className="text-[12.5px] text-white/90 select-none whitespace-nowrap font-medium"
        style={{ fontFamily: GNOME_FONT }}
      >
        Activities
      </span>

      {/* Center: app name + clock */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3">
        <span
          className="text-[12.5px] text-white/70 select-none whitespace-nowrap"
          style={{ fontFamily: GNOME_FONT }}
        >
          {appName}
        </span>
        <span
          className="text-[12.5px] text-white/90 select-none whitespace-nowrap"
          style={{ fontFamily: GNOME_FONT }}
        >
          {timeStr}
        </span>
      </div>

      {/* Right: system tray */}
      <div className="ml-auto flex items-center gap-1.5">
        <MdWifi size={13} color="rgba(255,255,255,0.75)" />
        <MdVolumeUp size={13} color="rgba(255,255,255,0.7)" />
        <BatterySvg level={battery.level} charging={battery.charging} />
        {/* User avatar circle */}
        <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center ml-0.5">
          <div className="w-2 h-2 rounded-full bg-white/70" />
        </div>
      </div>
    </div>
  );
};

export const GNOME_DASH_WIDTH = 58;

const DASH_APPS = [
  IoCompass,
  IoDocumentText,
  IoChatbubble,
  IoGrid,
  IoMusicalNotes,
  IoVideocam,
  IoImage,
  IoMail,
] as const;

export const GnomeDash: React.FC = () => (
  <div
    className="absolute left-1.5 top-1/2 -translate-y-1/2 z-5 flex flex-col items-center gap-1.5 py-2 px-1.5 rounded-2xl border-[0.5px] border-white/12"
    style={{ backgroundColor: 'rgba(38,38,38,0.55)' }}
  >
    {DASH_APPS.map((Icon, i) => (
      <div
        key={i}
        className="w-9 h-9 rounded-lg bg-white/8 border-[0.5px] border-white/10 flex items-center justify-center"
      >
        <Icon size={20} color="rgba(255,255,255,0.7)" />
      </div>
    ))}
  </div>
);

export interface LinuxTitleBarProps {
  focused: boolean;
  title: string;
  titlePosition: 'left' | 'center' | 'right';
  showIcon: boolean;
  language: string;
  themeBg: string;
}

export const LinuxGnomeTitleBar: React.FC<LinuxTitleBarProps> = ({
  focused,
  title,
  titlePosition,
  showIcon,
  language,
  themeBg,
}) => (
  <div
    className="relative flex items-center px-3 h-10 border-b border-gray-500/10"
    style={{ backgroundColor: themeBg }}
  >
    {/* GNOME header bar: title centered, close on the right */}
    {title && (
      <TitleLabel
        title={title}
        titlePosition={titlePosition}
        showIcon={showIcon}
        language={language}
        focused={focused}
        offset={0}
      />
    )}

    {/* GNOME close button (right-aligned circle) */}
    <div
      className="ml-auto flex items-center gap-1.5 shrink-0"
      style={{ opacity: focused ? 1 : 0.4 }}
    >
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center"
        style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
      >
        <Minus className="w-3 h-3 opacity-50" />
      </div>
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center"
        style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
      >
        <Square className="w-2.5 h-2.5 opacity-50" />
      </div>
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center"
        style={{ backgroundColor: focused ? '#e74c3c' : 'rgba(255,255,255,0.08)' }}
      >
        <X className="w-3 h-3" style={{ color: focused ? '#fff' : 'rgba(255,255,255,0.5)' }} />
      </div>
    </div>
  </div>
);

export const LinuxKDETitleBar: React.FC<LinuxTitleBarProps> = ({
  focused,
  title,
  titlePosition,
  showIcon,
  language,
  themeBg,
}) => (
  <div
    className="relative flex items-center px-3 h-9 border-b border-gray-500/8"
    style={{ backgroundColor: themeBg }}
  >
    {/* KDE Breeze: title left-aligned, minimize/maximize/close on right */}
    {title && (
      <TitleLabel
        title={title}
        titlePosition={titlePosition}
        showIcon={showIcon}
        language={language}
        focused={focused}
        offset={0}
      />
    )}

    <div className="ml-auto flex items-center shrink-0" style={{ opacity: focused ? 1 : 0.35 }}>
      {/* KDE-style flat buttons */}
      <div className="w-8 h-8 flex items-center justify-center hover:bg-white/5 rounded-sm">
        <Minus className="w-3 h-3 opacity-50" />
      </div>
      <div className="w-8 h-8 flex items-center justify-center hover:bg-white/5 rounded-sm">
        <Square className="w-2.5 h-2.5 opacity-50" />
      </div>
      <div className="w-8 h-8 flex items-center justify-center hover:bg-red-500/10 rounded-sm">
        <X className="w-3 h-3 opacity-60" />
      </div>
    </div>
  </div>
);

export const KDE_PANEL_HEIGHT = 40;

const KDE_FONT = '"Noto Sans", system-ui, sans-serif';

const KDE_LAUNCHER_ICON: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <circle cx="9" cy="9" r="8" fill="rgba(53,132,228,0.9)" />
    <text x="9" y="13" textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">
      K
    </text>
  </svg>
);

export const KDEPanel: React.FC = () => {
  const now = useCurrentTime();
  const battery = useBattery();
  const timeStr = now.toLocaleString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: false,
  });
  const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div
      className="absolute bottom-0 left-0 right-0 z-5 flex items-center px-2 gap-1"
      style={{
        height: KDE_PANEL_HEIGHT,
        backgroundColor: 'rgba(28,30,36,0.96)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* App launcher */}
      <div className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/8">
        <KDE_LAUNCHER_ICON />
      </div>

      {/* Separator */}
      <div className="w-px h-5 bg-white/10 mx-1" />

      {/* Pinned app icons */}
      {[IoCompass, IoDocumentText, IoChatbubble, IoMusicalNotes].map((Icon, i) => (
        <div key={i} className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/8">
          <Icon size={17} color="rgba(255,255,255,0.65)" />
        </div>
      ))}

      {/* Right: system tray + clock */}
      <div className="ml-auto flex items-center gap-2">
        <MdWifi size={14} color="rgba(255,255,255,0.6)" />
        <MdVolumeUp size={14} color="rgba(255,255,255,0.6)" />
        <BatterySvg level={battery.level} charging={battery.charging} />
        <div className="flex flex-col items-end leading-tight ml-1">
          <span
            className="text-[11px] text-white/80 select-none whitespace-nowrap"
            style={{ fontFamily: KDE_FONT }}
          >
            {timeStr}
          </span>
          <span
            className="text-[10px] text-white/50 select-none whitespace-nowrap"
            style={{ fontFamily: KDE_FONT }}
          >
            {dateStr}
          </span>
        </div>
      </div>
    </div>
  );
};

const RETRO_FONT = '"VT323", "Courier New", "Lucida Console", monospace';

export const RetroTerminalTitleBar: React.FC<LinuxTitleBarProps> = ({ focused, title }) => (
  <div
    className="relative flex items-center px-4 h-8 border-b"
    style={{
      backgroundColor: '#0a0a0a',
      borderColor: focused ? '#33ff33' : '#1a5c1a',
      fontFamily: RETRO_FONT,
    }}
  >
    {/* Green terminal prompt style */}
    <span
      className="text-[13px] select-none whitespace-nowrap tracking-wider"
      style={{
        color: focused ? '#33ff33' : '#1a5c1a',
        textShadow: focused ? '0 0 4px rgba(51,255,51,0.4)' : 'none',
      }}
    >
      {'> '}
      {title || 'terminal'}
      <span
        className="inline-block w-2 h-3.5 ml-1 align-middle"
        style={{
          backgroundColor: focused ? '#33ff33' : '#1a5c1a',
          animation: focused ? 'pulse 1s step-end infinite' : 'none',
        }}
      />
    </span>

    <div className="ml-auto flex items-center gap-2 shrink-0">
      <span
        className="text-[11px] select-none"
        style={{ color: focused ? '#33ff33' : '#1a5c1a', opacity: 0.6 }}
      >
        [—][□][×]
      </span>
    </div>
  </div>
);

export type WindowStyle =
  | 'macos'
  | 'windows'
  | 'linux-gnome'
  | 'linux-kde'
  | 'retro-terminal'
  | 'none';

export interface WindowFrameProps {
  windowStyle: WindowStyle;
  borderRadius: number;
  shadowSize: string;
  themeBg: string;
  children: React.ReactNode;
}

export const WindowFrame: React.FC<WindowFrameProps> = ({
  windowStyle,
  borderRadius,
  shadowSize,
  themeBg,
  children,
}) => {
  const borderStyle =
    windowStyle === 'macos'
      ? '0.5px solid rgba(255,255,255,0.1)'
      : windowStyle === 'windows'
        ? '1px solid rgba(128,128,128,0.15)'
        : windowStyle === 'linux-gnome'
          ? '0.5px solid rgba(255,255,255,0.08)'
          : windowStyle === 'linux-kde'
            ? '1px solid rgba(100,100,120,0.12)'
            : windowStyle === 'retro-terminal'
              ? '1px solid #33ff33'
              : 'none';

  const bg = windowStyle === 'retro-terminal' ? '#0a0a0a' : themeBg;

  return (
    <div
      className="relative overflow-hidden"
      style={{
        borderRadius: `${borderRadius}px`,
        boxShadow: SHADOW_MAP[shadowSize] || '',
        backgroundColor: bg,
        border: borderStyle,
      }}
    >
      {children}
    </div>
  );
};
