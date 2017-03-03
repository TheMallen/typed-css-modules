/* global require, console */
/* eslint-disable no-console */
/* this file is forked from https://raw.githubusercontent.com/css-modules/css-modules-loader-core/master/src/file-system-loader.js */
import Core from 'css-modules-loader-core';
import fs from 'fs';
import path from 'path';

function traceKeySorter(first, second) {
  if (first.length < second.length) {
    return first < second.substring(0, first.length) ? -1 : 1;
  }

  if (first.length > second.length) {
    return first.substring(0, second.length) <= second ? -1 : 1;
  }

  return first < second ? -1 : 1;
}

export default class FileSystemLoader {
  constructor(root, plugins) {
    this.root = root;
    this.sources = {};
    this.importNr = 0;
    this.core = new Core(plugins);
    this.tokensByFile = {};
  }

  fetch(_newPath, relativeTo, _trace, initialContents) {
    const newPath = _newPath.replace(/^["']|["']$/g, '');
    const trace = _trace || String.fromCharCode(this.importNr++);

    return new Promise((resolve, reject) => {
      const relativeDir = path.dirname(relativeTo);
      const rootRelativePath = path.resolve(relativeDir, newPath);
      let fileRelativePath = path.resolve(path.join(this.root, relativeDir), newPath);

      // if the path is not relative or absolute, try to resolve it in node_modules
      if (newPath[0] !== '.' && newPath[0] !== '/') {
        try {
          fileRelativePath = require.resolve(newPath);
        } catch (error) {
          console.log(error);
        }
      }

      if (!initialContents) {
        const tokens = this.tokensByFile[fileRelativePath];
        if (tokens) { return resolve(tokens); }

        fs.readFile(fileRelativePath, 'utf-8', (err, source) => {
          if (err && relativeTo && relativeTo !== '/') {
            return resolve([]);
          }

          if (err && (!relativeTo || relativeTo === '/')) {
            return reject(err);
          }

          return this.core.load(source, rootRelativePath, trace, this.fetch.bind(this))
            .then(({injectableSource, exportTokens}) => {
              this.sources[trace] = injectableSource;
              this.tokensByFile[fileRelativePath] = exportTokens;
              return resolve(exportTokens);
            }, reject);
        });
      }

      return this.core.load(initialContents, rootRelativePath, trace, this.fetch.bind(this))
        .then(({injectableSource, exportTokens}) => {
          this.sources[trace] = injectableSource;
          this.tokensByFile[fileRelativePath] = exportTokens;
          return resolve(exportTokens);
        }, reject);
    });
  }

  get finalSource() {
    return Object.keys(this.sources)
      .sort(traceKeySorter)
      .map((source) => this.sources[source])
      .join('');
  }

  clear() {
    this.tokensByFile = {};
    return this;
  }
}
