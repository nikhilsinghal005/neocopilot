import * as vscode from 'vscode';
import { io, Socket } from 'socket.io-client';

let socket: Socket;
let currentFileName: string | undefined;
let currentLineNumber: number | undefined;
let currentLanguageId: string | undefined;
let openedFiles: { [fileName: string]: any[] } = {}; // Object to store list for each opened file

export function activate(context: vscode.ExtensionContext) {
    socket = io('http://localhost:5000'); // replace with the address of your Flask-SocketIO server

    socket.on('connect', () => {
        console.log('Connected to Flask-SocketIO server');
    });

    socket.on('receive_message', (data: any) => {
        console.log('Received message from server: ', data);
    });

    handleActiveEditor(vscode.window.activeTextEditor, context);

    vscode.window.onDidChangeActiveTextEditor(
        editor => handleActiveEditor(editor, context), null, context.subscriptions
    );
    
    vscode.workspace.onDidChangeTextDocument(
        event => handleTextChange(event, context), null, context.subscriptions
    );
}

function handleActiveEditor(editor: vscode.TextEditor | undefined, context: vscode.ExtensionContext) {
    if (editor) {
        const inputFileName: string | undefined = editor.document.fileName;
        // if the file is opened for the first time, initialize an empty list for it
        if (inputFileName && !(inputFileName in openedFiles)) {
            openedFiles[inputFileName] = [];
        }

        const inputLineNumber: number | undefined = editor.selection.active.line;
        const inputLanguageId: string = editor.document.languageId;

        context.workspaceState.update('currentFileName', inputFileName);
        context.workspaceState.update('currentLineNumber', inputLineNumber);
        context.workspaceState.update('currentFileType', inputLanguageId);

        console.log(`Current File: ${currentFileName}`);
        console.log(`Current Line Number: ${currentLineNumber}`);
        console.log(`Current Language Id: ${currentLanguageId}`);
        console.log(`Files opened: ${JSON.stringify(openedFiles)}`);
    }
}

// ... rest of your existing code ...

function handleTextChange(event: vscode.TextDocumentChangeEvent, context: vscode.ExtensionContext) {
    const editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor;
    if (editor && event.document === editor.document) {
        currentFileName = editor.document.fileName;
        currentLineNumber = editor.selection.active.line;
        
        context.workspaceState.update('currentFileName', currentFileName);
        context.workspaceState.update('currentLineNumber', currentLineNumber);
        
        console.log(`Current file: ${currentFileName}`);
        console.log(`Current line number: ${currentLineNumber}`);
        
        const currentLineText: string = getCurrentLineText(editor);
        console.log(`Current line text: ${currentLineText}`);
        
        // Send message to server every time text is changed
        socket.emit('send_message', { message: 'Text changed in VS Code extension!' });
        
        // Display a message to the user
        vscode.window.showInformationMessage('You are great in the code!');
    }
}

function getCurrentLineText(editor: vscode.TextEditor): string {
    const currentLine = editor.document.lineAt(editor.selection.start.line);
    return currentLine.text;
}
