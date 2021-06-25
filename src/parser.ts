// import { window               } from 'vscode'            ;
// import { TextEditor           } from 'vscode'            ;
import { ExternalModuleImport } from 'typescript-parser' ;
import { File                 } from 'typescript-parser' ;
import { Import               } from 'typescript-parser' ;
import { NamedImport          } from 'typescript-parser' ;
import { NamespaceImport      } from 'typescript-parser' ;
import { Position             } from 'vscode'            ;
import { Range                } from 'vscode'            ;
import { StringImport         } from 'typescript-parser' ;
import { SymbolSpecifier      } from 'typescript-parser' ;
import { TextEdit             } from 'vscode'            ;
import { TypescriptParser     } from 'typescript-parser' ;
import { Log                  } from './extension'       ;

// const clone:Function = (val:any):any => {
//   let tmpVal = JSON.stringify(val);
//   let newVal = JSON.parse(tmpVal);
//   return newVal;
// };

export type ImportsList = Map<string,string[]>;
export type EditorImportsList = Map<string,ImportsList>;

/**
 * Parse TypeScript and extract imports
 */

export class Parser {

  public defaultImports: Dictionary = { };
  public externalImports: Dictionary = { };
  public namedClassImports: Dictionary = { };
  public namedFunctionImports: Dictionary = { };
  public namespaceImports: Dictionary = { };
  public stringImports: string[] = [];

  public range = new Range(0, 0, 0, 0);

  public braces = ['{ ', ' }'];
  public quote = `'`;
  public semicolon = ';';

  private parser = new TypescriptParser();

  public static lastParser:Parser;

  public static editorImportsList:EditorImportsList = new Map();
  public get editorImportsList():EditorImportsList { return Parser.editorImportsList; }
  public set editorImportsList(val:EditorImportsList) { Parser.editorImportsList = val; }

  public static importList:ImportsList = new Map();
  public get importList():ImportsList { return Parser.importList; }
  public set importList(val:ImportsList) { Parser.importList = val; }
  // public importList:ImportsList = new Map();

  public static sortImports:boolean = false;
  public get sortImports():boolean { return Parser.sortImports; }
  public set sortImports(val:boolean) { Parser.sortImports = Boolean(val); }

  /** ctor */
  // constructor(private src: string, vsceditor:TextEditor) {
  constructor(private src: string, vsceditor?:any) {
    Parser.lastParser = this;
    Log.l(`Parser constructed with source:\n`, src);
    // Log.l(`Static Parser is:\n`, Parser);
    // Log.l(`This parser is:\n`, this);
    global['tsssparser'] = this;
    global['tssseditor'] = vsceditor;
    // let editor = window.activeTextEditor.
    let id:string = "UNKNOWN_EDITOR_ID";
    if(vsceditor != undefined) {
      id = vsceditor._id;
    }
    let eil:EditorImportsList = Parser.editorImportsList;
    let importsList:ImportsList;
    if(eil.has(id)) {
      importsList = eil.get(id);
    } else {
      importsList = new Map();
      Parser.importList = importsList;
      eil.set(id, importsList);
    }
    global['tssseditorimportlist'] = eil;
  }

  /** Make an edit to replace imports */
  static async makeEdits(src:string, toSort:boolean, vsceditor:any):Promise<TextEdit[]> {
    try {
      if(toSort) {
        Parser.sortImports = true;
      }
      let parser:Parser = new Parser(src, vsceditor);
      // let res:any = await parser.parse();
      await parser.parse();
      let imports:string = parser.produce();
      if(imports.trim().split("\n").length > 1) {
        imports = imports + "\n";
      }
      // Log.l(`Parser.makeEdits(): importsList is now:\n`, Parser.importList);
      // let strList:string = JSON.stringify(Parser.importList);
      // Log.l(`Parser.makeEdits(): importsList is now:\n`, strList);
      global['tsssimportlist'] = Parser.importList;
      global['tssseditorimportlist'] = Parser.editorImportsList;
      let output:TextEdit[] = (imports.length > 0)? [TextEdit.replace(parser.range, imports)] : [];
      // resolve((imports.length > 0)? [TextEdit.replace(parser.range, imports)] : []);
      return output;
    } catch(err) {
      Log.l(`Parser.makeEdits(): Error making edits`);
      Log.e(err);
      throw err;
    }
  }

