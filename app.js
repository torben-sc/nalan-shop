document.addEventListener('DOMContentLoaded', () => {
    // Initialisieren der Warenkorb-Anzeige
    updateCartCount();

    // Warenkorb-Popup Elemente und Event-Handler
    const cartIcon = document.getElementById('cart-icon');
    const cartPopup = document.getElementById('cart-popup');
    const closeCartButton = document.getElementById('close-cart');

    // Event listener to open cart popup
    if (cartIcon && cartPopup) {
        cartIcon.addEventListener('click', (e) => {
            e.preventDefault();
            cartPopup.classList.add('open');
        });
    }

    // Event listener to close cart popup
    if (closeCartButton && cartPopup) {
        closeCartButton.addEventListener('click', () => {
            cartPopup.classList.remove('open');
        });
    }

    // Kategorien-Event-Listener hinzufügen
    const categories = ['showAllFilter', 'bagsFilter', 'balaclavasFilter', 'scarvesFilter', 'accessoriesFilter'];
    const categoryUrls = {
        showAllFilter: '/shop',
        bagsFilter: '/bags',
        balaclavasFilter: '/balaclavas',
        scarvesFilter: '/scarves',
        accessoriesFilter: '/accessories',
    };

    categories.forEach(id => {
        const filterElement = document.getElementById(id);
        if (filterElement) {
            filterElement.addEventListener('click', (e) => {
                e.preventDefault();
                const newUrl = categoryUrls[id];
                window.location.href = newUrl; // Navigation zur neuen URL ohne ".html" oder "?category"
            });
        }
    });

    // URL-basierten Kategorie-Filter anwenden
    const currentPath = window.location.pathname;

    let category;
    let accs = null;
    switch (currentPath) {
        case '/bags':
            category = 'bags';
            break;
        case '/balaclavas':
            category = 'balaclavas';
            break;
        case '/scarves':
            category = 'scarves';
            break;
        case '/accessories':
            category = 'accessories';
            accs = new URLSearchParams(window.location.search).get('accessorie_type') || 'all';
            break;
        default:
            category = 'all';
    }
    

    // Initialisieren der Produktliste basierend auf der URL-Kategorie
    if (document.getElementById('product-container')) {
        displayProductList(category, null, accs);
    } else if (document.getElementById('product-detail-container')) {
        displayProductDetails();
    }

    // Warenkorb-Artikel anzeigen
    displayCartItems();

    // Initialisierung des Footers
    if (!document.getElementById('landing-container')) {
        createFooter();
    }

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
    if (currentPath.includes('/bags')) {
        const pathParts = currentPath.split('/');
        let size = 'all';
        if (pathParts.length > 2) {
            size = pathParts[2]; // Extrahiere die Größe aus der URL
        }
        displayProductList('bags', size);
    }

    // Größenfilter-Event-Listener hinzufügen
    const accessoriesLinks = document.querySelectorAll('.top-menu-wrapper-2 a');
    accessoriesLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const accs = e.target.getAttribute('data-accs');
            applyAccessoriesFilter(accs);
        });
    });

    // Größenfilter anwenden basierend auf der URL
    if (currentPath.includes('/accessories')) {
        const pathParts = currentPath.split('/');
        let accs = 'all';
        if (pathParts.length > 2) {
            accs = pathParts[2]; // Extrahiere die Größe aus der URL
        }
        displayProductList('accessories', accs);
    }
});

// Funktion zur Anwendung des Größenfilters und zum Aktualisieren der URL
function applySizeFilter(size) {
    displayProductList('bags', size);
    updateSizeFilterURL(size);
}

// Funktion zur Aktualisierung der URL ohne Seite neu zu laden
function updateSizeFilterURL(size) {
    const newUrl = size === 'all' ? '/bags' : `/bags/${size}`;
    window.history.pushState({}, '', newUrl);
}

// Funktion zur Anwendung des Accessoires-Filters
function applyAccessoriesFilter(accs) {
    displayProductList('accessories', null, accs);
    updateAccessoriesFilterURL(accs);
}

// URL aktualisieren, ohne die Seite neu zu laden
function updateAccessoriesFilterURL(accs) {
    const newUrl = accs === 'all' ? '/accessories' : `/accessories?accessorie_type=${accs}`;
    window.history.pushState({}, '', newUrl);
}

