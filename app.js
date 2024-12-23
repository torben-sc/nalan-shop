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

    // Initialisierung des Footers
    if (!document.getElementById('landing-container')) {
        createFooter();
    }

    // Größenfilter-Event-Listener hinzufügen (nur für Bags-Seite)
    if (currentPath.includes('/bags')) {
        const sizeFilterLinks = document.querySelectorAll('.top-menu-wrapper-2 a');
        sizeFilterLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const size = e.target.getAttribute('data-size');
                applySizeFilter(size);
            });
        });

        // Größe aus der URL extrahieren und Produktliste aktualisieren
        const urlParams = new URLSearchParams(window.location.search);
        const size = urlParams.get('size') || 'all';
        displayProductList('bags', size);
    }

    // Accessoires-Filter-Event-Listener hinzufügen (nur für Accessories-Seite)
    if (currentPath.includes('/accessories')) {
        const accessoriesLinks = document.querySelectorAll('.top-menu-wrapper-2 a');
        accessoriesLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const accs = e.target.getAttribute('data-accs');
                applyAccessoriesFilter(accs);
            });
        });

        // Accessoires-Filter aus der URL extrahieren und Produktliste aktualisieren
        const urlParams = new URLSearchParams(window.location.search);
        const accs = urlParams.get('accessorie_type') || 'all';
        if (window.location.pathname.includes('/accessories')) {
            displayProductList('accessories', null, accessoryType);
        }
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
        const response = await fetch('/.netlify/functions/get-products'); // Pfad zur Netlify Function
        if (!response.ok) {
            throw new Error(`Error loading products: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

// Funktion zur Anzeige der Produktliste basierend auf der Kategorie und Größe
async function displayProductList(category = null, size = null, accs = null) {
    const productContainer = document.getElementById('product-container');
    productContainer.innerHTML = ''; // Bestehende Produkte entfernen
    const productTitle = document.getElementById('product-title');

    // Titel sofort setzen basierend auf der Kategorie
    productTitle.innerHTML = (category && category !== 'all') 
        ? `${category.charAt(0).toUpperCase() + category.slice(1)}` 
        : 'All<span class="mobile-line-break"> </span>Products';

    // Produkte laden und filtern
    const products = await fetchProducts();
    if (!products) return;

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

    filteredProducts.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <a href="/product/${product.id}" class="product-link">
                <img src="${product.images[0]}" alt="${product.name}">
                <h2>${product.name}</h2>
            </a>
            <p class="product-price-shop">
                ${
                    product.stock > 0 
                    ? `<span class="price-amount-shop">${product.price}</span><span class="price-currency-shop"> €</span>` 
                    : `<span class="sold-out-text">SOLD OUT</span>`
                }
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
        <div class="only-germany-noti">
                      Currently only shipping to Germany. For international requests, contact me on
                      <a href="https://www.instagram.com/nalancreations" target="_blank" style="color: #E55013; text-decoration: none;">Instagram</a>
                      or
                      <a href="mailto:nalancreations@gmx.de" style="color: #E55013; text-decoration: none;">Email</a>.
                  </div>
    `;

}

// Hilfsfunktion zur Erstellung der Buttons und deren Event-Listener
function addButtonsAndEventListeners(product) {
    const infoContainer = document.querySelector('.product-info');

    // Container für die Buttons oder den Sold-Out Text
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';

    if (product.stock > 0) {
        // Add to Cart Button hinzufügen
        const addToCartButton = document.createElement('button');
        addToCartButton.className = 'add-to-cart-button';
        addToCartButton.textContent = 'Add to cart';
        buttonContainer.appendChild(addToCartButton);

        // Event-Listener für Add-to-Cart Button
        setupAddToCartButton(addToCartButton, product);
    } else {
        // Sold-Out Text mit Links erstellen
        const soldOutText = document.createElement('p');
        soldOutText.className = 'sold-out-text-2';
        soldOutText.innerHTML = `
    <div style="text-align: center; margin-bottom: 10px;">
        <strong>SOLD OUT</strong> <br>
        REQUESTS POSSIBLE ON 
        <a href="https://www.instagram.com/nalancreations" target="_blank" class="sold-out-link">INSTAGRAM</a> 
        OR 
        <a href="mailto:nalancreations@gmx.de" class="sold-out-link">EMAIL</a>
    </div>
`;

        buttonContainer.appendChild(soldOutText);
    }

    // Füge die Button-Gruppe oder den Sold-Out Text zum infoContainer hinzu
    infoContainer.appendChild(buttonContainer);
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
    if (!product || !product.id || typeof product.stock !== 'number' || typeof product.price !== 'number') {
        console.error('Invalid product data:', product);
        return;
    }

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
            cart.push({
                id: product.id,
                name: product.name,
                images: product.images,
                price: product.price,
                stock: product.stock,
                quantity: 1,
            });
        } else {
            alert("This product is not available anymore.");
            return;
        }
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    displayCartItems(); // Update items and PayPal button
}


