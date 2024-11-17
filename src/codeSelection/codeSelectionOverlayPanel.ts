import * as vscode from 'vscode';
import { CodeSelectionCommand } from './codeSelectionCommand';

export class FloatingHoverProvider implements vscode.HoverProvider {
    private hoverCache: Map<string, vscode.Hover> = new Map();
    private debounceTimeout: NodeJS.Timeout | null = null;
    private lastSelection: vscode.Selection | null = null;

    constructor() {
    }

    public provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): vscode.Hover | undefined {
        const editor = vscode.window.activeTextEditor;

        if (!editor || editor.document.uri.toString() !== document.uri.toString()) {
            return undefined;
        }

        // Find the selection containing the hover position
        for (const selection of editor.selections) {
            if (selection.isEmpty || !selection.contains(position)) {
                continue;
            }

            const selectedText = document.getText(selection);

            // Return cached hover if available
            if (this.hoverCache.has(selectedText)) {
                return this.hoverCache.get(selectedText);
            }

            // Handle switching between selections with a delay
            const delay = this.lastSelection?.isEqual(selection) ? 0 : 2000;

            const hover = this.createFixedHover(selection, selectedText, delay);
            this.hoverCache.set(selectedText, hover);

            // Update last selection
            this.lastSelection = selection;
            return hover;
        }

        // Clear decorations when not hovering over selection
        this.lastSelection = null;
        return undefined;
    }

    private createFixedHover(
        selection: vscode.Selection,
        selectedText: string,
        delay: number
    ): vscode.Hover {
        const markdownContent = new vscode.MarkdownString();

        // Add command buttons
        markdownContent.appendMarkdown(
            `[Insert in Chat](command:${CodeSelectionCommand.CODE_FACTOR} "Talk to Code") | ` +
            `[Edit](command:${CodeSelectionCommand.CODE_FACTOR} "Edit Code")`
        );
        markdownContent.isTrusted = true;

        // Add delay if necessary
        if (delay > 0) {
            setTimeout(() => {}, delay);
        }

        return new vscode.Hover(markdownContent, selection);
    }

}
