import tocbot from 'tocbot';

// Initialize Tocbot
document.addEventListener("DOMContentLoaded", function () {
    tocbot.init({
        tocSelector: '#toc',
        contentSelector: 'body',
        headingSelector: 'h2, h3',
        scrollSmooth: true,
        scrollSmoothOffset: 200,  // Adjust for a smoother experience
        collapseDepth: 6,
    });
});

// Handle Scroll Effect for TOC
window.addEventListener('scroll', function () {
    var tocContainer = document.getElementById('toc-container');
    var scrollPosition = window.scrollY || window.pageYOffset;
    var carouselHeight = 650; // Set the height of your carousel or the offset point
    var stickyPosition = 150; // The position you want TOC to stick to

    if (scrollPosition > carouselHeight) {
        tocContainer.style.position = 'fixed';
        tocContainer.style.top = stickyPosition + 'px';
    } else {
        tocContainer.style.position = 'absolute';
        tocContainer.style.top = carouselHeight + stickyPosition + 'px'; // Original position below the carousel
    }
});