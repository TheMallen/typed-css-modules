import path from 'path';
import process from 'process';
import camelcase from 'camelcase';

import {TokenValidator} from './tokenValidator';
import FileSystemLoader from './fileSystemLoader';
import DtsContent from './dtsContent';

const validator = new TokenValidator();

export class DtsCreator {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
    this.searchDir = options.searchDir || '';
    this.outDir = options.outDir || this.searchDir;
    this.loader = new FileSystemLoader(this.rootDir);
    this.inputDirectory = path.join(this.rootDir, this.searchDir);
    this.outputDirectory = path.join(this.rootDir, this.outDir);
    this.camelCase = Boolean(options.camelCase);
    this.allowGenericStringAccess = options.allowGenericStringAccess;
  }

  create(filePath, initialContents, clearCache = false) {
    return new Promise((resolve, reject) => {
      const rInputPath = path.isAbsolute(filePath)
        ? path.relative(this.inputDirectory, filePath)
        : path.relative(this.inputDirectory, path.join(process.cwd(), filePath));

      if (clearCache) {
        this.loader.tokensByFile = {};
      }

      this.loader.fetch(filePath, '/', null, initialContents)
        .then((res) => {
          if (!res) {
            return reject(res);
          }

          const tokens = res;
          const keys = Object.keys(tokens);
          const messageList = [];
          const validKeys = [];

          keys.forEach((key) => {
            const convertedKey = this.camelCase ? camelcase(key) : key;
            const ret = validator.validate(convertedKey);

            if (ret.isValid) {
              return validKeys.push(convertedKey);
            }

            return messageList.push(ret.message);
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

          return resolve(content);
        })
        .catch((err) => reject(err));
    });
  }
}