// Funktion zum Laden der Produkte aus einer JSON-Datei
async function fetchProducts() {
    try {
        const response = await fetch('/products.json'); // Geänderter Pfad für die JSON-Datei
        if (!response.ok) {
            throw new Error(`Fehler beim Laden der Produkte: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Fehler beim Laden der Produkte:", error);
    }
}

// Funktion zur Anzeige der Produktliste basierend auf der Kategorie und Größe
async function displayProductList(category = null, size = null, accs = null) {
    const products = await fetchProducts();
    if (!products) return;

    const productContainer = document.getElementById('product-container');
    const productTitle = document.getElementById('product-title');

    productContainer.innerHTML = '';

    let filteredProducts = (category && category !== 'all') 
        ? products.filter(product => product.category.toLowerCase() === category.toLowerCase()) 
        : products;

    if (size && size !== 'all') {
        filteredProducts = filteredProducts.filter(product => product.size && product.size.toLowerCase() === size.toLowerCase());
    }

    if (accs && accs !== 'all') {
        filteredProducts = filteredProducts.filter(product => product.accs && product.accs.toLowerCase() === accs.toLowerCase());
    }

    productTitle.innerHTML = (category && category !== 'all') 
        ? `${category.charAt(0).toUpperCase() + category.slice(1)}` 
        : 'All<span class="mobile-line-break"> </span>Products';

    filteredProducts.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <a href="/product/${product.id}" class="product-link">
                <img src="${product.images[0]}" alt="${product.name}">
                <h2>${product.name}</h2>
            </a>
            <p class="product-price-shop">
                <span class="price-amount-shop">${product.price}</span><span class="price-currency-shop"> €</span>
            </p>
        `;

        productContainer.appendChild(productCard);
    });
}

// Funktion zur Anzeige der Produktdetails
async function displayProductDetails() {
    const pathParts = window.location.pathname.split('/');
    const productId = pathParts[pathParts.length - 1]; // Extrahiere die ID vom Ende des Pfads

    const products = await fetchProducts();
    if (!products) return;

    const product = products.find(p => p.id === productId);
    if (!product) {
        document.getElementById('product-detail-container').innerHTML = `<p>Produkt nicht gefunden.</p>`;
        return;
    }

    // Rest des Codes zur Anzeige des Produkts
    createProductImages(product);
    displayProductInfo(product);
    addButtonsAndEventListeners(product);
}


// Hilfsfunktion zur Erstellung der Hauptbilder und Thumbnails
function createProductImages(product) {
    const mainImageContainer = document.querySelector('.product-main-image-container');
    const thumbnailsContainer = document.querySelector('.product-thumbnail-container');

    mainImageContainer.innerHTML = ''; // Vorherige Bilder entfernen
    thumbnailsContainer.innerHTML = ''; // Vorherige Thumbnails entfernen

    let currentIndex = 0;

    const imgElement = document.createElement('img');
    imgElement.src = product.images[currentIndex];
    imgElement.alt = product.name;
    imgElement.className = 'product-main-image';
    mainImageContainer.appendChild(imgElement);

    product.images.forEach((imageUrl, index) => {
        const thumbnail = document.createElement('img');
        thumbnail.src = imageUrl;
        thumbnail.alt = `${product.name} - Vorschau ${index + 1}`;
        thumbnail.className = 'product-thumbnail';
        if (index === currentIndex) thumbnail.classList.add('active');
        thumbnail.addEventListener('click', () => {
            currentIndex = index;
            updateImage(imgElement, currentIndex, product.images);
        });
        thumbnailsContainer.appendChild(thumbnail);
    });
}

// Hilfsfunktion zur Aktualisierung des Hauptbilds
function updateImage(imgElement, currentIndex, images) {
    imgElement.src = images[currentIndex];
    document.querySelectorAll('.product-thumbnail').forEach((thumb, index) => {
        thumb.classList.toggle('active', index === currentIndex);
    });
}

// Hilfsfunktion zur Anzeige der Produktinformationen
function displayProductInfo(product) {
    const infoContainer = document.querySelector('.product-info');
    infoContainer.innerHTML = `
        <a href="/shop" class="back-link">Back to Collection</a>
        <h1 class="product-title-details">${product.name}</h1>
        <p class="product-price">€${product.price.toFixed(2)}</p>
        <p class="product-description">${product.description}</p>
    `;

}

// Hilfsfunktion zur Erstellung der Buttons und deren Event-Listener
function addButtonsAndEventListeners(product) {
    const infoContainer = document.querySelector('.product-info');

    // Container für die Buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';

    // "Direct Checkout" Button hinzufügen
    const directCheckoutButton = document.createElement('button');
    directCheckoutButton.id = 'direct-checkout-button';
    directCheckoutButton.className = 'checkout-button';
    directCheckoutButton.textContent = 'Direct Checkout';
    buttonContainer.appendChild(directCheckoutButton);

    // "OR" Text hinzufügen
    const orElement = document.createElement('p');
    orElement.className = 'or-text';
    orElement.textContent = 'OR';
    buttonContainer.appendChild(orElement);

    // Add to Cart Button hinzufügen
    const addToCartButton = document.createElement('button');
    addToCartButton.className = 'add-to-cart-button';
    addToCartButton.textContent = 'Add to cart';
    buttonContainer.appendChild(addToCartButton);

    // Füge die Button-Gruppe zum infoContainer hinzu
    infoContainer.appendChild(buttonContainer);

    // Event-Listener für den Direct Checkout Button hinzufügen
    setupDirectCheckoutButton(directCheckoutButton, product);

    // Event-Listener für Add-to-Cart Button
    setupAddToCartButton(addToCartButton, product);
}

// Hilfsfunktion zur Einrichtung des Direct Checkout Buttons
async function setupDirectCheckoutButton(directCheckoutButton, product) {
    directCheckoutButton.addEventListener('click', () => {
        // Verwende window.location.href, um die Netlify Function aufzurufen, die den Redirect durchführt
        window.location.href = `/.netlify/functions/get-paypal-link?productId=${product.id}`;
    });
}

// Hilfsfunktion zur Einrichtung des Add-to-Cart Buttons
function setupAddToCartButton(addToCartButton, product) {
    addToCartButton.addEventListener('click', () => {
        addToCart(product);

        // Warenkorb-Fenster automatisch öffnen, nachdem das Produkt hinzugefügt wurde
        const cartPopup = document.getElementById('cart-popup');
        if (cartPopup) {
            cartPopup.classList.add('open');
        }
        displayCartItems(); // Warenkorb aktualisieren
    });
}


// Funktion zum Hinzufügen eines Produkts zum Warenkorb
function addToCart(product) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingProduct = cart.find(item => item.id === product.id);

    if (existingProduct) {
        if (existingProduct.quantity < product.stock) {
            existingProduct.quantity += 1;
        } else {
            alert("Maximum quantity reached!");
            return;
        }
    } else {
        if (product.stock > 0) {
            cart.push({ ...product, quantity: 1 });
        } else {
            alert("This product is not available anymore.");
            return;
        }
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();

    // Open cart after adding an item
    const cartPopup = document.getElementById('cart-popup');
    if (cartPopup) {
        cartPopup.classList.add('open');
    }
    displayCartItems(); // Update cart items in the popup
}

document.addEventListener('DOMContentLoaded', () => {
    // Initialisieren der Warenkorb-Anzeige
    updateCartCount();
    displayCartItems(); // Warenkorb-Artikel beim Start anzeigen

    // Warenkorb-Popup Elemente und Event-Handler
    const cartIcon = document.getElementById('cart-icon');
    const cartPopup = document.getElementById('cart-popup');
    const closeCartButton = document.getElementById('close-cart');

    // Event listener to open cart popup
    if (cartIcon && cartPopup) {
        cartIcon.addEventListener('click', (e) => {
            e.preventDefault();
            cartPopup.classList.add('open');
        });
    }

    // Event listener to close cart popup
    if (closeCartButton && cartPopup) {
        closeCartButton.addEventListener('click', () => {
            cartPopup.classList.remove('open');
        });
    }
});

// Funktion zur Anzeige der Warenkorb-Artikel im Slide-in Menü
function displayCartItems() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartItemsContainer = document.getElementById('cart-items');
    const totalAmountElement = document.getElementById('total-amount');
    const cartContactInfo = document.querySelector('.cart-contact-info'); // Container für die Kontaktinfo
    cartItemsContainer.innerHTML = ''; // Container leeren

    let totalAmount = 0;
    cart.forEach(item => {
        const price = parseFloat(item.price) || 0; // Preis als Zahl
        totalAmount += price * item.quantity;

        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';

        cartItem.innerHTML = `
            <img src="${item.images[0]}" alt="${item.name}" class="cart-item-image">
            <div class="cart-item-info">
                <a href="/product?id=${item.id}" class="cart-item-link">
                <h3>${item.name}</h3>
            </a>
            <p>Price: €${price.toFixed(2)}</p>
            <p>Quantity: ${item.quantity}</p>
        </div>
        <button class="remove-item-button" data-id="${item.id}">&times;</button>
    `;


        // Event-Listener für den Entfernen-Button
        cartItem.querySelector('.remove-item-button').addEventListener('click', () => {
            removeFromCart(item.id);
        });

        cartItemsContainer.appendChild(cartItem);
    });

    if (totalAmountElement) {
        totalAmountElement.textContent = `€${totalAmount.toFixed(2)}`;
    }

    // Anpassen der Kontaktinfo oder des PayPal Buttons
    if (cart.length === 1) {
        // Wenn nur ein Artikel im Warenkorb ist, füge den PayPal-Button hinzu
        const product = cart[0];
        cartContactInfo.innerHTML = ''; // Container leeren

        const paypalButton = document.createElement('button');
        paypalButton.id = 'paypal-button-cart';
        paypalButton.textContent = 'PROCEED TO CHECKOUT';
        paypalButton.className = 'checkout-button cart-paypal-button';
        
        // PayPal-Link für das Produkt setzen
        paypalButton.addEventListener('click', () => {
            // Verwende window.location.href, um die Netlify Function aufzurufen, die den Redirect durchführt
            window.location.href = `/.netlify/functions/get-paypal-link?productId=${product.id}`;
        });

        cartContactInfo.appendChild(paypalButton);
    } else {
        // Bei mehreren Artikeln im Warenkorb, zeige die Instagram-Kontaktinfo an
        cartContactInfo.innerHTML = `
            <p>For orders of multiple items, contact me on 
                <a href="https://www.instagram.com/nalancreations" target="_blank">Instagram</a>
            </p>
            <p class="checkout-note">OTHERWISE USE DIRECT CHECKOUT</p>
        `;
    }
}


