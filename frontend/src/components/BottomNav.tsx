import { motion } from 'framer-motion';
import { Home, BookOpen, Settings } from 'lucide-react';
import { useGame } from '@/context/GameContext';
import type { TabScreen } from '@/types/game';

interface BottomNavProps {
  onTabChange?: (tab: TabScreen) => void;
}

export function BottomNav({ onTabChange }: BottomNavProps) {
  const { state, dispatch } = useGame();

  const tabs: { id: TabScreen; icon: typeof Home; label: string }[] = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'archive', icon: BookOpen, label: 'Memory' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  const handleTabClick = (tabId: TabScreen) => {
    dispatch({ type: 'SET_TAB', payload: tabId });
    onTabChange?.(tabId);
  };

  return (
    <div className="absolute bottom-3 left-6 right-6 z-50">
      <div className="bg-black/70 backdrop-blur-xl rounded-full border border-white/10 px-1 py-1">
        <div className="flex items-center justify-around">
          {tabs.map((tab) => {
            const isActive = state.currentTab === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className="relative flex items-center gap-1.5 px-4 py-1.5 rounded-full transition-colors"
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-white/10 rounded-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
                <Icon
                  className={`relative z-10 w-4 h-4 transition-colors ${
                    isActive ? 'text-amber-400' : 'text-white/40'
                  }`}
                />
                {isActive && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="relative z-10 text-[10px] text-amber-400 font-medium"
                  >
                    {tab.label}
                  </motion.span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
