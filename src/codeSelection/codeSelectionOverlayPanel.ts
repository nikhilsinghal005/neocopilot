import * as vscode from 'vscode';

export class FloatingHoverProvider implements vscode.HoverProvider {
    private hoverCache: Map<string, vscode.Hover> = new Map();

    public provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): vscode.Hover | undefined {
        // Retrieve all active text editors
        const editors = vscode.window.visibleTextEditors;

        // Find if any editor has a selection that includes the current position
        for (const editor of editors) {
            if (editor.document.uri.toString() !== document.uri.toString()) {
                continue; // Skip different documents
            }

            for (const selection of editor.selections) {
                if (selection.isEmpty) {
                    continue; // Skip empty selections
                }

                // Check if the current position is within the selection
                if (selection.contains(position)) {
                    // Use the selected text as the cache key
                    const selectedText = document.getText(selection);

                    // Check if hover content is already cached
                    let hover = this.hoverCache.get(selectedText);
                    if (!hover) {
                        // Create the Markdown content with clickable links
                        const markdownContent = new vscode.MarkdownString();
                        markdownContent.appendMarkdown(
                            `[Chat](command:extension.showInfoCommand "Execute Chat Command") | [Refactor](command:extension.webRefactorCommand "Execute Refactor Command")`
                        );
                        markdownContent.isTrusted = true; // Allow the commands to be executed

                        hover = new vscode.Hover(markdownContent, selection);
                        this.hoverCache.set(selectedText, hover);
                    }

                    return hover;
                }
            }
        }

        return undefined; // No relevant selection found
    }
}