document.addEventListener('DOMContentLoaded', () => {
    // Initialisieren der Warenkorb-Anzeige
    updateCartCount();
    loadPayPalSdk();
    displayCartItems();

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
async function displayCartItems() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartItemsContainer = document.getElementById('cart-items');
    const totalAmountElement = document.getElementById('total-amount');
    const shippingAmountElement = document.getElementById('shipping-amount');
    const paypalButtonContainer = document.getElementById('paypal-button-container');
    const emptyCartMessage = document.getElementById('empty-cart-message');

    // Clear existing content
    cartItemsContainer.innerHTML = '';
    paypalButtonContainer.innerHTML = ''; // Verhindert doppelte Buttons
    if (emptyCartMessage) emptyCartMessage.style.display = 'none';

    let totalAmount = 0;
    let shippingCost = 4.50; // Standardversandkosten

    cart.forEach(item => {
        const price = parseFloat(item.price) || 0;
        totalAmount += price * item.quantity;

        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
        <a href="/product/${item.id}" class="cart-item-link">
            <img src="${item.images[0]}" alt="${item.name}" class="cart-item-image">
            </a>
            <div class="cart-item-info">
                <a href="/product/${item.id}" class="cart-item-link">
                    <h3>${item.name}</h3>
                </a>
                <p>Price: €${price.toFixed(2)}</p>
                <p>Quantity: ${item.quantity}</p>
            </div>
            <button class="remove-item-button" data-id="${item.id}">&times;</button>
        `;

        // Event listener for removing items
        cartItem.querySelector('.remove-item-button').addEventListener('click', () => {
            removeFromCart(item.id);
        });

        cartItemsContainer.appendChild(cartItem);
    });

    // Check if shipping is free
    if (totalAmount >= 150 || totalAmount == 0) {
        shippingCost = 0;
        if (shippingAmountElement) {
            shippingAmountElement.textContent = '€0.00';
        }
    } else {
        if (shippingAmountElement) {
            shippingAmountElement.textContent = `€${shippingCost.toFixed(2)}`;
        }
    }
    

    totalAmount += shippingCost; // Add shipping cost to total amount

    // Update total amount display
    if (totalAmountElement) {
        totalAmountElement.textContent = `€${totalAmount.toFixed(2)}`;
    }

    if (cart.length === 0) {
        // Show empty cart message
        if (emptyCartMessage) emptyCartMessage.style.display = 'block';
    } else {
        // Load PayPal buttons only when SDK is loaded
        loadPayPalSdk(() => {
            paypalButtonContainer.innerHTML = ''; // Remove existing buttons
            paypal.Buttons({
                style: {
                    layout: 'vertical',
                    color: 'blue',
                    shape: 'rect',
                    label: 'checkout',
                },
                createOrder: async () => {
                    const orderID = await createPayPalOrder(cart.map(item => ({ id: item.id, quantity: item.quantity })));
                    return orderID;
                },
                onApprove: async (data, actions) => {
                    try {
                        const captureResult = await capturePayPalOrder(data.orderID);
                        const orderID = captureResult.id;
                        const purchasedProducts = captureResult.purchase_units[0].items;

                        const productsParam = encodeURIComponent(JSON.stringify(purchasedProducts));
                        window.location.href = `/thank-you.html`;
                    } catch (error) {
                        console.error('Error capturing PayPal order:', error);
                        alert('An error occurred while finalizing your payment.');
                    }
                },
                onError: (err) => {
                    console.error('PayPal Checkout Error:', err);
                    alert('An error occurred during the checkout process.');
                }
            }).render('#paypal-button-container');
        });
    }
}

async function loadPayPalSdk(callback) {
    try {
        const response = await fetch('/.netlify/functions/get-paypal-client-id');
        const { clientId } = await response.json();

        if (!clientId) {
            throw new Error('Client ID not found');
        }

        const existingScript = document.querySelector('script[src*="paypal.com/sdk/js"]');
        if (!existingScript) {
            const script = document.createElement('script');
            script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=EUR`;
            script.onload = () => {
                if (typeof callback === 'function') callback();
            };
            document.head.appendChild(script);
        } else if (typeof callback === 'function') {
            callback();
        }
    } catch (error) {
        console.error('Failed to load PayPal SDK:', error);
    }
}

// Lade PayPal SDK beim Laden der Seite
document.addEventListener('DOMContentLoaded', loadPayPalSdk);


// Bestellung erstellen
async function createPayPalOrder(cartItems) {
    try {
        const response = await fetch('/.netlify/functions/create-paypal-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'create', cartItems }),
        });

        if (!response.ok) {
            throw new Error('Failed to create PayPal order');
        }

        const data = await response.json();
        return data.orderID; // PayPal-Bestell-ID zurückgeben
    } catch (error) {
        console.error('Error creating PayPal order:', error);
        alert('An error occurred while creating the order. Please try again.');
        throw error;
    }
}

// Bestellung erfassen
async function capturePayPalOrder(orderID) {
    try {
        const response = await fetch('/.netlify/functions/create-paypal-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'capture', orderID }),
        });

        if (!response.ok) {
            throw new Error('Failed to capture PayPal order');
        }

        const data = await response.json();
        return data; // Rückgabe der Bestätigungsdaten
    } catch (error) {
        console.error('Error capturing PayPal order:', error);
        alert('An error occurred while capturing the order. Please try again.');
        throw error;
    }
}

// Funktion zum Entfernen eines Produkts aus dem Warenkorb
function removeFromCart(productId) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart = cart.filter(item => item.id !== productId);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount(); // Zähler im Icon aktualisieren
    displayCartItems(); // Warenkorb-Artikel aktualisieren
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
            <img src="/images/pngwing.com.png" alt="TikTok Logo" class="social-icon tiktok-icon">
        </a>
        <a href="https://www.instagram.com/nalancreations" target="_blank">
            <img src="/images/vecteezy_instagram-logo-png-instagram-logo-transparent-png_23986885.png" alt="Instagram Logo" class="social-icon">
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