'use strict';

import path from'path';
import process from 'process';
import camelcase from 'camelcase';

import {TokenValidator} from './tokenValidator';
import FileSystemLoader from './fileSystemLoader';
import DtsContent from './dtsContent';

let validator = new TokenValidator();

export class DtsCreator {
  constructor(options) {
    if(!options) options = {};
    this.rootDir = options.rootDir || process.cwd();
    this.searchDir = options.searchDir || '';
    this.outDir = options.outDir || this.searchDir;
    this.loader = new FileSystemLoader(this.rootDir);
    this.inputDirectory = path.join(this.rootDir, this.searchDir);
    this.outputDirectory = path.join(this.rootDir, this.outDir);
    this.camelCase = !!options.camelCase;
    this.allowGenericStringAccess = options.allowGenericStringAccess;
  }

  create(filePath, initialContents, clearCache = false) {
    return new Promise((resolve, reject) => {
      let rInputPath;
      if (path.isAbsolute(filePath)) {
        rInputPath = path.relative(this.inputDirectory, filePath);
      } else {
        rInputPath = path.relative(this.inputDirectory, path.join(process.cwd(), filePath));
      }

      if (clearCache) {
        this.loader.tokensByFile = {};
      }

      this.loader.fetch(filePath, "/", undefined, initialContents).then((res) => {
        if (res) {
          const tokens = res;
          const keys = Object.keys(tokens);
          const messageList = [];
          const validKeys = [];

          keys.forEach(key => {
            const convertedKey = this.camelCase ? camelcase(key) : key;
            var ret = validator.validate(convertedKey);
            if (ret.isValid) {
              validKeys.push(convertedKey);
            } else {
              messageList.push(ret.message);
            }
          });

          const {allowGenericStringAccess} = this;
          const content = new DtsContent({
            rootDir: this.rootDir,
            searchDir: this.searchDir,
            outDir: this.outDir,
            resultList: validKeys,
            rawTokenList: keys,
            rInputPath,
            messageList,
            allowGenericStringAccess,
          });

          resolve(content);
        } else {
          reject(res);
        }
      }).catch((err) => reject(err));
    });
  }
}
