
import React, { useState } from 'react';
import { AppView } from './types';
import Header from './components/Header';
import ImageEditor from './components/ImageEditor';
import Settings from './components/Settings';
import { PhotoIcon, Cog6ToothIcon } from './components/icons';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.EDITOR);
  const [imageCount, setImageCount] = useState(0);

  const renderView = () => {
    switch (view) {
      case AppView.EDITOR:
        return <ImageEditor onImageCountChange={setImageCount} />;
      case AppView.SETTINGS:
        return <Settings />;
      default:
        return <ImageEditor onImageCountChange={setImageCount} />;
    }
  };
  
  const navItems = [
    { view: AppView.EDITOR, label: 'Editor', icon: <PhotoIcon className="w-5 h-5" /> },
    { view: AppView.SETTINGS, label: 'Settings', icon: <Cog6ToothIcon className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex flex-col">
      <Header currentView={view} setView={setView} navItems={navItems} imageCount={imageCount}/>
      <main className="flex-grow p-4 md:p-8 container mx-auto">
        {renderView()}
      </main>
      <footer className="text-center p-4 text-gray-500 text-xs border-t border-gray-800">
        <p>Powered by Google Gemini. All generated content is AI-based.</p>
      </footer>
    </div>
  );
};

export default App;