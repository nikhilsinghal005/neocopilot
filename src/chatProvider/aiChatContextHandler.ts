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
    private recentlyOpenedFiles: Set<{ fileName: string, filePath: string, languageId: string }> = new Set();
    private readonly RECENT_FILES_KEY = 'recentlyOpenedFiles';

    constructor(
        private aiChatPanel: AiChatPanel,
        private authManager: AuthManager,
        private context: vscode.ExtensionContext
    ) {
        this.socketModule = SocketModule.getInstance();
        this.recentlyOpenedFiles = this.getLastFiveFiles();
    }

    private getLastFiveFiles(): Set<{ fileName: string, filePath: string, languageId: string }> {
        const storedFiles = this.context.workspaceState.get<{ fileName: string, filePath: string, languageId: string }[]>(this.RECENT_FILES_KEY, []);
        return new Set(storedFiles.map(file => ({ ...file })));
    }

    private updateLastFiveFiles() {
        this.context.workspaceState.update(this.RECENT_FILES_KEY, Array.from(this.recentlyOpenedFiles));
    }

    public async getCurrentFileName(editor: vscode.TextEditor | undefined, context: vscode.ExtensionContext) {
        if (this.debounceTimeout) {
            clearTimeout(this.debounceTimeout);
        }

        this.debounceTimeout = setTimeout(async () => {
            const activeEditorPath = handleActiveEditor(editor, context);

            if (!activeEditorPath) {
                console.warn("Active editor path is undefined.");

                const recentlyOpenedFilesArray = Array.from(this.recentlyOpenedFiles).map(file => ({
                    fileName: file.fileName,
                    filePath: file.filePath,
                    languageId: file.languageId,
                    isActive: false,
                    isOpened: false,
                    isSelected: false
                }));

                // remove all selected context
                this.aiChatPanel.activePanels[0]?.webview.postMessage({
                    command: 'editor_changed_context_update_event',
                    action: "remove_all_selected"
                });

                // Add a sleep time
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Send list of recent files
                this.aiChatPanel.activePanels[0]?.webview.postMessage({
                    command: 'editor_open_files_list_update_event',
                    openFiles: recentlyOpenedFilesArray
                });

                return;
            }

            try {
                this.currentSelectedFileName = path.basename(activeEditorPath || '');
                const currentSelectedFileRelativePath = vscode.workspace.asRelativePath(activeEditorPath || '');

                if (notSupportedFiles(this.currentSelectedFileName) || currentSelectedFileRelativePath === 'tasks') {
                    if (this.aiChatPanel.activePanels.length > 0) {
                        this.aiChatPanel.activePanels[0].webview.postMessage({
                            command: 'editor_changed_context_update_event',
                            currentSelectedFileName: this.currentSelectedFileName,
                            currentSelectedFileRelativePath: currentSelectedFileRelativePath,
                            currentSelectedFileLanguageId: editor?.document.languageId || 'unknown',
                            action: "user_opened_unsupported_file_in_editor"
                        });
                    }
                } else {
                    if (this.aiChatPanel.activePanels.length > 0) {
                        this.aiChatPanel.activePanels[0].webview.postMessage({
                            command: 'editor_changed_context_update_event',
                            currentSelectedFileName: this.currentSelectedFileName,
                            currentSelectedFileRelativePath: currentSelectedFileRelativePath,
                            currentSelectedFileLanguageId: editor?.document.languageId || 'unknown',
                            action: "user_opened_in_editor"
                        });
                    }

                    const currentFilePath = vscode.workspace.asRelativePath(activeEditorPath || '');
                    const currentLanguageId = vscode.window.activeTextEditor?.document.languageId || 'Unknown';

                    let fileExists = false;
                    this.recentlyOpenedFiles.forEach(file => {
                        if (file.filePath === currentFilePath) {
                            fileExists = true;
                        }
                    });

                    if (!fileExists) {
                        this.recentlyOpenedFiles.add({
                            fileName: path.basename(currentFilePath || 'Unknown'),
                            filePath: currentFilePath || 'Unknown',
                            languageId: currentLanguageId || 'Unknown'
                        });
                    }

                    if (this.recentlyOpenedFiles.size > 5) {
                        const filesArray = Array.from(this.recentlyOpenedFiles);
                        filesArray.shift();
                        this.recentlyOpenedFiles = new Set(filesArray);
                    }

                    this.updateLastFiveFiles();
                }

                let openFiles = getOpenFilesList();
                openFiles = openFiles.filter(file => !notSupportedFiles(file.fileName));
                openFiles.forEach(file => {
                    if (file.filePath === vscode.workspace.asRelativePath(activeEditorPath || '')) {
                        file.isSelected = true;
                    }
                });

                const recentlyOpenedFilesArray = Array.from(this.recentlyOpenedFiles).map(file => ({
                    fileName: file.fileName,
                    filePath: file.filePath,
                    languageId: file.languageId,
                    isActive: false,
                    isOpened: false,
                    isSelected: false
                }));

                // // // console.log("Opened Files Before", openFiles)
                openFiles = openFiles.concat(
                    recentlyOpenedFilesArray.filter(newFile => !openFiles.some(existingFile => existingFile.filePath === newFile.filePath))
                );
                // // console.log("Stored Files", recentlyOpenedFilesArray)

                if (this.aiChatPanel.activePanels.length > 0) {
                    this.aiChatPanel.activePanels[0].webview.postMessage({
                        command: 'editor_open_files_list_update_event',
                        openFiles: openFiles
                    });
                }
                // // console.log("Opened Files", openFiles)
            } catch (error) {
                console.error("Error processing current file name:", error);
            }
        }, 100);
    }
}
