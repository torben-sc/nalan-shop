// Funktion zur Anwendung von Filtern basierend auf Kategorie und Größe
export function applyFilters() {
    const categories = ['showAllFilter', 'bagsFilter', 'balaclavasFilter', 'handWarmersFilter', 'otherAccessoriesFilter'];
    const categoryUrls = {
        showAllFilter: '/shop',
        bagsFilter: '/bags',
        balaclavasFilter: '/balaclavas',
        handWarmersFilter: '/handwarmers',
        otherAccessoriesFilter: '/otheraccessories',
    };

    categories.forEach(id => {
        const filterElement = document.getElementById(id);
        if (filterElement) {
            filterElement.addEventListener('click', (e) => {
                e.preventDefault();
                const newUrl = categoryUrls[id];
                window.location.href = newUrl;
            });
        }
    });

    // Größenfilter-Event-Listener hinzufügen
    const sizeFilterLinks = document.querySelectorAll('.top-menu-wrapper-2 a');
    sizeFilterLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const size = e.target.getAttribute('data-size');
            applySizeFilter(size);
        });
    });

    // Größenfilter anwenden basierend auf der URL
    const currentPath = window.location.pathname;
    if (currentPath.includes('/bags')) {
        const pathParts = currentPath.split('/');
        let size = 'all';
        if (pathParts.length > 2) {
            size = pathParts[2];
        }
        displayProductList('bags', size);
    }
}

// Funktion zur Anwendung des Größenfilters
export function applySizeFilter(size) {
    displayProductList('bags', size);
    updateSizeFilterURL(size);
}

// Funktion zur Aktualisierung der URL ohne Neuladen
function updateSizeFilterURL(size) {
    const newUrl = size === 'all' ? '/bags' : `/bags/${size}`;
    window.history.pushState({}, '', newUrl);
}
