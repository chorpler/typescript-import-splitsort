// import * as vscode from 'vscode';
// import { TextDocument              } from 'vscode'   ;
import { Disposable                } from 'vscode'   ;
import { TextLine                  } from 'vscode'   ;
import { ExtensionContext          } from 'vscode'   ;
import { Extension                 } from 'vscode'   ;
import { Parser                    } from './parser' ;
import { TextDocumentWillSaveEvent } from 'vscode'   ;
import { TextEdit                  } from 'vscode'   ;
import { TextEditorEdit            } from 'vscode'   ;
import { Selection                 } from 'vscode'   ;
import { Range                     } from 'vscode'   ;
import { Position                  } from 'vscode'   ;
import { commands                  } from 'vscode'   ;
import { window                    } from 'vscode'   ;
import { workspace                 } from 'vscode'   ;
import { extensions                } from 'vscode'   ;
const packageJSON = require('../package.json');
// import { name, version             } from '../package';

const extensionName:string = packageJSON && packageJSON.name ? packageJSON.name : "typescript-import-splitsort";
const extensionVersion:string = packageJSON && packageJSON.version ? packageJSON.version : "1.0.9";
// const extensionName:string = "typescript-import-splitsort";

type AlignAPI = {
  align: Function,
  alignWhitespace: Function,
};

export const Log = {
  get l() {
    return console.log.bind(console);
  },
  get e() {
    return console.error.bind(console);
  },
  get w() {
    return console.warn.bind(console);
  },
  get t() {
    return console.log.bind(console);
  },
};

const emph:string = "color: black; font-weight: bold; background-color: rgba(255,128,128,0.5);";
const emph2:string = "color: black; font-weight: bold; background-color: rgba(128,255,128,0.5);";
// global['vscode'] = vscode;

/**
 * import-splitnsort contract
 */