// Funktion zum Entfernen eines Produkts aus dem Warenkorb
function removeFromCart(productId) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart = cart.filter(item => item.id !== productId);
    localStorage.setItem('cart', JSON.stringify(cart));
    displayCartItems(); // Warenkorb-Artikel aktualisieren
    updateCartCount(); // Zähler im Icon aktualisieren
}

// Funktion zum Aktualisieren des Warenkorb-Zählers
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    const cartCountElement = document.getElementById('cart-count');

    if (cartCountElement) {
        cartCountElement.innerText = cartCount;
    }
}


// Funktion zum Aktualisieren des Warenkorb-Zählers
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    const cartCountElement = document.getElementById('cart-count');
    
    if (cartCountElement) {
        cartCountElement.innerText = cartCount;
    }
}

// Funktion zum Erstellen des Footers
function createFooter() {
    const footer = document.createElement('footer');
    footer.className = 'custom-footer';
    footer.innerHTML = `
    <div class="social-icons-container">
        <a href="https://www.tiktok.com/@nalancreations?_t=8r3okcluwcL&_r=1" target="_blank" class="tiktok-link">
            <img src="/images/tiktok-logo.png" alt="TikTok Logo" class="social-icon tiktok-icon">
        </a>
        <a href="https://www.instagram.com/nalancreations" target="_blank">
            <img src="/images/insta-logo.png" alt="Instagram Logo" class="social-icon">
        </a>
    </div>
    <div class="footer-branding">&copy; 2024 NALANCREATIONS. ALL RIGHTS RESERVED.</div>
    <div class="legal-links">
        <a href="/imprint">Imprint</a>
        <a href="/privacy">Privacy Policy</a>
        <a href="/terms">Terms & Conditions</a>
        <a href="/cancellation">Right of Withdrawal</a>
    </div>
`;

    document.body.appendChild(footer);
}
