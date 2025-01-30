// webview-chat/src/components/Login.tsx

import React from 'react';
import '@vscode/codicons/dist/codicon.css';
import { VSCodeButton } from '@vscode/webview-ui-toolkit/react';
import { LOGIN_REDIRECT_URL } from '../config'; // Importing the login URL

interface LoginProps {
  vscode: {
    postMessage: (msg: any) => void;
  };
}

const Login: React.FC<LoginProps> = ({ vscode }) => {
  const handleLogin = () => {
    // Send a 'login' message to the extension with the redirect URL
    vscode.postMessage({
      command: 'login',
      url: LOGIN_REDIRECT_URL,
    });
  };

  const handleCreateAccount = () => {
    // // console.log('Create Account button clicked');
    // You can implement additional logic here if needed
  };

  return (
    <div className="login-container flex flex-col justify-center items-center max-h-full p-4 overflow-hidden">
      <h2 className="welcome-text text-center mb-6 mt-2 text-vscode-editor-foreground">
        Welcome! Please log in or sign up to continue.
      </h2>
      <div className="button-group w-full max-w-lg flex flex-col gap-3">
        <VSCodeButton className="login-button w-full h-9 text-base" onClick={handleLogin}>
          Login
        </VSCodeButton>
        <VSCodeButton
          className="create-account-button w-full h-9 text-base"
          onClick={handleCreateAccount}
          appearance="secondary"
        >
          Create Account
        </VSCodeButton>
      </div>
    </div>
  );
};

export default Login;
