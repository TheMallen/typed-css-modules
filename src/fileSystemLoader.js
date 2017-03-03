/* global require, console */
/* eslint-disable no-console */
/* this file is forked from https://raw.githubusercontent.com/css-modules/css-modules-loader-core/master/src/file-system-loader.js */
import Core from 'css-modules-loader-core';
import fs from 'fs';
import path from 'path';

function traceKeySorter(first, second) {
  if (first.length < second.length) {
    return first < second.substring(0, first.length) ? -1 : 1;
  } else if (first.length > second.length) {
    return first.substring(0, second.length) <= second ? -1 : 1;
  } else {
    return first < second ? -1 : 1;
  }
};

export default class FileSystemLoader {
  constructor(root, plugins) {
    this.root = root;
    this.sources = {};
    this.importNr = 0;
    this.core = new Core(plugins);
    this.tokensByFile = {};
  }


  fetch( _newPath, relativeTo, _trace, initialContents ) {
    let newPath = _newPath.replace( /^["']|["']$/g, "" ),
      trace = _trace || String.fromCharCode( this.importNr++ )
    return new Promise( ( resolve, reject ) => {
      let relativeDir = path.dirname( relativeTo ),
        rootRelativePath = path.resolve( relativeDir, newPath ),
        fileRelativePath = path.resolve( path.join( this.root, relativeDir ), newPath )

      // if the path is not relative or absolute, try to resolve it in node_modules
      if (newPath[0] !== '.' && newPath[0] !== '/') {
        try {
          fileRelativePath = require.resolve(newPath);
        }
        catch (e) {}
      }

      if(!initialContents) {
        const tokens = this.tokensByFile[fileRelativePath]
        if (tokens) { return resolve(tokens) }

        fs.readFile( fileRelativePath, "utf-8", ( err, source ) => {
          if ( err && relativeTo && relativeTo !== '/') {
            resolve([]);
          }else if ( err && (!relativeTo || relativeTo === '/')) {
            reject(err);
          }else{
            this.core.load( source, rootRelativePath, trace, this.fetch.bind( this ) )
            .then( ( { injectableSource, exportTokens } ) => {
              this.sources[trace] = injectableSource
              this.tokensByFile[fileRelativePath] = exportTokens
              resolve( exportTokens )
            }, reject )
          }
        } )
      }else{
        this.core.load( initialContents, rootRelativePath, trace, this.fetch.bind(this) )
        .then( ( { injectableSource, exportTokens } ) => {
          this.sources[trace] = injectableSource
          this.tokensByFile[fileRelativePath] = exportTokens
          resolve( exportTokens )
        }, reject )
      }
    } )
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
