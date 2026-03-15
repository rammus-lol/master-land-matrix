import { marked } from 'marked';
import markedKatex from 'marked-katex-extension'; // Vous aurez besoin de ce package

// Documentation sections configuration, grouped by documentation part
const documentationGroups = [
    {
        title: 'User Section',
        sections: [
            {id: 'drawing', file: '/documentation/user_section/drawing.md', title : 'Drawing Tool'},
            {id: 'uploading', file: '/documentation/user_section/uploading.md', title : 'Uploading File'},
            {id: 'buffer', file: '/documentation/user_section/buffer.md', title : 'Create a buffer'},
            {id: 'spatial_query', file: '/documentation/user_section/spatial_query.md', title : 'Extract Land Matrix Data'},
            {id: 'download', file: '/documentation/user_section/download.md', title : 'Download a file'},
        ]
    },
    {
        title: 'Methodology Part',
        sections: [
            { id: 'introduction', file: '/documentation/introduction.md', title: 'Introduction' },
            { id: 'technical-methodology', file: '/documentation/methodology/technical-pipeline.md', title: 'Technical Methodology' },
            { id: 'methodological-workflow', file: '/documentation/methodology/methodological-workflow.md', title: 'Methodological Workflow' }
        ]
    },
    {
        title: 'Architecture Part',
        sections: [
            { id: 'frontend', file: '/documentation/architecture/01-frontend.md', title: 'Frontend' },
            { id: 'backend', file: '/documentation/architecture/02-backend.md', title: 'Backend' },
            { id: 'crawler', file: '/documentation/architecture/03-crawler.md', title: 'Crawler' },
            { id: 'data', file: '/documentation/architecture/04-data.md', title: 'Data' },
            { id: 'deployment', file: '/documentation/architecture/05-deployment.md', title: 'Deployment' },
            { id: 'workflow', file: '/documentation/architecture/06-workflow.md', title: 'Workflow' }
        ]
    }
];

const documentationSections = documentationGroups.flatMap(group => group.sections);

// Cache for loaded content
const contentCache = new Map();

// Initialize documentation
async function initDocumentation() {
    createSidebar();
    await loadAllSections();
    const hash = window.location.hash.substring(1);
    const defaultSection = hash && contentCache.has(hash)
        ? hash
        : documentationSections[0]?.id;

    if (defaultSection) {
        showSection(defaultSection);
    }
    setupMobileToggle();
}

// Create sidebar navigation
function createSidebar() {
    const sidebar = document.querySelector('.doc-sidebar');
    const navWrapper = document.createElement('div');
    navWrapper.className = 'doc-nav-wrapper';

    documentationGroups.forEach(group => {
        const groupContainer = document.createElement('section');
        groupContainer.className = 'doc-nav-group';

        const groupTitle = document.createElement('h3');
        groupTitle.className = 'doc-nav-group-title';
        groupTitle.textContent = group.title;

        const nav = document.createElement('ul');
        nav.className = 'doc-nav';

        group.sections.forEach(section => {
            const li = document.createElement('li');
            li.className = 'doc-nav-item';

            const link = document.createElement('a');
            link.href = `#${section.id}`;
            link.className = 'doc-nav-link';
            link.textContent = section.title;
            link.dataset.section = section.id;

            link.addEventListener('click', (e) => {
                e.preventDefault();
                showSection(section.id);
                closeMobileSidebar();
            });

            li.appendChild(link);
            nav.appendChild(li);
        });

        groupContainer.appendChild(groupTitle);
        groupContainer.appendChild(nav);
        navWrapper.appendChild(groupContainer);
    });

    sidebar.appendChild(navWrapper);
}

// Configuration de l'extension
const options = {
    throwOnError: false,
    displayMode: true // Pour le rendu en bloc avec $$
};

marked.use(markedKatex(options));

// Load all markdown sections
async function loadAllSections() {
    const preview = document.getElementById('preview');
    
    for (const section of documentationSections) {
        try {
            const response = await fetch(section.file);
            if (!response.ok) {
                console.warn(`Could not load ${section.file}`);
                continue;
            }
            
            const markdown = await response.text();
            const html = marked.parse(markdown);
            
            // Cache the content
            contentCache.set(section.id, html);
            
            // Create section container
            const sectionDiv = document.createElement('div');
            sectionDiv.className = 'doc-section';
            sectionDiv.id = `section-${section.id}`;
            sectionDiv.innerHTML = html;
            
            preview.appendChild(sectionDiv);
            
        } catch (error) {
            console.error(`Error loading ${section.file}:`, error);
        }
    }
    
    if (contentCache.size === 0) {
        preview.innerHTML = '<p>Failed to load documentation.</p>';
    }
}

// Show specific section
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.doc-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    const targetSection = document.getElementById(`section-${sectionId}`);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Update navigation active state
    document.querySelectorAll('.doc-nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.section === sectionId) {
            link.classList.add('active');
        }
    });
    
    // Update URL hash
    window.location.hash = sectionId;
    
    // Scroll to top of content area
    const docMain = document.querySelector('.doc-main');
    if (docMain) {
        docMain.scrollTo({ top: 0, behavior: 'smooth' });
    }
    // Also scroll window to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Mobile sidebar toggle
function setupMobileToggle() {
    const toggleBtn = document.querySelector('.doc-sidebar-toggle');
    const sidebar = document.querySelector('.doc-sidebar');
    
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('mobile-open');
        });
    }
}

function closeMobileSidebar() {
    const sidebar = document.querySelector('.doc-sidebar');
    sidebar.classList.remove('mobile-open');
}

// Initialize when DOM is ready
initDocumentation();