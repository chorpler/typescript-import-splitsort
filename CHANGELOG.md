# Change Log
All notable changes to the "**typescript-import-splitsort**" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

### 1.0.11

- Changed to call `vscodealign.alignimports` using `vscode.command.executeCommands()` method

### 1.0.10

- Changed to use `starmobiledevelopers.vscodealign` as the alignment extension

### 1.0.9

- Fixed the `package.json` entry `main` for the new webpack directory. 😑😑😑😑😑😑😑

### 1.0.8

- Greatly reduced packaged size by excluding `node_modules/**/*`, since it's already using webpack. 😑

### 1.0.7

- Added the ability to process only selected import lines, or only the current line
- Added the ability to auto-align (with [Alignment](https://github.com/annsk/vscode-alignment) extension)
- Disabled sorting by default
- Forked by StarMobileDevelopers, so changed the icon

### 1.0.4

Fixed problem with extension activating for non-TypeScript files

### 1.0.1

After eating my own dog food for a while, it became clear that a case-insensitive sort is a Really Bad Idea! Lowercase exports are semantically different to uppercase exports: the former are typically functions and the latter classes. The two are now separated [#1](https://github.com/mflorence99/typescript-import-splitsort/issues/1).

### 1.0.0

Initial release.
