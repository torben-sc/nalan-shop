import { createFooter } from './footer.js';
import { updateCartCount } from './cart/cart.js';
import { displayProductList } from './products/productList.js';
import { displayProductDetails } from './products/productDetails.js';

document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();

    const currentPath = window.location.pathname;

    if (!document.getElementById('landing-container')) {
        createFooter();
    }

    if (document.getElementById('product-container')) {
        displayProductList(getCategoryFromPath(currentPath));
    } else if (document.getElementById('product-detail-container')) {
        displayProductDetails();
    }
    
});

function getCategoryFromPath(path) {
    switch (path) {
        case '/bags': return 'bags';
        case '/balaclavas': return 'balaclavas';
        case '/handwarmers': return 'hand warmers';
        case '/otheraccessories': return 'other accessories';
        default: return 'all';
    }
}
