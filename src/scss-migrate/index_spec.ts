import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import * as path from 'path';

const collectionPath = path.join(__dirname, '../collection.json');
const runner = new SchematicTestRunner('schematics', collectionPath);
let appTree: UnitTestTree;

describe('scss-migrate', () => {
  beforeEach(async () => {
    appTree = await runner.runExternalSchematicAsync(
      '@schematics/angular',
      'workspace',
      {
        name: 'scss-migrate-workspace',
        version: '1',
      }
    ).toPromise();

    appTree = await runner.runExternalSchematicAsync(
      '@schematics/angular',
      'application',
      {
        name: 'scss-migrate-app',
        defaultProject: 'scss-migrate-app',
        projects: {
          ['scss-migrate-app']: {
            schematics: {
              ['@schematics/angular:component']: {
                "style": "css"
              }
            }
          }
        }
      },
      appTree
    ).toPromise();
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
