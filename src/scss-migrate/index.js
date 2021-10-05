"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scssMigrate = void 0;
const schematics_1 = require("@angular-devkit/schematics");
const workspace_1 = require("@schematics/angular/utility/workspace");
const sass_1 = require("sass");
function scssMigrate(options) {
    return (tree, _context) => {
        const glob = require("glob");
        const workspaceConfigBuffer = tree.read("/angular.json");
        if (!workspaceConfigBuffer) {
            throw new schematics_1.SchematicsException('Not an Angular CLI project');
        }
        else {
            const workspaceConfig = JSON.parse(workspaceConfigBuffer.toString());
            const projectName = workspaceConfig.defaultProject;
            const project = workspaceConfig.projects[projectName];
            // Needs improvement, maybe use shelljs.exec('ng config schematics.@schematics/angular:component.style scss')?
            // Maybe its possible to use RunSchematicTask from '@angular-devkit/schematics/tasks'? To achieve
            // adding the new style schematic?
            const workspaceSchematics = project ? project.schematics ? project.schematics : null : undefined;
            if (workspaceSchematics === undefined) {
                throw new schematics_1.SchematicsException('Not a valid Angular CLI project');
            }
            if (workspaceSchematics) {
                let componentSchematics = workspaceSchematics['@schematics/angular:component'];
                if (componentSchematics) {
                    let styleSheetFormat = componentSchematics.style;
                    componentSchematics.styleExt && delete componentSchematics.styleExt;
                    if (styleSheetFormat) {
                        styleSheetFormat = styleSheetFormat = options.to;
                    }
                    else {
                        componentSchematics.style = options.to;
                    }
                }
                else {
                    workspaceSchematics['@schematics/angular:component'] = {
                        "style": options.to
                    };
                }
            }
            else {
                project.schematics = { ['@schematics/angular:component']: {} };
                project.schematics['@schematics/angular:component'] = {
                    "style": options.to
                };
            }
            const stringifiedWorkspaceConfig = JSON.stringify(workspaceConfig, null, "\t").replace(/styles.css/g, `styles.${options.to}`);
            project.extensions = { projectType: project.projectType };
            const defaultProjectPath = workspace_1.buildDefaultPath(project);
            const lastPosOfPathDelimiter = defaultProjectPath.lastIndexOf('/');
            const srcRoot = defaultProjectPath.substr(0, lastPosOfPathDelimiter + 1);
            // convert root styles.scss file content
            if (options.from === 'scss' && options.to === 'css') {
                const target = `${srcRoot}styles.scss`;
                const data = tree.read(target).toString();
                const result = sass_1.renderSync({ data });
                tree.create(`${srcRoot}styles.css`, result.css.toString());
                tree.delete(`${srcRoot}styles.scss`);
            }
            else {
                tree.exists(`${srcRoot}/styles.${options.from}`) && tree.rename(`${srcRoot}/styles.${options.from}`, `${srcRoot}/styles.${options.to}`);
            }
            let filePaths = glob.sync(`.${defaultProjectPath}/**/*.${options.from}`);
            filePaths = filePaths.length ? filePaths : options.cssFilesGlob.length ? options.cssFilesGlob : [];
            filePaths.length && tree.overwrite('/angular.json', stringifiedWorkspaceConfig);
            filePaths.forEach((filePath) => {
                let relativeComponentClassFileContent;
                let filePathNoExtension = filePath.substr(0, filePath.lastIndexOf('.'));
                let fileName = filePathNoExtension.substr(filePathNoExtension.lastIndexOf('/') + 1, filePathNoExtension.length);
                let newFilePath = `${filePathNoExtension}.${options.to}`;
                // convert file content
                if (options.from === 'scss' && options.to === 'css') {
                    const data = tree.read(filePath).toString();
                    const result = sass_1.renderSync({ data });
                    tree.create(newFilePath, result.css.toString());
                    tree.delete(filePath);
                }
                else {
                    tree.rename(filePath, newFilePath);
                }
                const componentClassFileName = `${filePathNoExtension}.ts`;
                relativeComponentClassFileContent = tree.exists(componentClassFileName) ? tree.read(componentClassFileName) : null;
                if (relativeComponentClassFileContent) {
                    const relativeComponentClassFileContentAsString = relativeComponentClassFileContent.toString();
                    const finalComponentClassFileContent = relativeComponentClassFileContentAsString === null || relativeComponentClassFileContentAsString === void 0 ? void 0 : relativeComponentClassFileContentAsString.replace(`${fileName}.${options.from}`, `${fileName}.${options.to}`);
                    tree.overwrite(componentClassFileName, finalComponentClassFileContent);
                }
            });
        }
        return tree;
    };
}
exports.scssMigrate = scssMigrate;
