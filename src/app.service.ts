import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AppService {
  getHello(): string {
    const filePath = path.resolve(process.cwd(), 'src', 'public', 'index.html');
    const env = process.env.NODE_ENV || 'production';

    try {
      let html = fs.readFileSync(filePath, 'utf-8');

      // Option 1: Inject into a known placeholder (e.g. {{ENV}})
      html = html.replace('{{ENV}}', env);

      // Option 2: Inject before </body> (if you didn't add a placeholder)
      // html = html.replace(
      //   '</body>',
      //   `<p>🌍 Environment: <strong>${env}</strong></p></body>`
      // );

      return html;
    } catch {
      return `<h1>Error loading page</h1>`;
    }
  }
}
