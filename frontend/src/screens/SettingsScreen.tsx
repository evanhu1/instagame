import { Volume2, Music, Bell, Moon, Globe, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface SettingItemProps {
  icon: React.ElementType;
  label: string;
  value?: string;
  hasToggle?: boolean;
  hasChevron?: boolean;
  onClick?: () => void;
}

function SettingItem({ icon: Icon, label, value, hasToggle, hasChevron, onClick }: SettingItemProps) {
  const [isEnabled, setIsEnabled] = useState(true);

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between py-3 px-1 border-b border-white/8 active:scale-[0.99] transition-transform last:border-b-0"
    >
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-md bg-white/8 flex items-center justify-center">
          <Icon className="w-3.5 h-3.5 text-white/60" />
        </div>
        <span className="text-white text-[11px]">{label}</span>
      </div>

      <div className="flex items-center gap-1.5">
        {value && <span className="text-white/35 text-[11px]">{value}</span>}

        {hasToggle && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEnabled(!isEnabled);
            }}
            className={`w-9 h-5 rounded-full transition-colors relative ${
              isEnabled ? 'bg-amber-400' : 'bg-white/15'
            }`}
          >
            <div
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                isEnabled ? 'left-[18px]' : 'left-0.5'
              }`}
            />
          </button>
        )}

        {hasChevron && <ChevronRight className="w-3.5 h-3.5 text-white/30" />}
      </div>
    </button>
  );
}

export function SettingsScreen() {
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
              hasToggle
            />
            <SettingItem
              icon={Music}
              label="Background Music"
              hasToggle
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
              hasToggle
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
