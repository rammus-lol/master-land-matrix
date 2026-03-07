import { marked } from 'marked';

// Documentation sections configuration
const documentationSections = [
    { id: 'introduction', file: '/documentation/00-introduction.md', title: 'Introduction' },
    { id: 'frontend', file: '/documentation/01-frontend.md', title: 'Frontend' },
    { id: 'backend', file: '/documentation/02-backend.md', title: 'Backend' },
    { id: 'crawler', file: '/documentation/03-crawler.md', title: 'Crawler' },
    { id: 'data', file: '/documentation/04-data.md', title: 'Data' },
    { id: 'deployment', file: '/documentation/05-deployment.md', title: 'Deployment' },
    { id: 'workflow', file: '/documentation/06-workflow.md', title: 'Workflow' }
];

// Cache for loaded content
const contentCache = new Map();

// Initialize documentation
async function initDocumentation() {
    createSidebar();
    await loadAllSections();
    showSection('introduction');
    setupMobileToggle();
}

// Create sidebar navigation
function createSidebar() {
    const sidebar = document.querySelector('.doc-sidebar');
    const nav = document.createElement('ul');
    nav.className = 'doc-nav';
    
    documentationSections.forEach(section => {
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
    
    sidebar.appendChild(nav);
}

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

// Check URL hash on load
window.addEventListener('load', () => {
    const hash = window.location.hash.substring(1);
    if (hash && contentCache.has(hash)) {
        showSection(hash);
    }
});

// Initialize when DOM is ready
initDocumentation();
