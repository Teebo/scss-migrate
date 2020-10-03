"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scssMigrate = void 0;
const schematics_1 = require("@angular-devkit/schematics");
const project_1 = require("@schematics/angular/utility/project");
function scssMigrate(_options) {
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
                        styleSheetFormat = styleSheetFormat = _options.to;
                    }
                    else {
                        componentSchematics.style = _options.to;
                    }
                }
                else {
                    workspaceSchematics['@schematics/angular:component'] = {
                        "style": _options.to
                    };
                }
            }
            else {
                project.schematics = { ['@schematics/angular:component']: {} };
                project.schematics['@schematics/angular:component'] = {
                    "style": _options.to
                };
            }
            const stringifiedWorkspaceConfig = JSON.stringify(workspaceConfig, null, "\t").replace(/styles.css/g, `styles.${_options.to}`);
            tree.overwrite('/angular.json', stringifiedWorkspaceConfig);
            const defaultProjectPath = project_1.buildDefaultPath(project);
            const lastPosOfPathDelimiter = defaultProjectPath.lastIndexOf('/');
            const srcRoot = defaultProjectPath.substr(0, lastPosOfPathDelimiter + 1);
            tree.exists(`${srcRoot}/styles.${_options.from}`) && tree.rename(`${srcRoot}/styles.${_options.from}`, `${srcRoot}/styles.${_options.to}`);
            let filePaths = glob.sync(`.${defaultProjectPath}/**/*.${_options.from}`);
            filePaths = filePaths.length ? filePaths : _options.cssFilesGlob.length ? _options.cssFilesGlob || [] : [];
            console.log('Files to rename\n', filePaths);
            filePaths.forEach((filePath) => {
                let relativeComponentClassFileContent;
                let filePathNoExtension = filePath.substr(0, filePath.lastIndexOf('.'));
                let fileName = filePathNoExtension.substr(filePathNoExtension.lastIndexOf('/') + 1, filePathNoExtension.length);
                let newFilePath = `${filePathNoExtension}.${_options.to}`;
                tree.rename(filePath, newFilePath);
                const componentClassFileName = `${filePathNoExtension}.ts`;
                relativeComponentClassFileContent = tree.exists(componentClassFileName) ? tree.read(componentClassFileName) : null;
                if (relativeComponentClassFileContent) {
                    const relativeComponentClassFileContentAsString = relativeComponentClassFileContent.toString();
                    const finalComponentClassFileContent = relativeComponentClassFileContentAsString === null || relativeComponentClassFileContentAsString === void 0 ? void 0 : relativeComponentClassFileContentAsString.replace(`${fileName}.${_options.from}`, `${fileName}.${_options.to}`);
                    tree.overwrite(componentClassFileName, finalComponentClassFileContent);
                }
            });
        }
        return tree;
    };
}
exports.scssMigrate = scssMigrate;
