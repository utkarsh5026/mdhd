import { ChevronDown, Pause, Play, SkipForward, Square, Volume2 } from 'lucide-react';
import { memo, useMemo, useState } from 'react';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

import { useTTSContext } from '../../context/tts-context';

interface TTSControlsProps {
  className?: string;
}

const SPEED_PRESETS = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

const TTSControls: React.FC<TTSControlsProps> = memo(({ className }) => {
  const {
    ttsStatus,
    voices,
    currentVoice,
    speed,
    autoAdvance,
    togglePlayPause,
    stop,
    setSpeed,
    setVoice,
    toggleAutoAdvance,
  } = useTTSContext();

  const [voiceOpen, setVoiceOpen] = useState(false);
  const [speedOpen, setSpeedOpen] = useState(false);

  const isPlaying = ttsStatus === 'playing';
  const isPaused = ttsStatus === 'paused';
  const isActive = isPlaying || isPaused;

  // Group voices by language
  const groupedVoices = useMemo(() => {
    const groups = new Map<string, SpeechSynthesisVoice[]>();
    for (const voice of voices) {
      const lang = voice.lang.split('-')[0];
      if (!groups.has(lang)) groups.set(lang, []);
      groups.get(lang)!.push(voice);
    }
    return groups;
  }, [voices]);

  // English voices first, then others
  const sortedVoices = useMemo(() => {
    const en = groupedVoices.get('en') ?? [];
    const rest = [...voices].filter((v) => !v.lang.startsWith('en'));
    return [...en, ...rest];
  }, [voices, groupedVoices]);

  if (!isActive) return null;

  return (
    <div
      className={cn(
        'flex items-center gap-1 rounded-full px-2 py-1.5',
        'bg-foreground/5 backdrop-blur-md border border-foreground/10',
        'transition-all duration-300',
        isActive && 'bg-primary/10 border-primary/20',
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Play / Pause */}
      <button
        onClick={togglePlayPause}
        aria-label={isPlaying ? 'Pause narration' : 'Play narration'}
        className={cn(
          'touch-manipulation p-2 rounded-full transition-all duration-200',
          'text-foreground/70 hover:text-foreground hover:bg-foreground/8 active:scale-95',
          isPlaying && 'text-primary hover:text-primary'
        )}
      >
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </button>

      {/* Stop */}
      <button
        onClick={stop}
        disabled={!isActive}
        aria-label="Stop narration"
        className={cn(
          'touch-manipulation p-2 rounded-full transition-all duration-200',
          isActive
            ? 'text-foreground/70 hover:text-foreground hover:bg-foreground/8 active:scale-95'
            : 'text-foreground/15 cursor-not-allowed'
        )}
      >
        <Square className="h-3.5 w-3.5" />
      </button>

      {/* Speed control */}
      <Popover open={speedOpen} onOpenChange={setSpeedOpen}>
        <PopoverTrigger asChild>
          <button
            aria-label="Narration speed"
            className={cn(
              'touch-manipulation px-2 py-1.5 rounded-full transition-all duration-200',
              'text-xs font-medium tabular-nums',
              'text-foreground/70 hover:text-foreground hover:bg-foreground/8'
            )}
          >
            {speed.toFixed(1)}x
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-3" side="top" align="center">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Speed</span>
              <span className="text-xs font-medium tabular-nums">{speed.toFixed(1)}x</span>
            </div>
            <Slider
              min={0.5}
              max={2.0}
              step={0.1}
              value={[speed]}
              onValueChange={([v]) => setSpeed(v)}
            />
            <div className="flex gap-1 flex-wrap">
              {SPEED_PRESETS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={cn(
                    'px-2 py-0.5 text-xs rounded-md transition-colors',
                    speed === s
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Voice selector */}
      {voices.length > 0 && (
        <Popover open={voiceOpen} onOpenChange={setVoiceOpen}>
          <PopoverTrigger asChild>
            <button
              aria-label="Select voice"
              className={cn(
                'touch-manipulation flex items-center gap-1 px-2 py-1.5 rounded-full transition-all duration-200',
                'text-xs font-medium max-w-30',
                'text-foreground/70 hover:text-foreground hover:bg-foreground/8'
              )}
            >
              <Volume2 className="h-3 w-3 shrink-0" />
              <span className="truncate">
                {currentVoice?.name.split(' ').slice(0, 2).join(' ') ?? 'Default'}
              </span>
              <ChevronDown className="h-3 w-3 shrink-0" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2 max-h-60 overflow-y-auto" side="top" align="center">
            <div className="space-y-0.5">
              {sortedVoices.map((voice) => (
                <button
                  key={voice.voiceURI}
                  onClick={() => {
                    setVoice(voice);
                    setVoiceOpen(false);
                  }}
                  className={cn(
                    'w-full text-left px-2 py-1.5 rounded-md text-xs transition-colors',
                    'hover:bg-accent/60',
                    currentVoice?.voiceURI === voice.voiceURI &&
                      'bg-primary/10 text-primary font-medium'
                  )}
                >
                  <div className="truncate">{voice.name}</div>
                  <div className="text-[10px] text-muted-foreground">{voice.lang}</div>
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* Auto-advance toggle */}
      <div
        className={cn(
          'flex items-center gap-1.5 px-2 py-1',
          'border-l border-foreground/10 ml-0.5'
        )}
      >
        <SkipForward
          className={cn(
            'h-3 w-3 transition-colors',
            autoAdvance ? 'text-primary' : 'text-muted-foreground'
          )}
        />
        <Switch
          checked={autoAdvance}
          onCheckedChange={toggleAutoAdvance}
          className="scale-75 origin-left"
          aria-label="Auto-advance sections"
        />
      </div>
    </div>
  );
});

TTSControls.displayName = 'TTSControls';

export default TTSControls;
