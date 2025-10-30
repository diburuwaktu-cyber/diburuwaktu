import React from 'react';
import { AppView } from '../types';
import { SpreadsheetIcon } from './icons';

interface HeaderProps {
  currentView: AppView;
  setView: (view: AppView) => void;
  navItems: { view: AppView; label: string; icon: React.ReactNode }[];
  imageCount: number;
}

const Header: React.FC<HeaderProps> = ({ currentView, setView, navItems, imageCount }) => {

  const handleSpreadsheetClick = () => {
    window.dispatchEvent(new Event('triggerSpreadsheetUpload'));
  };

  return (
    <header className="bg-gray-800/50 backdrop-blur-sm sticky top-0 z-50 shadow-lg">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between py-4">
          <h1 className="text-2xl font-bold text-white mb-4 sm:mb-0">
            <span className="text-purple-400">Gemini</span> AI Photo Studio
          </h1>
          <div className="flex items-center flex-wrap justify-center gap-2">
            <nav className="flex flex-wrap justify-center gap-2">
              {navItems.map(({ view, label, icon }) => (
                <button
                  key={view}
                  onClick={() => setView(view)}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500 ${
                    currentView === view
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {icon}
                  <span className="hidden md:inline">{label}</span>
                </button>
              ))}
            </nav>
            
            {currentView === AppView.EDITOR && (
                <button
                    onClick={handleSpreadsheetClick}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-green-500 bg-green-700 text-white hover:bg-green-600"
                >
                    <SpreadsheetIcon className="w-5 h-5" />
                    <span className="hidden md:inline">Teks dari File</span>
                </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;