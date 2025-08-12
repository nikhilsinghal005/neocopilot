import React from 'react';
import ApiConfiguration from './ApiConfiguration';
import { SettingsProvider } from '../state/SettingsContext';

interface SettingsViewProps { onClose: () => void; }

const settingsView: React.FC<SettingsViewProps> = ({ onClose }) => (
  <SettingsProvider>
    <div style={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Settings</h2>
        <button onClick={onClose}>Close</button>
      </header>
      <section style={{ flex: 1, overflowY: 'auto' }}>
        <ApiConfiguration />
      </section>
      <footer style={{ fontSize: '0.75rem', opacity: 0.7 }}>
        Changes must be saved per provider. Keys are stored locally.
      </footer>
    </div>
  </SettingsProvider>
);

export default settingsView;