// 'use strict';
// // The module 'vscode' contains the VS Code extensibility API
// // Import the module and reference it with the alias vscode in your code below
// import * as vscode from 'vscode';

// // this method is called when your extension is activated
// // your extension is activated the very first time the command is executed
// export function activate(context: vscode.ExtensionContext) {

//     // Use the console to output diagnostic information (console.log) and errors (console.error)
//     // This line of code will only be executed once when your extension is activated
//     console.log('Congratulations, your extension "typescript-import-splitsort" is now active!');

//     // The command has been defined in the package.json file
//     // Now provide the implementation of the command with  registerCommand
//     // The commandId parameter must match the command field in package.json
//     let disposable = vscode.commands.registerCommand('extension.sayHello', () => {
//         // The code you place here will be executed every time your command is executed

//         // Display a message box to the user
//         vscode.window.showInformationMessage('Hello World!');
//     });

//     context.subscriptions.push(disposable);
// }

// // this method is called when your extension is deactivated
// export function deactivate() {
// }

import { Disposable } from 'vscode';
import { ExtensionContext } from 'vscode';
import { Parser } from './parser';
import { TextDocumentWillSaveEvent } from 'vscode';
import { TextEdit } from 'vscode';

import { commands } from 'vscode';
import { window } from 'vscode';
import { workspace } from 'vscode';

/**
 * import-splitnsort contract
 */

export function activate(context:ExtensionContext) {
  const disposable1 = commands.registerCommand('extension.typescript-import-splitsort.splitnsort', splitAndSort);
  const disposable2 = commands.registerCommand('extension.typescript-import-splitsort.splitonly', splitAndDontSort);
  context.subscriptions.push(disposable1);
  context.subscriptions.push(disposable2);
  onSave();
  workspace.onDidChangeConfiguration(() => onSave());
}

export function deactivate() { }

// private functions

// let subscription: Nullable<Disposable>;
let subscription:Disposable;

function onSave() {
  // typescript-import-splitsort.leave-unsorted
  const config = workspace.getConfiguration('typescript-import-splitsort');
  if(config.get<boolean>('on-save')) {
    if(!subscription) {
        subscription = workspace.onWillSaveTextDocument(splitAndSortOnSave);
    }
  }
  else {
    if(subscription) {
      subscription.dispose();
      subscription = null;
    }
  }
}

// @see https://github.com/mflorence99/import-splitnsort/issues/2

function splitAndSort() {
  const editor = window.activeTextEditor;
  let sortIt = true;
  // const config = workspace.getConfiguration('typescript-import-splitsort');
  // if(config.get<boolean>('leave-unsorted')) {
  //   sortIt = false;
  // }

  if(editor.document.languageId === 'typescript') {
    Parser.makeEdits(editor.document.getText(), sortIt)
      .then((edits:TextEdit[]) => {
        if(edits.length > 0) {
          const range = edits[0].range;
          const imports = edits[0].newText;
          editor.edit(edit => edit.replace(range, imports));
        }
      });
  }
}

function splitAndDontSort() {
  const editor = window.activeTextEditor;
  let sortIt = false;
  // const config = workspace.getConfiguration('typescript-import-splitsort');
  // if(config.get<boolean>('leave-unsorted')) {
  //   sortIt = false;
  // }

  if(editor.document.languageId === 'typescript') {
    Parser.makeEdits(editor.document.getText(), sortIt)
      .then((edits:TextEdit[]) => {
        if(edits.length > 0) {
          const range = edits[0].range;
          const imports = edits[0].newText;
          editor.edit(edit => edit.replace(range, imports));
        }
      });
  }
}

function splitAndSortOnSave(event: TextDocumentWillSaveEvent) {
  let sortIt = true;
  const config = workspace.getConfiguration('typescript-import-splitsort');
  if(config.get<boolean>('leave-unsorted')) {
    sortIt = false;
  }
  if(event.document.languageId === 'typescript') {
    event.waitUntil(Parser.makeEdits(event.document.getText(), sortIt));
  }
}
