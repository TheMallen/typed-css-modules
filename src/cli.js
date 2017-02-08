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
const argv = yarg.argv;
let creator;

function main() {
  if(argv.h) {
    yarg.showHelp();
    return;
  }

  let searchDir;
  if (argv._ && argv._[0]) {
    searchDir = argv._[0];
  } else if(argv.p) {
    searchDir = './';
  } else {
    yarg.showHelp();
    return;
  }

  const extension = agrv.e || '.css'
  const filesPattern = path.join(searchDir, argv.p || `**/*${extension}`);
  creator = new DtsCreator({
    searchDir,
    rootDir: process.cwd(),
    outDir: argv.o,
    camelCase: argv.c
  });

  if (argv.w) {
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
  return creator.create(file, null, !!argv.w)
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

