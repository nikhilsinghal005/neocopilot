import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import '@vscode/codicons/dist/codicon.css';
import { VSCodeButton } from '@vscode/webview-ui-toolkit/react';
import { LOGIN_REDIRECT_URL } from '../config'; // Importing the login URL
const Login = ({ vscode }) => {
    const handleLogin = () => {
        // Send a 'login' message to the extension with the redirect URL
        vscode.postMessage({
            command: 'login',
            url: LOGIN_REDIRECT_URL,
        });
    };
    const handleCreateAccount = () => {
        console.log('Create Account button clicked');
        // You can implement additional logic here if needed
    };
    return (_jsxs("div", { className: "login-container flex flex-col justify-center items-center max-h-full p-4 overflow-hidden", children: [_jsx("h2", { className: "welcome-text text-center mb-6 mt-2 text-vscode-editor-foreground", children: "Welcome! Please log in or sign up to continue." }), _jsxs("div", { className: "button-group w-full max-w-lg flex flex-col gap-3", children: [_jsx(VSCodeButton, { className: "login-button w-full h-9 text-base", onClick: handleLogin, children: "Login" }), _jsx(VSCodeButton, { className: "create-account-button w-full h-9 text-base", onClick: handleCreateAccount, appearance: "secondary", children: "Create Account" })] })] }));
};
export default Login;
