import { marked } from 'marked';

const preview = document.getElementById('preview');
const markdownFile = '/documentation.md';

async function loadMarkdown() {
    try {
        const response = await fetch(markdownFile);
        if (!response.ok) {
            throw new Error('File markdown missing or inaccessible');
        }

        const markdown = await response.text();
        preview.innerHTML = marked.parse(markdown);
    } catch (error) {
        preview.innerHTML = '<p>Failed to load documentation.</p>';
    }
}

loadMarkdown();