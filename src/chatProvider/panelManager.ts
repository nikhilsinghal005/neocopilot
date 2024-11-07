import * as vscode from 'vscode';

export class PanelManager {
    private _context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this._context = context;
    }

    async getCurrentPanelLocation(): Promise<string> {
        try {
            // First, try to focus on the webview in the primary sidebar
            let isInPrimary = false;
            try {
                await vscode.commands.executeCommand('aiChatPanelPrimary.focus');
                isInPrimary = true;
            } catch {
                isInPrimary = false;
            }
            
            if (isInPrimary) {
                console.log("Webview is in the Primary Sidebar.");
                return "primary";
            }
    
            // If it's not in the primary sidebar, try the secondary sidebar
            await vscode.commands.executeCommand('workbench.action.focusAuxiliaryBar'); // Focus the secondary sidebar
            let isInSecondary = false;
            try {
                await vscode.commands.executeCommand('aiChatPanelPrimary.focus');
                isInSecondary = true;
            } catch {
                isInSecondary = false;
            }
            
            if (isInSecondary) {
                console.log("Webview is in the Secondary Sidebar.");
                return "secondary";
            }
    
            // Lastly, if it's not in the primary or secondary sidebar, assume it's elsewhere or not visible
            console.log("Webview is not in a known sidebar. It might be hidden or in another panel.");
            return "unknown";
    
        } catch (error) {
            console.error("Error determining the panel location:", error);
            return "unknown";
        }
    }   

    async togglePanelLocationChange(): Promise<void> {
        await this.getCurrentPanelLocation();
        await this._context.workspaceState.update('currentPanelLocation', 'secondary');
        const currentLocation = this._context.workspaceState.get('currentPanelLocation', 'primary');
        // console.log(`Current Panel Location: ${currentLocation}`);

        if (currentLocation === 'primary') {
            console.log("Attempting to open the secondary sidebar...");
            try {
                await vscode.commands.executeCommand('workbench.action.focusAuxiliaryBar');
                await vscode.commands.executeCommand('aiChatPanelPrimary.focus');
                const desiredOption = "New Secondary Side Bar Entry";
                await vscode.env.clipboard.writeText(desiredOption);
                await vscode.commands.executeCommand('workbench.action.moveFocusedView');
                await new Promise(resolve => setTimeout(resolve, 20));
                await vscode.commands.executeCommand('editor.action.clipboardPasteAction');
                await new Promise(resolve => setTimeout(resolve, 20));
                await vscode.commands.executeCommand('workbench.action.acceptSelectedQuickOpenItem');

                // Update the workspace state
                await this._context.workspaceState.update('currentPanelLocation', 'secondary');
            } catch (error) {
                console.log("Failed to move webview to the secondary sidebar:", error);
                console.error("Failed to move webview to the secondary sidebar:");
            }
        } else {
            console.log("Switching to the primary sidebar...");
            try {
                const desiredOption = "New Side Bar Entry";
                await vscode.env.clipboard.writeText(desiredOption);
                await vscode.commands.executeCommand('workbench.action.moveFocusedView');
                await new Promise(resolve => setTimeout(resolve, 20));
                await vscode.commands.executeCommand('editor.action.clipboardPasteAction');
                await new Promise(resolve => setTimeout(resolve, 20));
                await vscode.commands.executeCommand('workbench.action.acceptSelectedQuickOpenItem');
                await vscode.commands.executeCommand('aiChatPanelPrimary.focus');
            } catch (error) {
                console.log("Failed to open the primary sidebar:", error);
                console.error("Failed to open the primary sidebar:");
            }
        }
    }
}
