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

import { LanguageIcon } from '../utils/language-icons';

// ── System status hooks ──────────────────────────────────────────────────────

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
    (navigator as any).getBattery().then((b: any) => {
      const update = () => setBattery({ level: b.level, charging: b.charging });
      update();
      b.addEventListener('levelchange', update);
      b.addEventListener('chargingchange', update);
      return () => {
        b.removeEventListener('levelchange', update);
        b.removeEventListener('chargingchange', update);
      };
    });
  }, []);
  return battery;
}

// ── Shared battery SVG ───────────────────────────────────────────────────────

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
    className="relative flex items-center px-4 h-13 border-b border-gray-500/12 font-cascadia-code"
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
    <div className="absolute top-0 left-0 right-0 h-6 bg-[rgba(30,30,30,0.82)] backdrop-blur-[20px] flex items-center pr-2 pl-2.5 z-5 font-cascadia-code">
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

const DOCK_ICON_COLOR = 'rgba(255,255,255,0.7)';

const DOCK_APPS: React.ReactNode[] = [
  <IoCompass size={20} color={DOCK_ICON_COLOR} />,
  <IoDocumentText size={20} color={DOCK_ICON_COLOR} />,
  <IoChatbubble size={20} color={DOCK_ICON_COLOR} />,
  <IoGrid size={20} color={DOCK_ICON_COLOR} />,
  <IoMusicalNotes size={20} color={DOCK_ICON_COLOR} />,
  <IoVideocam size={20} color={DOCK_ICON_COLOR} />,
  <IoImage size={20} color={DOCK_ICON_COLOR} />,
  <IoMail size={20} color={DOCK_ICON_COLOR} />,
];

export const DOCK_HEIGHT = 54;

export const MacOSDock: React.FC = () => (
  <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 z-5 flex items-center gap-1.5 py-1 px-2 rounded-2xl bg-[rgba(40,40,40,0.45)] border-[0.5px] border-white/18">
    {DOCK_APPS.map((icon, i) => (
      <div
        key={i}
        className="w-9 h-9 rounded-lg bg-white/8 border-[0.5px] border-white/12 flex items-center justify-center"
      >
        {icon}
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

export interface WindowFrameProps {
  windowStyle: 'macos' | 'windows' | 'none';
  borderRadius: number;
  shadowSize: string;
  themeBg: string;
  children: React.ReactNode;
}

const SHADOW_MAP: Record<string, string> = {
  none: '',
  sm: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
  md: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)',
  lg: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
  xl: '0 25px 50px -12px rgba(0,0,0,0.25)',
};

export const WindowFrame: React.FC<WindowFrameProps> = ({
  windowStyle,
  borderRadius,
  shadowSize,
  themeBg,
  children,
}) => {
  // macOS: subtle semi-transparent border. Windows: thin solid border.
  const borderStyle =
    windowStyle === 'macos'
      ? '0.5px solid rgba(255,255,255,0.1)'
      : windowStyle === 'windows'
        ? '1px solid rgba(128,128,128,0.15)'
        : 'none';

  return (
    <div
      className="relative overflow-hidden"
      style={{
        borderRadius: `${borderRadius}px`,
        boxShadow: SHADOW_MAP[shadowSize] || '',
        backgroundColor: themeBg,
        border: borderStyle,
      }}
    >
      {children}
    </div>
  );
};
