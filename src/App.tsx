/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { HomeTemplatesView } from './components/HomeTemplatesView';
import { EditorView } from './components/EditorView';
import { DesignTemplate, DEFAULT_LOGO_URL } from './types/newsPost';

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'editor'>('home');
  const [selectedTemplate, setSelectedTemplate] = useState<DesignTemplate>('design1');
  const [customLogoUrl, setCustomLogoUrl] = useState<string>(() => {
    return localStorage.getItem('jonomanch_custom_logo') || DEFAULT_LOGO_URL;
  });

  const handleSelectTemplate = (template: DesignTemplate) => {
    setSelectedTemplate(template);
    setCurrentView('editor');
  };

  const handleUpdateLogo = (newLogoUrl: string) => {
    setCustomLogoUrl(newLogoUrl);
    try {
      localStorage.setItem('jonomanch_custom_logo', newLogoUrl);
    } catch (e) {
      console.warn('Could not save logo to localStorage:', e);
    }
  };

  const handleResetLogo = () => {
    setCustomLogoUrl(DEFAULT_LOGO_URL);
    try {
      localStorage.removeItem('jonomanch_custom_logo');
    } catch (e) {
      console.warn('Could not remove logo from localStorage:', e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-hind antialiased selection:bg-red-500 selection:text-white">
      {currentView === 'home' ? (
        <HomeTemplatesView
          onSelectTemplate={handleSelectTemplate}
          customLogoUrl={customLogoUrl}
        />
      ) : (
        <EditorView
          initialTemplate={selectedTemplate}
          onBackToHome={() => setCurrentView('home')}
          customLogoUrl={customLogoUrl}
          onUpdateLogo={handleUpdateLogo}
          onResetLogo={handleResetLogo}
        />
      )}
    </div>
  );
}
