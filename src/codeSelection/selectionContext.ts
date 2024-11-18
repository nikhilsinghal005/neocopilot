import * as vscode from 'vscode';

export enum CodeSelectionCommand {
    CODE_FACTOR = 'extension.neoEdit',
    CHAT_INSERT = 'extension.neoChatInsert',
  }

export class SelectionContext {
    // Shared hover cache to be accessed by multiple classes
    public hoverCache: Map<string, vscode.Hover> = new Map();
    public decorationType: vscode.TextEditorDecorationType;

    // Other shared properties or state
    private static instance: SelectionContext; // Singleton instance

    // Private constructor to prevent direct instantiation
    public constructor() {
        this.decorationType = vscode.window.createTextEditorDecorationType({
            after: {
                contentText: 'NEO: Ctrl+O for chat and Ctrl+I for Inline Edit',
                color: new vscode.ThemeColor('editorLineNumber.foreground'),
                margin: '0 0 0 0',
            },
        });

    }

    // Public method to get the single instance of SelectionContext
    public static getInstance(): SelectionContext {
        if (!SelectionContext.instance) {
            SelectionContext.instance = new SelectionContext();
        }
        return SelectionContext.instance;
    }

    // Method to clear hover cache
    public clearHoverCache() {
        this.hoverCache.clear();
    }
}