  /** Parse the source, extracting the imports */
  parse():Promise<any> {
    if(!this.src.includes('import ')) {
      return Promise.resolve();
    } else {
      return new Promise((resolve, reject) => {
        this.parser.parseSource(this.src).then((file:File) => {
          let start = Number.MAX_SAFE_INTEGER;
          let end = Number.MIN_SAFE_INTEGER;
          file.imports.forEach((node:Import) => {
            // let libName:string = node.libraryName;
            // let importName:string = node.
            // let libImports:string[];
            // if(this.importList.has(libName)) {
            //    libImports = this.importList.get(libName);
            // } else {
            //   libImports = [];
            // }
            start = Math.min(start, node.start);
            end = Math.max(end, node.end);
            // process each type of import
            switch (node.constructor) {
              case ExternalModuleImport:
                this.extractExternal(<ExternalModuleImport>node);
                break;
              case NamedImport:
                this.extractNamed(<NamedImport>node);
                break;
              case NamespaceImport:
                this.extractNamespace(<NamespaceImport>node);
                break;
              case StringImport:
                this.extractString(<StringImport>node);
                break;
            }
          });
          this.detectCodingStyle(start, end);
          this.makeRange(start, end);
          resolve(null);
        });
      });
    }
  }

  /** Produce sorted import statements */
  produce(): string {
    const stmts:string[] = this.produceNamespace()
      .concat(this.produceNamedClass())
      .concat(this.produceNamedFunction())
      .concat(this.produceDefault())
      .concat(this.produceExternal())
      .concat(this.produceString());
    // NOTE: if there are any imports at all, there'll be an initial blank line
    // return (stmts.length > 0)? stmts.slice(1).join('\n') : '';
    return (stmts.length > 0)? stmts.slice(1).join('\n') : '';
  }

  // private methods

  public addImportToLibrary(libraryName:string, importAlias:string):string[] {
    let li:ImportsList = Parser.importList;
    let imports:string[];
    // Log.l(`addImportsToLibrary(): Attempting to add '${importAlias}' to library '${libraryName}'`);
    if(li.has(libraryName)) {
      imports = li.get(libraryName);
    } else {
      imports = [];
      li.set(libraryName, imports);
    }
    imports.push(importAlias);
    return imports;
  }

  private detectCodingStyle(start: number,
                            end: number): void {
    const imports = this.src.substring(start, end);
    if(!imports.includes(this.braces[0])) {
      this.braces[0] = '}';
    }
    if(!imports.includes(this.braces[1])) {
      this.braces[1] = '}';
    }
    if(!imports.includes(this.quote)) {
      this.quote = '"';
    }
    if(!imports.includes(this.semicolon)) {
      this.semicolon = '';
    }
  }

  private extractExternal(node: ExternalModuleImport): void {
    this.externalImports[node.alias] = node.libraryName;
    this.addImportToLibrary(node.libraryName, node.alias);
  }

  private extractNamed(node: NamedImport): void {
    if(node.defaultAlias) {
      this.defaultImports[node.defaultAlias] = node.libraryName;
      this.addImportToLibrary(node.libraryName, node.defaultAlias);
    }
    node.specifiers.forEach((specifier: SymbolSpecifier) => {
      const initialChar = specifier.specifier[0];
      const dict = (initialChar === initialChar.toLowerCase()) ? this.namedFunctionImports : this.namedClassImports;
      let importName:string;
      if(specifier.alias) {
        importName = `${specifier.specifier} as ${specifier.alias}`;
      } else {
        importName = specifier.specifier;
        // dict[specifier.specifier] = node.libraryName;
      }
      dict[importName] = node.libraryName;
      this.addImportToLibrary(node.libraryName, importName);
    });
  }

  private extractNamespace(node: NamespaceImport): void {
    this.namespaceImports[node.alias] = node.libraryName;
    this.addImportToLibrary(node.libraryName, node.alias);
  }

  private extractString(node:StringImport): void {
    this.stringImports.push(node.libraryName);
  }

  // NOTE: awkward! we have to convert characters from parser into line/character
  private makeRange(start:number, end:number): void {
    let line:number = 0, character:number = 0;
    let spos: Position, epos: Position;
    for(let ix = 0; ix < end; ix++) {
      if(ix === start) {
        spos = new Position(line, character);
      }
      // increment counters
      if(this.src[ix] === '\n') {
        line += 1;
        character = 0;
      } else { character += 1; }
    }
    // complete range
    epos = new Position(line, character);
    this.range = new Range(spos, epos);
  }

