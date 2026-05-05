/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BookProvider } from './context/BookContext';
import { AppLayout } from './components/layout/AppLayout';
import { EditorView } from './components/views/EditorView';
import { StyleView } from './components/views/StyleView';
import { CoverView } from './components/views/CoverView';
import { ExportView } from './components/views/ExportView';
import { SettingsView } from './components/views/SettingsView';

function AppContent() {
  const [activeTab, setActiveTab] = useState('editor');

  const renderView = () => {
    switch (activeTab) {
      case 'editor': return <EditorView />;
      case 'style': return <StyleView />;
      case 'cover': return <CoverView />;
      case 'export': return <ExportView />;
      case 'settings': return <SettingsView />;
      default: return <EditorView />;
    }
  };

  return (
    <AppLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderView()}
    </AppLayout>
  );
}

export default function App() {
  return (
    <BookProvider>
      <AppContent />
    </BookProvider>
  );
}
