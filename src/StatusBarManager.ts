import * as vscode from 'vscode';

export class StatusBarManager {
    private static statusBar: vscode.StatusBarItem;

    public static initializeStatusBar() {
        if (!StatusBarManager.statusBar) {
            StatusBarManager.statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
            StatusBarManager.statusBar.tooltip = 'Neo Copilot';
            StatusBarManager.statusBar.show();
        }
    }

    public static updateMessage(text: string) {
        if (!StatusBarManager.statusBar) {
            StatusBarManager.initializeStatusBar();
        }
        StatusBarManager.statusBar.text = text;
    }
}
