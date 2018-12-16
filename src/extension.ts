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

import * as vscode from 'vscode';
import { Disposable } from 'vscode';
import { TextLine } from 'vscode';
import { ExtensionContext } from 'vscode';
import { Parser } from './parser';
import { TextDocumentWillSaveEvent } from 'vscode';
import { TextEdit } from 'vscode';
// import { TextEditorEdit } from 'vscode';
import { Selection } from 'vscode';
import { Range } from 'vscode';
import { Position } from 'vscode';
// import { TextDocument } from 'vscode';

import { commands } from 'vscode';
import { window } from 'vscode';
import { workspace } from 'vscode';

const emph:string = "color: black; font-weight: bold; background-color: rgba(255,128,128,0.5);";
global['vscode'] = vscode;
/**
 * import-splitnsort contract
 */

export function activate(context:ExtensionContext) {
  const disposable1 = commands.registerCommand('extension.typescript-import-splitsort.splitnsort', splitAndSort);
  const disposable2 = commands.registerCommand('extension.typescript-import-splitsort.splitonly', splitAndDontSort);
  context.subscriptions.push(disposable1);
  context.subscriptions.push(disposable2);
  console.log(`%cTypeScriptImportSplitSort activated`, emph);
  global['tssscontext'] = context;
  onSave();
  workspace.onDidChangeConfiguration(() => onSave());
}

export function deactivate() { }

// private functions

// let subscription: Nullable<Disposable>;
let subscription:Disposable;
let selection:Selection;
let selections:Selection[];
// let text:string;

// let pos1:Position = new Position(0, 0);
// pos1.
// vscode.Selection.l
function onSave() {
  // typescript-import-splitsort.leave-unsorted
  const config = workspace.getConfiguration('typescript-import-splitsort');
  if(config.get<boolean>('on-save')) {
    if(!subscription) {
      subscription = workspace.onWillSaveTextDocument(splitAndSortOnSave);
    }
  } else {
    if(subscription) {
      subscription.dispose();
      subscription = null;
    }
  }
}

// @see https://github.com/mflorence99/import-splitnsort/issues/2

