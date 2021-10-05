import { Rule, SchematicContext, Tree, SchematicsException } from '@angular-devkit/schematics';
import { buildDefaultPath } from '@schematics/angular/utility/workspace';
import { renderSync } from 'sass';
import { Schema } from './schema';

export function scssMigrate(options: Schema): Rule {
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
            styleSheetFormat = styleSheetFormat = options.to;
          } else {
            componentSchematics.style = options.to;
          }
        } else {
          workspaceSchematics['@schematics/angular:component'] = {
            "style": options.to
          };
        }
      } else {
        project.schematics = { ['@schematics/angular:component']: {} };

        project.schematics['@schematics/angular:component'] = {
          "style": options.to
        };
      }

      const stringifiedWorkspaceConfig = JSON.stringify(workspaceConfig, null, "\t").replace(/styles.css/g, `styles.${options.to}`);
      project.extensions = { projectType: project.projectType };

      const defaultProjectPath = buildDefaultPath(project);
      const lastPosOfPathDelimiter = defaultProjectPath.lastIndexOf('/');
      const srcRoot = defaultProjectPath.substr(0, lastPosOfPathDelimiter + 1);

      // convert root styles.scss file content
      if (options.from === 'scss' && options.to === 'css') {
        const target = `${srcRoot}styles.scss`;
        const data = tree.read(target).toString();
        const result = renderSync({ data });
        tree.create(`${srcRoot}styles.css`, result.css.toString());
        tree.delete(`${srcRoot}styles.scss`);
      } else {
        tree.exists(`${srcRoot}/styles.${options.from}`) && tree.rename(
          `${srcRoot}/styles.${options.from}`,
          `${srcRoot}/styles.${options.to}`
        );
      }

      let filePaths = glob.sync(`.${defaultProjectPath}/**/*.${options.from}`);

      filePaths = filePaths.length ? filePaths : options.cssFilesGlob.length ? options.cssFilesGlob : [];
      filePaths.length && tree.overwrite('/angular.json', stringifiedWorkspaceConfig);

      filePaths.forEach((filePath: string) => {
        let relativeComponentClassFileContent: Buffer;
        let filePathNoExtension: string = filePath.substr(0, filePath.lastIndexOf('.'));
        let fileName: string = filePathNoExtension.substr(filePathNoExtension.lastIndexOf('/') + 1, filePathNoExtension.length)
        let newFilePath: string = `${filePathNoExtension}.${options.to}`;


        // convert file content
        if (options.from === 'scss' && options.to === 'css') {
          const data = tree.read(filePath).toString();
          const result = renderSync({ data });
          tree.create(newFilePath, result.css.toString());
          tree.delete(filePath);
        } else {
          tree.rename(filePath, newFilePath);
        }

        const componentClassFileName = `${filePathNoExtension}.ts`;

        relativeComponentClassFileContent = tree.exists(componentClassFileName) ? tree.read(componentClassFileName) : null;

        if (relativeComponentClassFileContent) {
          const relativeComponentClassFileContentAsString = relativeComponentClassFileContent.toString();
          const finalComponentClassFileContent: string = relativeComponentClassFileContentAsString?.replace(
            `${fileName}.${options.from}`,
            `${fileName}.${options.to}`
          );

          tree.overwrite(componentClassFileName, finalComponentClassFileContent);
        }
      });
    }

    return tree;
  };
}
