import { Rule, SchematicContext, Tree, SchematicsException } from '@angular-devkit/schematics';
import { buildDefaultPath } from '@schematics/angular/utility/project'
import { Schema } from './schema';

export function scssMigrate(_options: Schema): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    const glob = require("glob");
    const workspaceConfigBuffer = tree.read("/angular.json");

    if (!workspaceConfigBuffer) {
      throw new SchematicsException('Not an Angular CLI project')
    } else {
      const workspaceConfig = JSON.parse(workspaceConfigBuffer.toString());
      const projectName = workspaceConfig.defaultProject;
      const project = workspaceConfig.projects[projectName];

      // Needs improvement, maybe use shelljs.exec('ng config schematics.@schematics/angular:component.style scss')?
      // Maybe its possible to use RunSchematicTask from '@angular-devkit/schematics/tasks'? To achieve  
      // adding the new style schematic?

      const workspaceSchematics = project ? project.schematics ? project.schematics : null : undefined;

      if (workspaceSchematics === undefined) {
        throw new SchematicsException('Not a valid Angular CLI project')
      }

      if (workspaceSchematics) {
        let componentSchematics = workspaceSchematics['@schematics/angular:component'];

        if (componentSchematics) {
          let styleSheetFormat = componentSchematics.style;

          componentSchematics.styleExt && delete componentSchematics.styleExt;

          if (styleSheetFormat) {
            styleSheetFormat = styleSheetFormat = _options.to;
          } else {
            componentSchematics.style = _options.to;
          }
        } else {
          workspaceSchematics['@schematics/angular:component'] = {
            "style": _options.to
          };
        }
      } else {
        project.schematics = { ['@schematics/angular:component']: {} };

        project.schematics['@schematics/angular:component'] = {
          "style": _options.to
        };
      }

      tree.overwrite('/angular.json', JSON.stringify(workspaceConfig, null, "\t"));

      const defaultProjectPath = buildDefaultPath(project);
      let filePaths = glob.sync(`.${defaultProjectPath}/**/*.${_options.from}`);

      filePaths = filePaths.length ? filePaths : _options.cssFilesGlob.length ? _options.cssFilesGlob : [];

      console.log('Files to rename\n', filePaths);

      filePaths.forEach((filePath: string) => {
        let relativeComponentClassFileContent: Buffer;
        let filePathNoExtension: string = filePath.substr(0, filePath.lastIndexOf('.'));
        let fileName: string = filePathNoExtension.substr(filePathNoExtension.lastIndexOf('/') + 1, filePathNoExtension.length)
        let newFilePath: string = `${filePathNoExtension}.${_options.to}`;

        tree.rename(filePath, newFilePath);

        const componentClassFileName = `${filePathNoExtension}.ts`;

        relativeComponentClassFileContent = tree.exists(componentClassFileName) ? tree.read(componentClassFileName) : null;

        if (relativeComponentClassFileContent) {
          const relativeComponentClassFileContentAsString = relativeComponentClassFileContent.toString();
          const finalComponentClassFileContent: string = relativeComponentClassFileContentAsString?.replace(
            `${fileName}.${_options.from}`,
            `${fileName}.${_options.to}`
          );

          tree.overwrite(componentClassFileName, finalComponentClassFileContent);
        }
      });
    }

    return tree;
  };
}
