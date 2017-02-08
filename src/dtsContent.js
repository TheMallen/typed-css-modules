'use strict';

import fs from 'fs';
import os from 'os';
import path from'path';

import isThere from 'is-there';
import mkdirp from 'mkdirp';

export default class DtsContent {
  constructor({
    rootDir,
    searchDir,
    outDir,
    rInputPath,
    rawTokenList,
    resultList,
    messageList,
    allowGenericStringAccess,
  }) {
    this.rootDir = rootDir;
    this.searchDir = searchDir;
    this.outDir = outDir;
    this.rInputPath = rInputPath;
    this.rawTokenList = rawTokenList;
    this.resultList = resultList;
    this.messageList = messageList;
    this.allowGenericStringAccess = allowGenericStringAccess;
  }

  get contents() {
    return this.resultList.map((key) => `${key}: string;`);
  }

  get formatted() {
    if(!this.contents || !this.contents.length) return 'export default {};';

    const lines = [
      'type Styles = {',
      this.contents.map((row) => ` ${row}`).join(os.EOL),
    ]

    if (this.allowGenericStringAccess) {
      lines.push(' [key: string]: string;');
    }

    return lines.concat([
      '}',
      'declare const styles: Styles',
      'export = styles',
    ]).join(os.EOL);
  }

  get tokens() {
    return this.rawTokenList;
  }

  get outputFilePath() {
    return path.join(this.rootDir, this.outDir, this.rInputPath + '.d.ts');
  }

  get inputFilePath() {
    return path.join(this.rootDir, this.searchDir, this.rInputPath);
  }

  writeFile() {
    var outPathDir = path.dirname(this.outputFilePath);
    if(!isThere(outPathDir)) {
      mkdirp.sync(outPathDir);
    }
    return new Promise((resolve, reject) => {
      fs.writeFile(this.outputFilePath, this.formatted + os.EOL, 'utf8', (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(this);
        }
      });
    });
  }
}
