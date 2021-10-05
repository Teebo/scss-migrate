import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { getFileContent } from '@schematics/angular/utility/test';
import * as path from 'path';

const collectionPath = path.join(__dirname, '../collection.json');
const runner = new SchematicTestRunner('schematics', collectionPath);
let appTree: UnitTestTree;

const setupWorkspace = async (style = 'css') => {
  appTree = await runner.runExternalSchematicAsync(
    '@schematics/angular',
    'workspace',
    {
      name: 'scss-migrate-workspace',
      version: '1'
    }
  ).toPromise();

  appTree = await runner.runExternalSchematicAsync(
    '@schematics/angular',
    'application',
    {
      name: 'scss-migrate-app',
      style
    },
    appTree
  ).toPromise();
  return appTree;
}

describe('scss-migrate', () => {
  describe('when converting from CSS to SCSS', () => {
    beforeEach(async () => {
      appTree = await setupWorkspace();
    });


    it('should be an Angular workspace with an angular.json file', async () => {
      const tree = await runner.runSchematicAsync('scss-migrate', { cssFilesGlob: [] }, appTree).toPromise();

      expect(tree.exists('/angular.json')).toBeTruthy();
    });


    it('should not rename .css file extensions without .css files glob', async () => {
      const tree = await runner.runSchematicAsync('scss-migrate', { cssFilesGlob: [] }, appTree).toPromise();

      expect(tree.readContent('/scss-migrate-app/src/app/app.component.ts').toString().includes('app.component.css')).toBeTruthy();

      expect(tree.exists('/scss-migrate-app/src/app/app.component.css')).toBeTruthy();
    });


    it('should rename .css file extension when glob provided', async () => {
      const tree = await runner.runSchematicAsync('scss-migrate', { cssFilesGlob: ['/scss-migrate-app/src/app/app.component.css'] }, appTree).toPromise();

      expect(tree.readContent('/scss-migrate-app/src/app/app.component.ts').toString().includes('app.component.scss')).toBeTruthy();

      expect(tree.exists('/scss-migrate-app/src/app/app.component.scss')).toBeTruthy();
    });


    it('should update component styles schematics in the angular.json file', async () => {
      const tree = await runner.runSchematicAsync('scss-migrate', { cssFilesGlob: ['/scss-migrate-app/src/app/app.component.css'] }, appTree).toPromise();

      const projectWorkSpace = JSON.parse(tree.readContent('/angular.json').toString());

      const schematics = projectWorkSpace.projects['scss-migrate-app'].schematics;

      expect(schematics['@schematics/angular:component'].style).toBe('scss');
    });


    it('should rename styles.css references to styles.scss in the angular.json file', async () => {
      const tree = await runner.runSchematicAsync('scss-migrate', { cssFilesGlob: ['/scss-migrate-app/src/app/app.component.css'] }, appTree).toPromise();

      const projectWorkSpace = tree.readContent('/angular.json').toString();

      expect(projectWorkSpace.includes('styles.css')).toBeFalse();
      expect(projectWorkSpace.includes('styles.scss')).toBeTruthy();
    });

    it('should rename styles.css to styles.scss', async () => {
      const tree = await runner.runSchematicAsync('scss-migrate', { cssFilesGlob: ['/scss-migrate-app/src/app/app.component.css'] }, appTree).toPromise();

      expect(tree.exists('/scss-migrate-app/src/styles.css')).toBeFalse();
      expect(tree.exists('/scss-migrate-app/src/styles.scss')).toBeTruthy();
    });
  });

  describe('when converting from SCSS to CSS', () => {
    beforeEach(async () => {
      appTree = await setupWorkspace('scss');
  });

  it('should convert SCSS content into CSS when migrating from SCSS to CSS', async () => {
    appTree.overwrite('/scss-migrate-app/src/app/app.component.scss', `$foo: '1px solid black';
.foo {
  border: $foo;
  .bar {
    > .baz {
      color: red;
    }
  }
}
  `);
    const tree = await runner.runSchematicAsync('scss-migrate', {
      cssFilesGlob: ['/scss-migrate-app/src/app/app.component.scss'],
      from: 'scss',
      to: 'css'
    }, appTree).toPromise();
    expect(tree.exists('/scss-migrate-app/src/app/app.component.css')).toBeTrue();
    expect(tree.exists('/scss-migrate-app/src/app/app.component.scss')).toBeFalsy();

    const fileContent = getFileContent(tree, '/scss-migrate-app/src/app/app.component.css');
    expect(fileContent).toEqual(`.foo {
  border: "1px solid black";
}
.foo .bar > .baz {
  color: red;
}`);
    });

    it('should convert the root style file from SCSS to CSS', async () => {
      appTree.overwrite('/scss-migrate-app/src/styles.scss', `$foo: '1px solid black';
.foo {
  border: $foo;
  .bar {
    > .baz {
      color: red;
    }
  }
}
  `);
      const tree = await runner.runSchematicAsync('scss-migrate', {
        from: 'scss',
        to: 'css'
      }, appTree).toPromise();

      const fileContent = getFileContent(tree, '/scss-migrate-app/src/styles.css');
      expect(fileContent).toEqual(`.foo {
  border: "1px solid black";
}
.foo .bar > .baz {
  color: red;
}`);
    });
  });
});
