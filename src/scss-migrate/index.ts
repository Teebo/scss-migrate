import { Rule, SchematicContext, Tree, url, apply, template, mergeWith } from '@angular-devkit/schematics';
import { Schema } from './schema';
import { strings } from '@angular-devkit/core';


// You don't have to export the function as default. You can also have more than one rule factory
// per file.
export function scssMigrate(_options: Schema): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    const { name } = _options;

    const sourceTemplates = url('./');

    const sourceParametrizedTemplate = apply(sourceTemplates, [
      template({
        ..._options,
        ...strings
      })
    ])

    tree.create('hello.js', `console.log('hello ${name}!')`);

    return mergeWith(sourceParametrizedTemplate)(tree, _context);
  };
}
