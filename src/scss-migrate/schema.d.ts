export interface Schema {
    from?: StyleExtension;
    to?: StyleExtension;
    cssFilesGlob?: string[];
}

export type StyleExtension = 'css' | 'scss';