// Structural Pulse Content Store
const articles = [
    {
        title: "Analyzing Historical Masonry Viaducts: Balancing Heritage and Modern Demands",
        type: "Case Study",
        author: "Bruno Pompei",
        date: "Aug 2026",
        slug: "analyzing-historical-masonry-viaducts.html",
        subjects: ["Rail Infrastructure", "FEM/FEA", "Masonry"],
        excerpt: "Quantifying structural safety and residual capacity in century-old masonry bridges through non-linear smeared crack finite element analysis."
    },
    {
        title: "Why Do Bridges Fail? A Look at the Data",
        type: "Analysis",
        author: "Bruno Pompei",
        date: "Aug 2026",
        slug: "why-do-bridges-fail.html",
        subjects: ["Bridges", "Structural Assessment", "Construction"],
        excerpt: "Global bridge failure data reveals key failure drivers—with construction errors, hydraulic issues, and natural disasters accounting for nearly 70% combined."
    },
    {
        title: "Why Do We Overcomplicate Structural FEM Models?",
        type: "Pulse",
        author: "Bruno Pompei",
        date: "Aug 2026",
        slug: "#",
        subjects: ["FEM/FEA", "Engineering Methods"],
        excerpt: "A quick observation on balancing model complexity with practical engineering judgment and verification."
    },
    {
        title: "Step-by-Step Euler Buckling Verification Workflow",
        type: "Tutorial",
        author: "Bruno Pompei",
        date: "Jul 2026",
        slug: "#",
        subjects: ["Structural Design", "Numerical Analysis"],
        excerpt: "How to set up boundary conditions and verify column stability using analytical formulas alongside FEA solvers."
    }
];

// DOM Elements
const contentContainer = document.getElementById('content');
const filterButtons = document.querySelectorAll('.filter-btn');

// Function to Render Articles to the DOM
function renderArticles(filterType = 'All') {
    contentContainer.innerHTML = ''; // Clear hardcoded card from HTML

    const filtered = filterType === 'All' 
        ? articles 
        : articles.filter(article => article.type === filterType);

    filtered.forEach(article => {
        const cardHTML = `
            <article class="card">
                <span class="badge">${article.type}</span>
                <h2><a href="${article.slug || '#'}" style="text-decoration:none; color:inherit;">${article.title}</a></h2>
                <p class="metadata">Author: ${article.author} | Published: ${article.date}</p>
                <p class="tags">${article.subjects.join(' · ')}</p>
                <p class="excerpt">${article.excerpt}</p>
            </article>
        `;
        contentContainer.insertAdjacentHTML('beforeend', cardHTML);
    });
}

// Event Listeners for Filter Buttons
filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        const selectedCategory = button.textContent.trim();
        renderArticles(selectedCategory);
    });
});

// Initial Render on Page Load
renderArticles();
// --- HERO VIDEO SCROLL INTERACTION ---
const heroBanner = document.getElementById('heroBanner');
const heroVideo = document.getElementById('heroVideo');

if (heroBanner && heroVideo) {
    window.addEventListener('scroll', () => {
        // Detect if user has scrolled down more than 50px
        if (window.scrollY > 50) {
            if (!heroBanner.classList.contains('scrolled')) {
                heroBanner.classList.add('scrolled');
                heroVideo.pause(); // Pause video to save CPU/GPU resources
            }
        } else {
            if (heroBanner.classList.contains('scrolled')) {
                heroBanner.classList.remove('scrolled');
                heroVideo.play(); // Resume video when back at top
            }
        }
    });
}