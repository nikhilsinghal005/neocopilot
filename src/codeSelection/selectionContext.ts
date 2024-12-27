import * as vscode from 'vscode';

export enum CodeSelectionCommand {
    CODE_FACTOR = 'extension.neoEdit',
    CHAT_INSERT = 'extension.neoChatInsert',
  }

export class SelectionContext {

    // Shared hover cache to be accessed by multiple classes
    public hoverCache: Map<string, vscode.Hover> = new Map();
    public decorationType: vscode.TextEditorDecorationType;
    public lastHoverPosition: vscode.Position | null = null;
    public lastSelection: vscode.Selection | null = null;
    public exetndedRange: vscode.Range | undefined;

    // Other shared properties or state
    private static instance: SelectionContext; // Singleton instance
    public hoverCancellationTokenSource: vscode.CancellationTokenSource | null = null;

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

    public createFixedHover(expandedRange: vscode.Range, selectedText: string): vscode.Hover | undefined {
        const markdownContent = new vscode.MarkdownString();

        // Add command buttons
        markdownContent.appendMarkdown(
            `[Insert in Chat(Ctrl+O)](command:${CodeSelectionCommand.CHAT_INSERT} "Talk to Code") | ` +
            `[Edit Inline(Ctrl+I)](command:${CodeSelectionCommand.CODE_FACTOR} "Edit Code")`
        );
        markdownContent.isTrusted = true;

        return new vscode.Hover(markdownContent, expandedRange);
    }

    public clearHover(editor: vscode.TextEditor): void {
        // Cancel any active hover
        if (this.hoverCancellationTokenSource) {
            this.hoverCancellationTokenSource.cancel();
            this.hoverCancellationTokenSource = null;
        }
    
        // Clear hover-related state
        this.lastHoverPosition = null;
        this.lastSelection = null;
        this.exetndedRange = undefined;
    
        // Remove decorations
        editor.setDecorations(this.decorationType, []);
    }

    // Method to clear hover cache
    public clearHoverCache() {
        this.hoverCache.clear();
    }
}
