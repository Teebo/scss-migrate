export interface Schema {
    project?: string;
    from?: StyleExtension;
    to?: StyleExtension;
    cssFilesGlob?: string[];
}

export type StyleExtension = 'css' | 'scss';