  private produceDefault(): string[] {
    const stmts: string[] = [];
    let imports:string[];
    const value:Dictionary = this.defaultImports;
    if(this.sortImports) {
      imports = this.sortedNamesIn(value);
    } else {
      imports = this.unsortedNamesIn(value);
    }
    imports.forEach((name, ix) => {
      if(ix === 0) {
        stmts.push('');
      }
      const library = value[name];
      stmts.push(`import ${name} from ${this.quote}${library}${this.quote}${this.semicolon}`);
    });
    return stmts;
  }

  private produceExternal():string[] {
    const stmts: string[] = [];
    let imports:string[];
    const value:Dictionary = this.externalImports;
    if(this.sortImports) {
      imports = this.sortedNamesIn(value);
    } else {
      imports = this.unsortedNamesIn(value);
    }
    imports.forEach((name, ix) => {
      if(ix === 0) {
        stmts.push('');
      }
      const library = value[name];
      stmts.push(`import ${name} = require(${this.quote}${library}${this.quote})${this.semicolon}`);
    });
    return stmts;
  }

  private produceNamedClass(): string[] {
    const stmts: string[] = [];
    let imports:string[];
    const value:Dictionary = this.namedClassImports;
    if(this.sortImports) {
      imports = this.sortedNamesIn(value);
    } else {
      imports = this.unsortedNamesIn(value);
    }
    imports.forEach((name, ix) => {
      if(ix === 0) {
        stmts.push('');
      }
      const library = value[name];
      stmts.push(`import ${this.braces[0]}${name}${this.braces[1]} from ${this.quote}${library}${this.quote}${this.semicolon}`);
    });
    return stmts;
  }

  private produceNamedFunction(): string[] {
    const stmts: string[] = [];
    let imports:string[];
    const value:Dictionary = this.namedFunctionImports;
    if(this.sortImports) {
      imports = this.sortedNamesIn(value);
    } else {
      imports = this.unsortedNamesIn(value);
    }
    imports.forEach((name, ix) => {
      if(ix === 0) {
        stmts.push('');
      }
      const library = value[name];
      stmts.push(`import ${this.braces[0]}${name}${this.braces[1]} from ${this.quote}${library}${this.quote}${this.semicolon}`);
    });
    return stmts;
  }

  private produceNamespace(): string[] {
    const stmts: string[] = [];
    let imports:string[];
    const value:Dictionary = this.namespaceImports;
    if(this.sortImports) {
      imports = this.sortedNamesIn(value);
    } else {
      imports = this.unsortedNamesIn(value);
    }
    imports.forEach((name, ix) => {
      if(ix === 0) {
        stmts.push('');
      }
      const library = value[name];
      stmts.push(`import * as ${name} from ${this.quote}${library}${this.quote}${this.semicolon}`);
    });
    return stmts;
  }

  private produceString(): string[] {
    const stmts: string[] = [];
    let strImports:string[] = this.stringImports.slice(0);
    if(this.sortImports) {
      strImports = strImports.sort(this.sortCaseInsensitive);
    }
    strImports.forEach((library, ix) => {
      if(ix === 0) {
        stmts.push('');
      }
      stmts.push(`import ${this.quote}${library}${this.quote}${this.semicolon}`);
    });
    return stmts;
  }

  private sortCaseInsensitive(a, b): number {
    return a.toLowerCase().localeCompare(b.toLowerCase());
  }

  private sortedNamesIn(dict: Dictionary): string[] {
    return Object.keys(dict).sort(this.sortCaseInsensitive);
  }

  private unsortedNamesIn(dict:Dictionary):string[] {
    return Object.keys(dict);
  }
  // private possibleSortedNamesIn(dict:Dictionary, toSort:boolean):string[] {
  //   if(toSort) {
  //     return this.sortedNamesIn(dict);
  //   } else {
  //     return this.unsortedNamesIn(dict);
  //   }
  // }

  public getClass():any {
    return Parser;
  }

  public getClassName():string {
    return 'Parser';
  }

}

/**
 * Dictionary of imports
 *
 * name of import ==> module ID
 */

 export interface Dictionary {
   [nm: string]: string;
 }
