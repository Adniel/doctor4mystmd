/**
 * Type definitions for MyST AST and Doctor integration
 */

export interface MySTNode {
  type: string;
  children?: MySTNode[];
  value?: string;
  data?: Record<string, any>;
  attributes?: Record<string, any>;
  [key: string]: any;
}

export interface MySTDocument {
  type: 'root';
  children: MySTNode[];
  data?: Record<string, any>;
}

export interface DoctorConfig {
  siteUrl: string;
  listId?: string;
  folderPath?: string;
  authentication?: {
    type: 'spfx' | 'certificate' | 'password';
    [key: string]: any;
  };
}

export interface TransformOptions {
  outputFormat: 'markdown' | 'html';
  preserveMySTFeatures: boolean;
  customMappings?: Record<string, string>;
}

export interface PublishOptions {
  doctorConfig: DoctorConfig;
  transformOptions: TransformOptions;
  sourcePath: string;
  outputPath?: string;
  watch?: boolean;
}
