import { marked } from 'marked';

const preview = document.getElementById('preview');

// List of documentation files in order (INDEX first, then all sections)
const documentationFiles = [
    '/documentation/INDEX.md',
    '/documentation/00-introduction.md',
    '/documentation/01-frontend.md',
    '/documentation/02-backend.md',
    '/documentation/03-crawler.md',
    '/documentation/04-data.md',
    '/documentation/05-deployment.md',
    '/documentation/06-workflow.md'
];

async function loadMarkdownFile(filePath) {
    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`File not found: ${filePath}`);
        }
        return await response.text();
    } catch (error) {
        console.warn(`Failed to load ${filePath}:`, error);
        return `## ⚠️ Failed to load ${filePath}\n\n${error.message}`;
    }
}

async function loadAllDocumentation() {
    try {
        let combinedHtml = '';
        
        // Load and parse all markdown files
        for (const filePath of documentationFiles) {
            const markdown = await loadMarkdownFile(filePath);
            const html = marked.parse(markdown);
            combinedHtml += html + '<hr style="margin: 3em 0; border: none; border-top: 2px solid #ddd;" />';
        }
        
        // Remove the last separator
        combinedHtml = combinedHtml.replace(/<hr[^>]*>\s*$/, '');
        
        preview.innerHTML = combinedHtml;
    } catch (error) {
        preview.innerHTML = '<p>Failed to load documentation.</p>';
        console.error('Documentation loading error:', error);
    }
}

loadAllDocumentation();