function splitAndSort() {
  console.log(`%c splitAndSort(): Called ...`, emph);
  const editor = window.activeTextEditor;
  if(!editor) {
    console.log(`%c splitAndSort(): Could not get active editor.`, emph);
    return;
  }
  let sortIt:boolean = false;
  // let line:TextLine;
  let lineNumber:number;
  let whatToReplace:Selection;
  let text:string;
  if(editor.selections && editor.selections.length) {
    selections = editor.selections;
    selection = editor.selection;
  } else {
    selections = editor.selections;
    selection = null;
  }
  console.log(`splitAndSort(): Selections is:\n`, selections);
  if(!selection) {
    return;
  }
  lineNumber = selection.active.line;
  // console.log(`splitAndSort(): Selections, editor, window:\n`, selections);
  // console.log(editor);
  // console.log(window);

  // const config = workspace.getConfiguration('typescript-import-splitsort');
  // if(config.get<boolean>('leave-unsorted')) {
  //   sortIt = false;
  // }
  let langId:string = editor && editor.document && typeof editor.document.languageId === 'string' ? editor.document.languageId : "UNKNOWN";
  if(langId === 'typescript') {
    // let ln1:number = selection.start.line;
    // let ln2:number = selection.end.line + 1;
    // let pos1:Position = new Position(ln1, 0);
    // let pos2:Position = new Position(ln2, 0);
    let ln1:number = selection.start.line;
    let ln2:number = selection.end.line;
    let col1:number = selection.active.character;
    let col2:number = selection.end.character;
    let singleLine:boolean = (ln1 === ln2) || (ln2 === ln1 + 1 && col1 === 0) ? true : false;
    // let line1:TextLine, line2:TextLine, rangeLine1:Range, rangeLine2:Range;
    let line1:TextLine = editor.document.lineAt(ln1);
    let line2:TextLine = editor.document.lineAt(ln2);
    let rangeLine1:Range = line1.rangeIncludingLineBreak;
    let rangeLine2:Range = line2.rangeIncludingLineBreak;
    let range:Range;
    if(singleLine) {
      console.log(`RANGE WILL BE 1`);
      range = line1.range;
      // // line1 = editor.document.lineAt(ln1);
      // range = rangeLine1;
      // // text = line1.text;
    } else if(col2 === 0) {
      console.log(`RANGE WILL BE 2`);
      // line1 = editor.document.lineAt(ln1);
      line2 = editor.document.lineAt(ln2 - 1);
      rangeLine2 = line2.range;
      // rangeLine2 = line2.rangeIncludingLineBreak;
      // let endChar:number = line2.text.length;
      // let pos1:Position = new Position(ln1, 0);
      // let pos2:Position = new Position(ln2-1, endChar);
      // let range:Range = new Range(pos1, pos2);
      range = rangeLine1.union(rangeLine2);
      // text = editor.document.getText(range);
    } else {
      console.log(`RANGE WILL BE 3`);
      range = rangeLine1.union(rangeLine2);
      // let pos1:Position = new Position(ln1, 0);
      // let pos2:Position = new Position(ln2+1, 0);
      // let range:Range = new Range(pos1, pos2);
      // text = editor.document.getText(range);
      // let line1:TextLine = editor.document.lineAt(ln1);
      // selection.start.
    }
    // let rangeLine1:Range = new Range(line1.range.start, line1.range.end);
    // let rangeLine2:Range = new Range(line2.range.start, line2.range.end);
    // let rangeLine2:Range = new Range(pos1, pos2);
    // let range:Range;
    // if(selection.isSingleLine) {
    //   range = line2.range;
    // } else {
    //   range = rangeLine1.union(rangeLine2);
    // }
    text = editor.document.getText(range);
    whatToReplace = new Selection(range.start, range.end);
    console.log(`splitAndSort(): Range and whatToReplace:\n`, range);
    console.log(whatToReplace);

    // if(selection.isSingleLine) {
    //   let line:TextLine = editor.document.lineAt(lineNumber);
    //   text = line.text;
    // } else {
    //   text = editor.document.getText(range);
    // }
    // whatToReplace = new Selection(pos1, pos2);
      // let line1:TextLine = editor.document.lineAt(ln1);
      // selection.start.
    // }
    // if(selection) {
    //   text = editor.document.getText(selection);
    // } else {
    //   text = editor.document.getText();
    // }
    // line = editor.document.lineAt(lineNumber);
    // let lineSelection:Range = line.rangeIncludingLineBreak;
    // let start:Position = lineSelection.start;
    // let end:Position = lineSelection.end;
    // let sel:Selection = new vscode.Selection(start, end);

    // text = line.text;
    console.log(`splitAndSort(): Text is:\n`, text);
    if(!text.includes('import ')) {
      console.log(`splitAndSort(): text does not include an import statement.`);
      return;
    }
    Parser.makeEdits(text, sortIt, editor).then((edits:TextEdit[]) => {
      console.log(`%c splitAndSort(): TextEdits are:`, emph);
      console.log(edits);
      if(edits.length > 0) {
        // const range = edits[0].range;
        const imports = edits[0].newText;
        // editor.edit(edit => edit.replace(range, imports));
        // editor.edit(edit => edit.replace(originalSelection, imports));
        editor.edit(edit => edit.replace(whatToReplace, imports));
      }
    });
  } else {
    console.log(`splitAndSort(): Not running on document with syntax '${langId}'!`);
  }
}

