import * as vscode from 'vscode';
import { LOGIN_REDIRECT_URL } from './config';
import { showLoginNotification } from './utilities/statusBarNotifications/showLoginNotification';
import { VscodeEventsModule } from './codeCompletion/vscodeEventsModule';

export class StatusBarManager {
    private static statusBar: vscode.StatusBarItem | undefined = undefined;
    private static activeStatusBarCommand: string | undefined = undefined; // Corrected declaration
    
    public static initializeStatusBar(
        isLoggedIn: boolean, 
        context: vscode.ExtensionContext,
        vscodeEventsModule: VscodeEventsModule
    ) {
        if (!StatusBarManager.statusBar) {
            StatusBarManager.statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
            StatusBarManager.statusBar.tooltip = 'Neo Copilot';

        }
        // Update the status bar text based on login status
        if (isLoggedIn) {
            StatusBarManager.registerAfterLoginCommand(isLoggedIn, context, vscodeEventsModule);
            StatusBarManager.statusBar.command = 'extension.statusBarClickAfterLogin'; // Command triggered on click
            StatusBarManager.statusBar.show();
            StatusBarManager.statusBar.text = '$(check) Neo Copilot';
        } else {
            StatusBarManager.registerBeforeLoginCommand(context);
            StatusBarManager.statusBar.command = 'extension.statusBarClickBeforeLogin'; // Command triggered on click
            StatusBarManager.statusBar.show();
            StatusBarManager.statusBar.text = '$(sign-in) Neo Copilot';
        }
        StatusBarManager.statusBar.show();
    }

    public static initializeLogoutStatusBar(
        context: vscode.ExtensionContext
    ) {
        if (!StatusBarManager.statusBar) {
            StatusBarManager.statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
            StatusBarManager.statusBar.tooltip = 'Neo Copilot';
        }

        StatusBarManager.registerBeforeLoginCommand(context);
        StatusBarManager.statusBar.command = 'extension.statusBarClickBeforeLogin'; // Command triggered on click
        StatusBarManager.statusBar.show();
        StatusBarManager.statusBar.text = '$(sign-in) Neo Copilot';
        StatusBarManager.statusBar.show();
    }

    private static registerAfterLoginCommand(isLoggedIn: boolean, context: vscode.ExtensionContext, vscodeEventsModule: VscodeEventsModule) {
        const commandId = 'extension.statusBarClickAfterLogin';

        const commandHandler = async () => {  // Marking the function as async
            if (!vscodeEventsModule.isDisabled15Minutes) {

                const result = await vscode.window.showInformationMessage(
                    "Click the button below to disable Neo Copilot for 15 minutes",
                    "Disable Neo Copilot (15 Min)"
                );
                if (result === "Disable Neo Copilot (15 Min)") {
                    // console.log("Disable Neo Copilot (15min)");
                    vscodeEventsModule.disableFor15Minutes()
                }
            }else {
                const result = await vscode.window.showInformationMessage(
                    "Click the button below to disable Neo Copilot for 15 minutes",
                    "Enable Neo Copilot"
                );
                if (result === "Enable Neo Copilot") {
                    // console.log("Enable Neo Copilot");
                    vscodeEventsModule.enableCodeCompletion()
                }
            }
        };
        vscode.commands.getCommands(true).then(commands => {
            if (!commands.includes('extension.statusBarClickAfterLogin')) {
                context.subscriptions.push(vscode.commands.registerCommand(commandId, commandHandler));
            }
        });
        // context.subscriptions.push(vscode.commands.registerCommand(commandId, commandHandler));

    }

    public static registerBeforeLoginCommand(context: vscode.ExtensionContext) {

        const commandId = 'extension.statusBarClickBeforeLogin';
        const commandHandler = async () => {  // Marking the function as async
            showLoginNotification(0);
        };
        vscode.commands.getCommands(true).then(commands => {
            if (!commands.includes('extension.statusBarClickBeforeLogin')) {
                context.subscriptions.push(vscode.commands.registerCommand(commandId, commandHandler));
            }
        });
    }

    public static updateMessage(text: string) {
        if (StatusBarManager.statusBar){
            StatusBarManager.statusBar.text = text;
        }
    }
}
