// src/chatProvider/aiChatPanelSocketHandler.ts
import { AuthManager } from '../authManager/authManager';
import { SocketModule } from '../socketModule';
import { AiChatPanel } from './aiChatPanel';
import * as vscode from 'vscode';
import * as path from 'path';
import { handleActiveEditor } from "../utilities/codeCompletionUtils/editorUtils";
import { notSupportedFiles } from "../utilities/codeCompletionUtils/completionUtils";
import { getOpenFilesList } from '../utilities/editorUtils/getOpenFilesList';

export class AiChatContextHandler {
  private socketModule: SocketModule;
  private debounceTimeout: NodeJS.Timeout | undefined;
  private currentSelectedFileName: string = '';

  constructor(
    private aiChatPanel: AiChatPanel,
    private authManager: AuthManager,
    private context: vscode.ExtensionContext
  ) {
    this.socketModule = SocketModule.getInstance();
  }

  public getCurrentFileName(editor: vscode.TextEditor | undefined, context: vscode.ExtensionContext) {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }
    this.debounceTimeout = setTimeout(() => {
      this.currentSelectedFileName = path.basename(handleActiveEditor(editor, context));
      const currentSelectedFileRelativePath = vscode.workspace.asRelativePath(handleActiveEditor(editor, context));
      if (notSupportedFiles(this.currentSelectedFileName) || currentSelectedFileRelativePath==='tasks') {
        if (this.aiChatPanel.activePanels.length > 0){
          this.aiChatPanel.activePanels[0].webview.postMessage(
              {
                command: 'editor_changed_context_update_event', 
                currentSelectedFileName:  this.currentSelectedFileName,
                currentSelectedFileRelativePath: currentSelectedFileRelativePath,
                action: "user_opened_unsupported_file_in_editor"
              }
          );
        }
      } else {

        if (this.aiChatPanel.activePanels.length > 0){
          this.aiChatPanel.activePanels[0].webview.postMessage(
              {
                command: 'editor_changed_context_update_event', 
                currentSelectedFileName:  this.currentSelectedFileName,
                currentSelectedFileRelativePath: currentSelectedFileRelativePath,
                action: "user_opened_in_editor"
              }
          );
        }
      }

      let openFiles = getOpenFilesList();
      openFiles = openFiles.filter(file => !notSupportedFiles(file.fileName)); // remove not supported files
      openFiles = openFiles.filter(file => file.filePath !== vscode.workspace.asRelativePath(handleActiveEditor(editor, context)));       // remove current file from list

      if (this.aiChatPanel.activePanels.length > 0){
        this.aiChatPanel.activePanels[0].webview.postMessage(
          {
            command: 'editor_open_files_list_update_event',
            openFiles: openFiles
          }
        );
      }
    }, 100);
  }


 
}
