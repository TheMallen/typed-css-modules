'use strict';

var path = require('path');
var os = require('os');
var assert = require('assert');
var DtsCreator = require('../lib/dtsCreator').DtsCreator;

const cssOutput = [
  'type Styles = {',
  ' myClass: string;',
  ' myOtherClass: string;',
  ' PascalClass: string;',
  ' [key: string]: string;',
  '}',
  'declare const styles: Styles',
  'export = styles',
].join(os.EOL);

const cssOutputSimple = [
  'type Styles = {',
  ' myClass: string;',
  ' [key: string]: string;',
  '}',
  'declare const styles: Styles',
  'export = styles',
].join(os.EOL);

const cssOutputCamelized = [
  'type Styles = {',
  ' myClass: string;',
  ' myOtherClass: string;',
  ' pascalClass: string;',
  ' [key: string]: string;',
  '}',
  'declare const styles: Styles',
  'export = styles',
].join(os.EOL);


describe('DtsCreator', () => {
  var creator = new DtsCreator();

  describe('#create', () => {
    it('returns DtsContent instance simple css', () => {
      return creator.create('test/testStyle.css')
        .then((content) => {
          assert.equal(content.formatted, cssOutput);
        });
    });

    it('rejects an error with invalid CSS', () => {
      return creator
        .create('test/errorCss.css')
        .then((content) => {
          assert.fail();
        })
        .catch((err) => {
          assert.equal(err.name, 'CssSyntaxError');
        });
    });

    it('returns DtsContent instance from the pair of path and contents', () => {
      return creator.create('test/somePath', `.myClass { color: red }`)
        .then((content) => {
          assert.equal(content.formatted, cssOutputSimple);
        });
    });
  });

  describe('#modify path', () => {
    it('can be set outDir', () => {
      return new DtsCreator({searchDir: "test", outDir: "dist"})
        .create('test/testStyle.css')
        .then((content) => {
          assert.equal(path.relative(process.cwd(), content.outputFilePath), "dist/testStyle.css.d.ts");
        });
    });
  });

});

describe('DtsContent', () => {

  describe('#tokens', () => {
    it('returns original tokens', () => {
      return new DtsCreator()
        .create('test/testStyle.css')
        .then(content => {
          assert.equal(content.tokens[0], "myClass");
        });
    });
  });

  describe('#inputFilePath', () => {
    it('returns original CSS file name', () => {
      return new DtsCreator()
        .create('test/testStyle.css')
        .then(content => {
          assert.equal(path.relative(process.cwd(), content.inputFilePath), "test/testStyle.css");
        });
    });
  });

  describe('#formatted', () => {
    it('returns formatted .d.ts string', () => {
      return new DtsCreator()
        .create('test/testStyle.css')
        .then(content => {
          assert.equal(content.formatted, cssOutput);
        });
    });

    it('returns empty object exportion when the result list has no items', () => {
      return new DtsCreator()
        .create('test/empty.css')
        .then(content => {
          assert.equal(content.formatted, "export default {};");
        });
    });

    it('returns camelized tokens when the camelCase option is set', () => {
      return new DtsCreator({camelCase: true})
        .create('test/kebabed.css')
        .then(content => {
          console.log(content.tokens);
          console.log(content.resultList);
          console.log(content.contents);
          assert.equal(content.formatted, cssOutputCamelized);
        });
    });
  });

  describe('#writeFile', () => {
    it('writes a file', () => {
      return new DtsCreator()
        .create('test/testStyle.css')
        .then(content => {
          return content.writeFile();
        });
    });
  });

});
