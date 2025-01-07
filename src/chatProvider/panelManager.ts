import * as vscode from 'vscode';

export class PanelManager {
    private _context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this._context = context;
    }

    private async delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async togglePanelLocationChange(): Promise<void> {
        try {
            ("Starting the panel location change process...");

            // Write the desired option to the clipboard
            vscode.commands.executeCommand('workbench.action.moveView');
            await this.delay(100);

            await vscode.env.clipboard.writeText("Neo Chat Panel");
            await vscode.commands.executeCommand('editor.action.clipboardPasteAction');
            await this.delay(5);
            await vscode.commands.executeCommand('workbench.action.acceptSelectedQuickOpenItem');

            await this.delay(10);
            await vscode.env.clipboard.writeText("Side Bar Entry");
            await vscode.commands.executeCommand('editor.action.clipboardPasteAction');
            await this.delay(5);
            await vscode.commands.executeCommand('workbench.action.acceptSelectedQuickOpenItem');

            await vscode.commands.executeCommand('aiChatPanelPrimary.focus');
        } catch (error) {
            console.error("Error during panel location toggle:", error);
        }
    }
}
