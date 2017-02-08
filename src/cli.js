#!/usr/bin/env node

'use strict';

import path from 'path';
import gaze from 'gaze';
import glob from 'glob';
import yargs from 'yargs';
import chalk from 'chalk';
import {DtsCreator} from './dtsCreator';

const yarg = yargs.usage('Create .css.d.ts from CSS modules *.css files.\nUsage: $0 [options] <input directory>')
  .example('$0 src/styles')
  .example('$0 src -o dist')
  .example('$0 -p styles/**/*.icss -w')
  .detectLocale(false)
  .demand(['_'])
  .alias('c', 'camelCase').describe('c', 'Convert CSS class tokens to camelcase').boolean('c')
  .alias('e', 'extension').describe('e', 'Search for files with the given extension')
  .alias('o', 'outDir').describe('o', 'Output directory')
  .alias('p', 'pattern').describe('p', 'Glob pattern with css files')
  .alias('w', 'watch').describe('w', 'Watch input directory\'s css files or pattern').boolean('w')
  .alias('h', 'help').help('h')
  .version(() => require('../package.json').version)
const consoleArguments = yarg.argv;
let creator;

function main() {
  if(consoleArguments.h) {
    yarg.showHelp();
    return;
  }

  let searchDir;
  if (consoleArguments._ && consoleArguments._[0]) {
    searchDir = consoleArguments._[0];
  } else if(consoleArguments.p) {
    searchDir = './';
  } else {
    yarg.showHelp();
    return;
  }

  const extension = agrv.e || '.css'
  const filesPattern = path.join(searchDir, consoleArguments.p || `**/*${extension}`);
  creator = new DtsCreator({
    searchDir,
    rootDir: process.cwd(),
    outDir: consoleArguments.o,
    camelCase: consoleArguments.c
  });

  if (consoleArguments.w) {
    console.log('Watch ' + filesPattern + '...');
    return gaze(filesPattern, function(err, files) {
      this.on('changed', writeFile);
      this.on('added', writeFile);
    });
  }

  return glob(filesPattern, null, (err, files) => {
    if (err) {
      console.error(err);
      return;
    }
    if (files && files.length) {
      files.forEach(writeFile);
    }
  });
}

function writeFile(file) {
  return creator.create(file, null, Boolean(consoleArguments.w))
    .then(content => content.writeFile())
    .then(content => {
      console.log('Wrote ' + chalk.green(content.outputFilePath));
      content.messageList.forEach(message => {
        console.warn(chalk.yellow('[Warn] ' + message));
      });
    })
    .catch(reason => console.error(chalk.red('[Error] ' + reason)));
}

main();

