/* global require, describe, it, process */
/* eslint-disable strict */

'use strict';

const path = require('path');
const os = require('os');
const assert = require('assert');
const DtsCreator = require('../lib/dtsCreator').DtsCreator;

const cssOutput = [
  'interface Styles {',
  ' myClass: string,',
  ' myOtherClass: string,',
  ' PascalClass: string,',
  '}',
  'declare const styles: Styles;',
  'export = styles;',
].join(os.EOL);

const cssOutputSimple = [
  'interface Styles {',
  ' myClass: string,',
  '}',
  'declare const styles: Styles;',
  'export = styles;',
].join(os.EOL);

const cssOutputWithGenericAccess = [
  'interface Styles {',
  ' myClass: string,',
  ' myOtherClass: string,',
  ' PascalClass: string,',
  ' [key: string]: string,',
  '}',
  'declare const styles: Styles;',
  'export = styles;',
].join(os.EOL);

const cssOutputCamelized = [
  'interface Styles {',
  ' myClass: string,',
  ' myOtherClass: string,',
  ' pascalClass: string,',
  '}',
  'declare const styles: Styles;',
  'export = styles;',
].join(os.EOL);


describe('DtsCreator', () => {
  const creator = new DtsCreator();

  describe('#create', () => {
    it('returns DtsContent instance for simple css', () => {
      return creator.create('test/testStyle.css')
        .then((content) => {
          return assert.equal(content.formatted, cssOutput);
        });
    });

    it('returns DtsContent instance for scss', () => {
      return creator.create('test/scssSyntax.scss')
        .then((content) => {
          return assert.equal(content.formatted, cssOutput);
        });
    });

    it('rejects an error with invalid CSS', () => {
      return creator
        .create('test/errorCss.css')
        .then(() => {
          return assert.fail();
        })
        .catch((err) => {
          assert.equal(err.name, 'Error');
        });
    });

    it('returns DtsContent instance from the pair of path and contents', () => {
      return creator.create('test/somePath', '.myClass { color: red }')
        .then((content) => {
          return assert.equal(content.formatted, cssOutputSimple);
        });
    });
  });

  describe('#modify path', () => {
    it('can be set outDir', () => {
      return new DtsCreator({searchDir: 'test', outDir: 'dist'})
        .create('test/testStyle.css')
        .then((content) => {
          return assert.equal(path.relative(process.cwd(), content.outputFilePath), 'dist/testStyle.css.d.ts');
        });
    });
  });

});

describe('DtsContent', () => {

  describe('#tokens', () => {
    it('returns original tokens', () => {
      return new DtsCreator()
        .create('test/testStyle.css')
        .then((content) => {
          return assert.equal(content.tokens[0], 'myClass');
        });
    });
  });

  describe('#inputFilePath', () => {
    it('returns original CSS file name', () => {
      return new DtsCreator()
        .create('test/testStyle.css')
        .then((content) => {
          return assert.equal(path.relative(process.cwd(), content.inputFilePath), 'test/testStyle.css');
        });
    });
  });

  describe('#formatted', () => {
    it('returns formatted .d.ts string', () => {
      return new DtsCreator()
        .create('test/testStyle.css')
        .then((content) => {
          return assert.equal(content.formatted, cssOutput);
        });
    });

    it('returns empty object exportion when the result list has no items', () => {
      return new DtsCreator()
        .create('test/empty.css')
        .then((content) => {
          return assert.equal(content.formatted, 'export default {};');
        });
    });

    it('returns camelized tokens when the camelCase option is set', () => {
      return new DtsCreator({camelCase: true})
        .create('test/kebabed.css')
        .then((content) => {
          return assert.equal(content.formatted, cssOutputCamelized);
        });
    });

    it('returns content with generic string key access when the allowGenericStringAccess option is set', () => {
      return new DtsCreator({allowGenericStringAccess: true})
        .create('test/testStyle.css')
        .then((content) => {
          return assert.equal(content.formatted, cssOutputWithGenericAccess);
        });
    });
  });

  describe('#writeFile', () => {
    it('writes a file', () => {
      return new DtsCreator()
        .create('test/testStyle.css')
        .then((content) => {
          return content.writeFile();
        });
    });
  });

});
