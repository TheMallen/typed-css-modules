/* global require, console */
/* eslint-disable no-console */
/* this file is forked from https://raw.githubusercontent.com/css-modules/css-modules-loader-core/master/src/file-system-loader.js */
import Core from 'css-modules-loader-core';
import path from 'path';
import sass from 'node-sass';

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
        } catch (event) {}
      }

      if (initialContents) {
        return this.core.load(initialContents, rootRelativePath, trace, this.fetch.bind(this))
          .then(({injectableSource, exportTokens}) => {
            this.sources[trace] = injectableSource;
            this.tokensByFile[fileRelativePath] = exportTokens;
            return resolve(exportTokens);
          })
          .catch(reject);
      }

      const tokens = this.tokensByFile[fileRelativePath];
      if (tokens) {
        return resolve(tokens);
      }

      getSource(fileRelativePath, relativeTo)
        .then((source) => this.core.load(source, rootRelativePath, trace, this.fetch.bind(this)))
        .then(({injectableSource, exportTokens}) => {
          this.sources[trace] = injectableSource;
          this.tokensByFile[fileRelativePath] = exportTokens;
          return resolve(exportTokens);
        })
        .catch(reject);
    });
  }

  get finalSource() {
    return Object.keys(this.sources).sort(traceKeySorter).map((s) => this.sources[s])
      .join('');
  }

  clear() {
    this.tokensByFile = {};
    return this;
  }
}

function getSource(file, relativeTo) {
  return new Promise((resolve, reject) => {
    sass.render({file}, (err, result) => {
      if (err && relativeTo && relativeTo !== '/') {
        return resolve([]);
      }

      if (err && (!relativeTo || relativeTo === '/')) {
        return reject(err);
      }

      resolve(result.css.toString());
    });
  });
}
