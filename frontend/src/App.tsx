import { AnimatePresence, motion } from 'framer-motion';
import { useGame } from '@/context/GameContext';
import { CameraScreen } from '@/screens/CameraScreen';
import { LoadingScreen } from '@/screens/LoadingScreen';
import { StoryScreen } from '@/screens/StoryScreen';
import { SummaryScreen } from '@/screens/SummaryScreen';
import { ArchiveScreen } from '@/screens/ArchiveScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { BottomNav } from '@/components/BottomNav';
import './App.css';

// Phone Frame Component - renders the app inside a phone mockup
function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="phone-container">
      {/* Phone bezel */}
      <div className="phone-bezel">
        {/* Power button */}
        <div className="phone-power-btn" />
        {/* Volume buttons */}
        <div className="phone-volume-btns" />
        
        {/* Phone screen */}
        <div className="phone-screen">
          {/* Dynamic Island / Notch */}
          <div className="phone-notch">
            <div className="phone-camera" />
          </div>
          
          {/* Status bar */}
          <div className="phone-status-bar">
            <span className="phone-time">9:41</span>
            <div className="phone-status-icons">
              <svg className="w-4 h-3" viewBox="0 0 24 14" fill="white">
                <path d="M2 10h16v2H2zM2 6h12v2H2zM2 2h8v2H2z"/>
              </svg>
              <svg className="w-4 h-3" viewBox="0 0 24 14" fill="white">
                <path d="M18 2a4 4 0 014 4v2a4 4 0 01-4 4V2zM12 5a4 4 0 014 4v1a4 4 0 01-4 4V5z"/>
              </svg>
              <div className="phone-battery">
                <div className="phone-battery-level" />
              </div>
            </div>
          </div>

          {/* App content */}
          <div className="phone-content">
            {children}
          </div>

          {/* Home indicator */}
          <div className="phone-home-indicator" />
        </div>
      </div>
      
      {/* Reflection effect */}
      <div className="phone-reflection" />
    </div>
  );
}

// Main content based on current tab and screen
function AppContent() {
  const { state, dispatch } = useGame();

  const isInGameplay = ['story', 'loading', 'summary'].includes(state.currentScreen);

  const handleBack = () => {
    if (state.currentScreen === 'story' && state.story) {
      dispatch({ type: 'SET_SCREEN', payload: 'summary' });
      return;
    }

    if (isInGameplay) {
      dispatch({ type: 'SET_SCREEN', payload: 'camera' });
      dispatch({ type: 'SET_TAB', payload: 'home' });
    }
  };

  const renderContent = () => {
    if (state.currentScreen === 'loading') return <LoadingScreen />;
    if (state.currentScreen === 'story') return <StoryScreen onBack={handleBack} />;
    if (state.currentScreen === 'summary') return <SummaryScreen />;

    if (state.currentTab === 'home') {
      return <CameraScreen />;
    }
    if (state.currentTab === 'archive') return <ArchiveScreen />;
    if (state.currentTab === 'settings') return <SettingsScreen />;

    return <CameraScreen />;
  };

  return (
    <div className="relative w-full h-full">
      {/* Main content area */}
      <div className="w-full h-full pb-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${state.currentTab}-${state.currentScreen}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom navigation - hide during gameplay */}
      {!isInGameplay && <BottomNav />}
    </div>
  );
}

// Web page wrapper with phone mockup
function WebPage() {
  return (
    <div className="web-page">
      {/* Header */}
      <header className="web-header">
        <h1 className="web-title">Insta</h1>
        <p className="web-subtitle">Snap your world. Play your story.</p>
      </header>

      {/* Main content - Phone mockup */}
      <main className="web-main">
        <PhoneFrame>
          <AppContent />
        </PhoneFrame>
      </main>

      {/* Footer info */}
      <footer className="web-footer">
        <p>Upload any photo. Choose a genre. Start your adventure.</p>
        <div className="web-features">
          <span>📸 Photo to Game</span>
          <span>🎮 Play Anywhere</span>
          <span>🌍 Your World, Your Story</span>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return <WebPage />;
}

export default App;