function splitAndDontSort() {
  console.log(`%c splitAndDontSort(): Called ...`, emph);
  const editor = window.activeTextEditor;
  global['tssseditor'] = editor;
  if(!editor) {
    console.log(`%c splitAndDontSort(): Could not get active editor.`, emph);
    return;
  }
  let sortIt:boolean = false;
  // let originalSelection:Selection;
  let whatToReplace:Selection;
  let text:string;
  // let line:TextLine;
  // let lineNumber:number;
  // const config = workspace.getConfiguration('typescript-import-splitsort');
  // if(config.get<boolean>('leave-unsorted')) {
  //   sortIt = false;
  // }
  if(editor.selections && editor.selections.length) {
    selections = editor.selections;
    selection = editor.selection;
  } else {
    selections = editor.selections;
    selection = null;
  }
  if(!selection) {
    return;
  }
  // lineNumber = selection.active.line;

  // originalSelection = new Selection(selection.anchor, selection.active);
  // whatToReplace = new Selection(selection.anchor, selection.active)
  // let replaceRange:Range = new Range(selection.anchor, selection.active);
  // console.log(`splitAndDontSort(): Selections, editor, window:\n`, selections);
  // console.log(editor);
  // console.log(window);
  let langId:string = editor && editor.document && typeof editor.document.languageId === 'string' ? editor.document.languageId : "UNKNOWN";
  if(langId === 'typescript') {
    // let ln1:number = selection.start.line;
    // let ln2:number = selection.end.line + 1;
    // let pos1:Position = new Position(ln1, 0);
    // let pos2:Position = new Position(ln2, 0);
    let ln1:number = selection.start.line;
    let ln2:number = selection.end.line;
    let col1:number = selection.active.character;
    let col2:number = selection.end.character;
    let singleLine:boolean = (ln1 === ln2) || (ln2 === ln1 + 1 && col1 === 0) ? true : false;
    // let line1:TextLine, line2:TextLine, rangeLine1:Range, rangeLine2:Range;
    let line1:TextLine = editor.document.lineAt(ln1);
    let line2:TextLine = editor.document.lineAt(ln2);
    let rangeLine1:Range = line1.rangeIncludingLineBreak;
    let rangeLine2:Range = line2.rangeIncludingLineBreak;
    let range:Range;
    if(singleLine) {
      console.log(`RANGE WILL BE 1`);
      range = line1.range;
      // // line1 = editor.document.lineAt(ln1);
      // range = rangeLine1;
      // // text = line1.text;
    } else if(col2 === 0) {
      console.log(`RANGE WILL BE 2`);
      // line1 = editor.document.lineAt(ln1);
      line2 = editor.document.lineAt(ln2 - 1);
      rangeLine2 = line2.range;
      // rangeLine2 = line2.rangeIncludingLineBreak;
      // let endChar:number = line2.text.length;
      // let pos1:Position = new Position(ln1, 0);
      // let pos2:Position = new Position(ln2-1, endChar);
      // let range:Range = new Range(pos1, pos2);
      range = rangeLine1.union(rangeLine2);
      // text = editor.document.getText(range);
    } else {
      console.log(`RANGE WILL BE 3`);
      range = rangeLine1.union(rangeLine2);
      // let pos1:Position = new Position(ln1, 0);
      // let pos2:Position = new Position(ln2+1, 0);
      // let range:Range = new Range(pos1, pos2);
      // text = editor.document.getText(range);
      // let line1:TextLine = editor.document.lineAt(ln1);
      // selection.start.
    }
    // let rangeLine1:Range = new Range(line1.range.start, line1.range.end);
    // let rangeLine2:Range = new Range(line2.range.start, line2.range.end);
    // let rangeLine2:Range = new Range(pos1, pos2);
    // let range:Range;
    // if(selection.isSingleLine) {
    //   range = line2.range;
    // } else {
    //   range = rangeLine1.union(rangeLine2);
    // }
    text = editor.document.getText(range);
    whatToReplace = new Selection(range.start, range.end);
    console.log(`splitAndDontSort(): Range and whatToReplace:\n`, range);
    console.log(whatToReplace);

    // if(selection.isSingleLine) {
    //   let line:TextLine = editor.document.lineAt(lineNumber);
    //   text = line.text;
    // } else {
    //   text = editor.document.getText(range);
    // }
    // whatToReplace = new Selection(pos1, pos2);
      // let line1:TextLine = editor.document.lineAt(ln1);
      // selection.start.
    // }
    // if(selection) {
    //   text = editor.document.getText(selection);
    // } else {
    //   text = editor.document.getText();
    // }
    // line = editor.document.lineAt(lineNumber);
    // let lineSelection:Range = line.rangeIncludingLineBreak;
    // let start:Position = lineSelection.start;
    // let end:Position = lineSelection.end;
    // let sel:Selection = new vscode.Selection(start, end);

    // text = line.text;
    console.log(`splitAndDontSort(): Text is:\n`, text);
    if(!text.includes('import ')) {
      console.log(`splitAndDontSort(): text does not include an import statement.`);
      return;
    }
    Parser.makeEdits(text, sortIt, editor).then((edits:TextEdit[]) => {
      console.log(`%c splitAndDontSort(): TextEdits are:`, emph);
      console.log(edits);
      if(edits.length > 0) {
        // const range = edits[0].range;
        const imports = edits[0].newText;
        // editor.edit(edit => edit.replace(range, imports));
        // editor.edit(edit => edit.replace(originalSelection, imports));
        editor.edit(edit => edit.replace(whatToReplace, imports));
      }
    });
  } else {
    console.log(`splitAndDontSort(): Not running on document with syntax '${langId}'!`);
  }
}

function splitAndSortOnSave(event: TextDocumentWillSaveEvent) {
  const editor = window.activeTextEditor;
  let sortIt:boolean = true;
  const config = workspace.getConfiguration('typescript-import-splitsort');
  if(config.get<boolean>('leave-unsorted')) {
    sortIt = false;
  }

  // event.document
  // let doc:TextDocument = event.document;
  let langId:string = event && event.document && typeof event.document.languageId === 'string' ? event.document.languageId : "UNKNOWN";
  if(langId === 'typescript') {
    let text:string = event.document.getText();
    event.waitUntil(Parser.makeEdits(text, sortIt, editor));
  }
}