export function activate(context:ExtensionContext) {
  const disposable1 = commands.registerCommand(`extension.${extensionName}.splitsort`, splitAndSort);
  const disposable2 = commands.registerCommand(`extension.${extensionName}.splitonly`, splitAndDontSort);
  const disposable3 = commands.registerCommand(`extension.${extensionName}.splitalign`, splitAndAlign);
  const disposable4 = commands.registerCommand(`extension.${extensionName}.splitwithsettings`, splitters);
  context.subscriptions.push(disposable1);
  context.subscriptions.push(disposable2);
  context.subscriptions.push(disposable3);
  context.subscriptions.push(disposable4);
  Log.l(`%c ${extensionName} (${extensionVersion}) activated`, emph);
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

async function splitters(sort:boolean, align:boolean):Promise<any> {
  try {
    const editor = window.activeTextEditor;
    const config = workspace.getConfiguration(extensionName);
    let sortIt:boolean = typeof sort === 'boolean' ? sort : false;
    let alignIt:boolean = typeof align === 'boolean' ? align : false;
    if(!(editor && config)) {
      Log.l(`%c splitters(): Could not get active editor.`, emph);
      return;
    }
    if(align == undefined) {
      if(config.get<boolean>('align-output')) {
        alignIt = true;
      }
    }
    if(sort == undefined) {
      if(config.get<boolean>('sort-output')) {
        sortIt = true;
      } else {
        sortIt = false;
      }
    }

    // let line:TextLine;
    // let lineNumber:number;
    let whatToReplace:Selection;
    let text:string;
    if(editor.selections && editor.selections.length) {
      selections = editor.selections;
      selection = editor.selection;
    } else {
      selections = editor.selections;
      selection = null;
    }
    Log.l(`splitters(): Selections is:\n`, selections);
    if(!selection) {
      return;
    }
    // lineNumber = selection.active.line;
    // Log.l(`splitters(): Selections, editor, window:\n`, selections);
    // Log.l(editor);
    // Log.l(window);

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
      let rangeLine2:Range = line2.range;
      let pos1:Position   = selection.start;
      let lineNo1:number = pos1.line;
      let newpos:Position  = pos1.with(lineNo1, 0);
      // let endpos:Position  = pos1.with(lineNo1+lines, 0);
      // let newSel:Selection = new Selection(newpos, endpos);
    // let rangeLine2:Range = line2.rangeIncludingLineBreak;
      let range:Range;
      if(singleLine) {
        Log.l(`RANGE WILL BE 1`);
        range = line1.range;
        // // line1 = editor.document.lineAt(ln1);
        // range = rangeLine1;
        // // text = line1.text;
      } else if(col2 === 0) {
        Log.l(`RANGE WILL BE 2`);
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
        Log.l(`RANGE WILL BE 3`);
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
      // Log.l(`splitters(): Range and whatToReplace:\n`, range);
      // Log.l(whatToReplace);

      Log.l(`splitters(): Text is:\n`, text);
      if(!text.includes('import ')) {
        Log.l(`splitters(): text does not include an import statement.`);
        return;
      }
      let edits:TextEdit[] = await Parser.makeEdits(text, sortIt, editor);
      Log.l(`%c splitters(): TextEdits are:`, emph2);
      Log.l(edits);
      if(edits.length > 0) {
        // const range = edits[0].range;
        const imports = edits[0].newText;
        let lines:number = 0;
        // let strLines:string = imports.trim();
        // let splitLines:string[] = strLines.split('\n');
        // lines = splitLines.length;
        let strLines:string = imports;
        let splitLines:string[] = strLines.split('\n');
        lines = splitLines.length;
        // editor.edit(edit => edit.replace(range, imports));
        // editor.edit(edit => edit.replace(originalSelection, imports));
        let res:any = await editor.edit((edit:TextEditorEdit) => {
          edit.replace(whatToReplace, imports);
        });
        // let pos1:Position   = editor.selection.active;
        // let lineNo1:number = pos1.line;
        // let newpos:Position  = pos1.with(lineNo1, 0);
        let endpos:Position  = pos1.with(lineNo1+lines, 0);
        let newSel:Selection = new Selection(newpos, endpos);
        editor.selection = newSel;
        if(alignIt && lines > 1) {
          await alignOutput();
        }
        return res;
      }
    } else {
      Log.l(`splitters(): Not running on document with syntax '${langId}'!`);
    }
    // return res;
  } catch(err) {
    Log.l(`splitters(): Error running splitters function`);
    Log.e(err);
    throw err;
  }
}

// @see https://github.com/mflorence99/import-splitnsort/issues/2

function splitAndSort() {
  Log.l(`\n%c splitAndSort(): Called ...`, emph);
  splitters(true, false);
}

function splitAndDontSort() {
  Log.l(`%c splitAndDontSort(): Called ...`, emph);
  splitters(false, false);
}

function splitAndAlign() {
  Log.l(`%c splitAndAlign(): Called ...`, emph);
  splitters(false, true);
}

function splitAndSortOnSave(event: TextDocumentWillSaveEvent) {
  const editor = window.activeTextEditor;
  let sortIt:boolean = true;
  const config = workspace.getConfiguration('typescript-import-splitsort');
  if(config.get<boolean>('sort-output')) {
    sortIt = true;
  }

  // event.document
  // let doc:TextDocument = event.document;
  let langId:string = event && event.document && typeof event.document.languageId === 'string' ? event.document.languageId : "UNKNOWN";
  if(langId === 'typescript') {
    let text:string = event.document.getText();
    event.waitUntil(Parser.makeEdits(text, sortIt, editor));
  }
}

async function alignOutput():Promise<boolean> {
  try {
    Log.l(`alignOutput(): Called!`);
    if(!extensions) {
      Log.w(`alignOutput(): Cannot access VSCode extensions`);
      return false;
    }
    let extAlign:Extension<AlignAPI> = extensions.getExtension('annsk.alignment');
    if(extAlign) {
      if(!extAlign.isActive) {
        Log.l(`alignOutput(): Extension not activated, activating it ...`);
        await extAlign.activate();
      }
      let align:AlignAPI = extAlign.exports;
      Log.l(`alignOutput(): Now running align command ...`);
      align.align();
      Log.l(`alignOutput(): Done!`);
      return true;
    } else {
      Log.l(`alignOutput(): Could not find extension 'annsk.alignment'. Aborting.`);
      return false;
    }
  } catch(err) {
    Log.l(`alignOutput(): Error aligning output`);
    Log.e(err);
    throw err;
  }
}
