import { Volume2, Music, Bell, Moon, Globe, ChevronRight } from 'lucide-react';
import { useGame } from '@/context/GameContext';

interface SettingItemProps {
  icon: React.ElementType;
  label: string;
  value?: string;
  toggleEnabled?: boolean;
  hasChevron?: boolean;
  onClick?: () => void;
  onToggle?: (enabled: boolean) => void;
}

function SettingItem({
  icon: Icon,
  label,
  value,
  toggleEnabled,
  hasChevron,
  onClick,
  onToggle,
}: SettingItemProps) {
  return (
    <div className="flex w-full items-center justify-between border-b border-white/8 px-1 py-3 last:border-b-0">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-md bg-white/8 flex items-center justify-center">
          <Icon className="w-3.5 h-3.5 text-white/60" />
        </div>
        <span className="text-white text-[11px]">{label}</span>
      </div>

      <div className="flex items-center gap-1.5">
        {value && <span className="text-white/35 text-[11px]">{value}</span>}

        {typeof toggleEnabled === 'boolean' && onToggle && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggle(!toggleEnabled);
            }}
            className={`w-9 h-5 rounded-full transition-colors relative ${
              toggleEnabled ? 'bg-amber-400' : 'bg-white/15'
            }`}
            aria-pressed={toggleEnabled}
            aria-label={`${label} ${toggleEnabled ? 'enabled' : 'disabled'}`}
          >
            <div
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                toggleEnabled ? 'left-[18px]' : 'left-0.5'
              }`}
            />
          </button>
        )}

        {hasChevron ? (
          <button
            type="button"
            onClick={onClick}
            className="flex items-center text-white/35 transition-colors hover:text-white/50"
            aria-label={`Open ${label}`}
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function SettingsScreen() {
  const { state, dispatch } = useGame();

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #0a0a0f 0%, #1a1a2e 100%)',
        }}
      />

      {/* Header */}
      <div className="relative z-10 pt-6 pb-3 px-4">
        <h1 className="text-white text-base font-bold">Settings</h1>
        <p className="text-white/40 text-[11px] mt-0.5">Customize your experience</p>
      </div>

      {/* Settings list */}
      <div className="relative z-10 px-4 pb-20 overflow-y-auto h-[calc(100%-70px)]">
        {/* Audio Section */}
        <div className="mb-4">
          <h2 className="text-white/35 text-[9px] uppercase tracking-wider mb-1.5">Audio</h2>
          <div className="bg-white/5 rounded-xl px-3">
            <SettingItem
              icon={Volume2}
              label="Sound Effects"
              value="Soon"
            />
            <SettingItem
              icon={Music}
              label="Background Music"
              toggleEnabled={state.musicEnabled}
              onToggle={(enabled) =>
                dispatch({ type: 'SET_MUSIC_ENABLED', payload: enabled })
              }
            />
          </div>
        </div>

        {/* Notifications Section */}
        <div className="mb-4">
          <h2 className="text-white/35 text-[9px] uppercase tracking-wider mb-1.5">Notifications</h2>
          <div className="bg-white/5 rounded-xl px-3">
            <SettingItem
              icon={Bell}
              label="Push Notifications"
              value="Soon"
            />
          </div>
        </div>

        {/* Appearance Section */}
        <div className="mb-4">
          <h2 className="text-white/35 text-[9px] uppercase tracking-wider mb-1.5">Appearance</h2>
          <div className="bg-white/5 rounded-xl px-3">
            <SettingItem
              icon={Moon}
              label="Dark Mode"
              value="Always on"
              hasChevron
            />
            <SettingItem
              icon={Globe}
              label="Language"
              value="English"
              hasChevron
            />
          </div>
        </div>

        {/* About */}
        <div className="mt-6 text-center">
          <p className="text-white/25 text-[10px]">Insta v1.0</p>
          <p className="text-white/15 text-[9px] mt-0.5">Snap your world. Play your story.</p>
        </div>
      </div>
    </div>
  );
}
