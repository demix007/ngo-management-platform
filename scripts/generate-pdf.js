/**
 * Generate PDF from CLIENT_PRESENTATION.md
 * 
 * This script converts the markdown file to a beautifully formatted PDF
 * 
 * Prerequisites:
 *   npm install markdown-pdf
 * 
 * Usage:
 *   node scripts/generate-pdf.js
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check if markdown-pdf is available
let markdownPdf;
try {
  markdownPdf = (await import('markdown-pdf')).default;
} catch (error) {
  console.error('❌ markdown-pdf not found. Installing...');
  try {
    execSync('npm install markdown-pdf --save-dev', { stdio: 'inherit' });
    markdownPdf = (await import('markdown-pdf')).default;
  } catch (installError) {
    console.error('❌ Failed to install markdown-pdf');
    console.log('\n💡 Alternative: Use an online converter or browser print to PDF');
    console.log('   1. Open CLIENT_PRESENTATION.html in a browser');
    console.log('   2. Press Ctrl+P (or Cmd+P on Mac)');
    console.log('   3. Select "Save as PDF"');
    process.exit(1);
  }
}

const markdownPath = join(__dirname, '..', 'CLIENT_PRESENTATION.md');
const outputPath = join(__dirname, '..', 'CLIENT_PRESENTATION.pdf');

// PDF options
const pdfOptions = {
  paperFormat: 'A4',
  paperOrientation: 'portrait',
  paperBorder: '2cm',
  renderDelay: 1000,
  cssPath: join(__dirname, 'pdf-styles.css'),
  highlightCssPath: join(__dirname, 'pdf-highlight.css'),
};

// Custom CSS for better PDF formatting
const customCSS = `
  @page {
    margin: 2cm;
  }
  
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6;
    color: #333;
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
  }
  
  h1 {
    color: #1a73e8;
    border-bottom: 3px solid #1a73e8;
    padding-bottom: 10px;
    margin-top: 30px;
    page-break-after: avoid;
  }
  
  h2 {
    color: #34a853;
    border-bottom: 2px solid #34a853;
    padding-bottom: 8px;
    margin-top: 25px;
    page-break-after: avoid;
  }
  
  h3 {
    color: #ea4335;
    margin-top: 20px;
    page-break-after: avoid;
  }
  
  h4 {
    color: #fbbc04;
    margin-top: 15px;
  }
  
  code {
    background-color: #f5f5f5;
    padding: 2px 6px;
    border-radius: 3px;
    font-family: 'Courier New', monospace;
    font-size: 0.9em;
  }
  
  pre {
    background-color: #f5f5f5;
    padding: 15px;
    border-radius: 5px;
    overflow-x: auto;
    page-break-inside: avoid;
  }
  
  ul, ol {
    margin-left: 20px;
    margin-bottom: 15px;
  }
  
  li {
    margin-bottom: 8px;
  }
  
  strong {
    color: #1a73e8;
  }
  
  hr {
    border: none;
    border-top: 2px solid #e0e0e0;
    margin: 30px 0;
  }
  
  blockquote {
    border-left: 4px solid #1a73e8;
    padding-left: 15px;
    margin-left: 0;
    color: #666;
    font-style: italic;
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
    page-break-inside: avoid;
  }
  
  th, td {
    border: 1px solid #ddd;
    padding: 12px;
    text-align: left;
  }
  
  th {
    background-color: #1a73e8;
    color: white;
  }
  
  .page-break {
    page-break-before: always;
  }
`;

// Write CSS file
const cssPath = join(__dirname, 'pdf-styles.css');
writeFileSync(cssPath, customCSS);

console.log('📄 Converting CLIENT_PRESENTATION.md to PDF...\n');

try {
  const markdown = readFileSync(markdownPath, 'utf8');
  
  markdownPdf()
    .from.string(markdown)
    .to(outputPath, () => {
      console.log('✅ PDF generated successfully!');
      console.log(`📁 Location: ${outputPath}`);
      console.log('\n💡 You can now share this PDF with your client.');
    });
    
} catch (error) {
  console.error('❌ Error generating PDF:', error.message);
  console.log('\n💡 Alternative: Use browser print to PDF');
  console.log('   1. Open CLIENT_PRESENTATION.html in a browser');
  console.log('   2. Press Ctrl+P (or Cmd+P on Mac)');
  console.log('   3. Select "Save as PDF"');
  process.exit(1);
}





