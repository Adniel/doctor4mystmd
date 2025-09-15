/**
 * Main entry point for Doctor4MySTMD
 */

import { MySTASTParser } from './ast-parser';
import { MySTASTTransformer } from './ast-transformer';
import { DoctorIntegration } from './doctor-integration';
import { DoctorConfig, TransformOptions } from './types';

export { MySTASTParser } from './ast-parser';
export { MySTASTTransformer } from './ast-transformer';
export { DoctorIntegration } from './doctor-integration';
export * from './types';

// Main application class
export class Doctor4MySTMD {
  private parser: MySTASTParser;
  private transformer: MySTASTTransformer;
  private doctor: DoctorIntegration;

  constructor(
    doctorConfig: DoctorConfig,
    transformOptions: TransformOptions,
    mystmdPath: string = 'mystmd',
    doctorPath: string = 'doctor'
  ) {
    this.parser = new MySTASTParser(mystmdPath);
    this.transformer = new MySTASTTransformer(transformOptions);
    this.doctor = new DoctorIntegration(doctorConfig, doctorPath);
  }

  /**
   * Initialize the application
   */
  async initialize(): Promise<void> {
    await this.doctor.initialize();
  }

  /**
   * Process and publish MyST content
   */
  async processAndPublish(
    inputPath: string,
    options: {
      title?: string;
      description?: string;
      pattern?: string;
    } = {}
  ): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();
    
    try {
      // Parse MyST content
      const stat = await import('fs-extra').then(fs => fs.stat(inputPath));
      let asts: Map<string, any>;
      
      if (stat.isDirectory()) {
        asts = await this.parser.parseDirectory(inputPath, options.pattern || '**/*.md');
      } else {
        const ast = await this.parser.parseFile(inputPath);
        asts = new Map([[inputPath, ast]]);
      }
      
      // Process each file
      for (const [filePath, ast] of asts) {
        try {
          // Transform AST to content
          let content: string;
          if (this.transformer['options'].outputFormat === 'html') {
            content = await this.transformer.transformToHTML(ast);
          } else {
            content = await this.transformer.transformToMarkdown(ast);
          }
          
          // Publish to SharePoint
          const title = options.title || require('path').basename(filePath, '.md');
          const description = options.description || 'No description';
          
          await this.doctor.createPage(title, content, { description });
          results.set(filePath, true);
        } catch (error) {
          console.error(`Failed to process ${filePath}: ${error}`);
          results.set(filePath, false);
        }
      }
      
      return results;
    } catch (error) {
      throw new Error(`Failed to process and publish content: ${error}`);
    }
  }
}
