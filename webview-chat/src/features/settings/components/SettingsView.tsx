import React from 'react';

interface SettingsViewProps {
  onClose: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ onClose }) => {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Settings</h1>
      <div style={{ margin: '20px 0' }}>
        <label htmlFor="model-select">Choose a model:</label>
        <select name="models" id="model-select">
          <option value="gpt-4">GPT-4</option>
          <option value="claude-3">Claude 3</option>
          <option value="gemini-pro">Gemini Pro</option>
        </select>
      </div>
      <button onClick={onClose}>Close</button>
    </div>
  );
};

export default SettingsView;