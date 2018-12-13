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

// import { Disposable } from 'vscode';
import { ExtensionContext } from 'vscode';
import { Parser } from './parser';
// import { TextDocumentWillSaveEvent } from 'vscode';
import { TextEdit } from 'vscode';
import { Selection } from 'vscode';
// import { TextDocument } from 'vscode';

import { commands } from 'vscode';
import { window } from 'vscode';
// import { workspace } from 'vscode';

/**
 * import-splitnsort contract
 */

export function activate(context:ExtensionContext) {
  const disposable1 = commands.registerCommand('extension.typescript-import-splitsort.splitnsort', splitAndSort);
  const disposable2 = commands.registerCommand('extension.typescript-import-splitsort.splitonly', splitAndDontSort);
  context.subscriptions.push(disposable1);
  context.subscriptions.push(disposable2);
  // onSave();
  // workspace.onDidChangeConfiguration(() => onSave());
}

export function deactivate() { }

// private functions

// let subscription: Nullable<Disposable>;
// let subscription:Disposable;
let selection:Selection;
// let text:string;

// function onSave() {
//   // typescript-import-splitsort.leave-unsorted
//   const config = workspace.getConfiguration('typescript-import-splitsort');
//   if(config.get<boolean>('on-save')) {
//     if(!subscription) {
//         subscription = workspace.onWillSaveTextDocument(splitAndSortOnSave);
//     }
//   }
//   else {
//     if(subscription) {
//       subscription.dispose();
//       subscription = null;
//     }
//   }
// }

// @see https://github.com/mflorence99/import-splitnsort/issues/2

function splitAndSort() {
  console.log(`splitAndSort(): Called ...`);
  const editor = window.activeTextEditor;
  let sortIt = true;
  let text:string;
  if(editor.selections && editor.selections.length) {
    selection = editor.selection;
  } else {
    selection = null;
  }
  // const config = workspace.getConfiguration('typescript-import-splitsort');
  // if(config.get<boolean>('leave-unsorted')) {
  //   sortIt = false;
  // }
  let langId:string = editor && editor.document && typeof editor.document.languageId === 'string' ? editor.document.languageId : "UNKNOWN";
  if(langId === 'typescript') {
    if(selection) {
      text = editor.document.getText(selection);
    } else {
      text = editor.document.getText();
    }
    console.log(`splitAndSort(): Text is:\n`, text);
    Parser.makeEdits(text, sortIt).then((edits:TextEdit[]) => {
        if(edits.length > 0) {
          const range = edits[0].range;
          const imports = edits[0].newText;
          editor.edit(edit => edit.replace(range, imports));
        }
      });
  } else {
    console.log(`splitAndSort(): Not running on document with syntax '${langId}'!`);
  }
}

function splitAndDontSort() {
  console.log(`splitAndDontSort(): Called ...`);
  const editor = window.activeTextEditor;
  let sortIt = false;
  let text:string;
  // const config = workspace.getConfiguration('typescript-import-splitsort');
  // if(config.get<boolean>('leave-unsorted')) {
  //   sortIt = false;
  // }
  if(editor.selection) {
  // if(editor.selections && editor.selections.length) {
    selection = editor.selection;
  } else {
    selection = null;
  }
  let langId:string = editor && editor.document && typeof editor.document.languageId === 'string' ? editor.document.languageId : "UNKNOWN";
  if(langId === 'typescript') {
    if(selection) {
      text = editor.document.getText(selection);
    } else {
      text = editor.document.getText();
    }
    console.log(`splitAndDontSort(): Text is:\n`, text);
    Parser.makeEdits(text, sortIt).then((edits:TextEdit[]) => {
        if(edits.length > 0) {
          const range = edits[0].range;
          const imports = edits[0].newText;
          editor.edit(edit => edit.replace(range, imports));
        }
      });
    } else {
      console.log(`splitAndDontSort(): Not running on document with syntax '${langId}'!`);
    }
  }

// function splitAndSortOnSave(event: TextDocumentWillSaveEvent) {
//   let sortIt = true;
//   const config = workspace.getConfiguration('typescript-import-splitsort');
//   if(config.get<boolean>('leave-unsorted')) {
//     sortIt = false;
//   }
//   // event.document
//   let doc:TextDocument = event.document;
//   if(event.document.languageId === 'typescript') {
//     event.waitUntil(Parser.makeEdits(event.document.getText(), sortIt));
//   }
// }
