import * as vscode from 'vscode';
import { SocketModule } from './socketModule';

export class CompletionProviderModule implements vscode.InlineCompletionItemProvider {
    public suggestion: string;
    
    constructor() {
      this.suggestion = '';
    };

    public updateSuggestion(suggestion: string) {
      // console.log(`Received suggestion: ${suggestion}`);
      this.suggestion = suggestion;
    }
    
    
    public async provideInlineCompletionItems (document: vscode.TextDocument, position: vscode.Position, context: vscode.InlineCompletionContext, token: vscode.CancellationToken) {
      if (this.suggestion !== undefined && this.suggestion!=="") {
        const item = new vscode.InlineCompletionItem(this.suggestion, new vscode.Range(position, position));
        return [item];
      } else {
        return [];
      }
    }
  

  }