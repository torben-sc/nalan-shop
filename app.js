document.addEventListener('DOMContentLoaded', () => {
    // Initialisieren der Warenkorb-Anzeige
    updateCartCount();

    // Kategorien-Event-Listener hinzufügen
    const categories = ['showAllFilter', 'bagsFilter', 'balaclavasFilter', 'handWarmersFilter', 'otherAccessoriesFilter'];
    const categoryUrls = {
        showAllFilter: 'shop.html?category=all',
        bagsFilter: 'bags.html?category=bags',
        balaclavasFilter: 'balaclavas.html?category=balaclavas',
        handWarmersFilter: 'handwarmers.html?category=hand warmers',
        otherAccessoriesFilter: 'otheraccessories.html?category=other accessories',
    };

    categories.forEach(id => {
        const filterElement = document.getElementById(id);
        if (filterElement) {
            filterElement.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = categoryUrls[id];
            });
        }
    });

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

    // Produktliste und Details initialisieren
    if (document.getElementById('product-container')) {
        const urlParams = new URLSearchParams(window.location.search);
        const category = urlParams.get('category') || 'all';
        displayProductList(category);
    } else if (document.getElementById('product-detail-container')) {
        displayProductDetails();
    }

    // Initialisierung des Footers
    if (!document.getElementById('landing-container')) {
        createFooter();
    }
});

// Funktion zum Laden der Produkte aus einer JSON-Datei
async function fetchProducts() {
    try {
        const response = await fetch('products.json');
        if (!response.ok) {
            throw new Error(`Fehler beim Laden der Produkte: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Fehler beim Laden der Produkte:", error);
    }
}

// Funktion zur Anzeige der Produktliste basierend auf der Kategorie und Größe
async function displayProductList(category = null, size = null) {
    const urlParams = new URLSearchParams(window.location.search);
    category = category || urlParams.get('category') || 'all';
    size = size || urlParams.get('size') || 'all';

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

    productTitle.textContent = (category && category !== 'all') ? `${category.charAt(0).toUpperCase() + category.slice(1)}` : 'All Products';

    filteredProducts.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <a href="product.html?id=${product.id}" class="product-link">
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
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');

    const products = await fetchProducts();
    if (!products) return;

    const product = products.find(p => p.id === productId);
    if (!product) {
        document.getElementById('product-detail-container').innerHTML = `<p>Produkt nicht gefunden.</p>`;
        return;
    }

    const mainImageContainer = document.querySelector('.product-main-image-container');
    const thumbnailsContainer = document.querySelector('.product-thumbnail-container');

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
            updateImage();
        });
        thumbnailsContainer.appendChild(thumbnail);
    });

    function updateImage() {
        imgElement.src = product.images[currentIndex];
        document.querySelectorAll('.product-thumbnail').forEach((thumb, index) => {
            thumb.classList.toggle('active', index === currentIndex);
        });
    }

    const infoContainer = document.querySelector('.product-info');
    infoContainer.innerHTML = `
        <a href="shop.html" class="back-link">Back to Collection</a>
        <h1 class="product-title-details">${product.name}</h1>
        <p class="product-price">€${product.price.toFixed(2)}</p>
        <p class="product-description">${product.description}</p>
    `;

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';

    const directCheckoutButton = document.createElement('button');
    directCheckoutButton.id = 'direct-checkout-button';
    directCheckoutButton.className = 'checkout-button';
    directCheckoutButton.textContent = 'Direct Checkout';
    buttonContainer.appendChild(directCheckoutButton);

    const orElement = document.createElement('p');
    orElement.className = 'or-text';
    orElement.textContent = 'OR';
    buttonContainer.appendChild(orElement);

    const addToCartButton = document.createElement('button');
    addToCartButton.className = 'add-to-cart-button';
    addToCartButton.textContent = 'Add to cart';
    buttonContainer.appendChild(addToCartButton);

    infoContainer.appendChild(buttonContainer);

    addToCartButton.addEventListener('click', () => {
        addToCart(product);
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

// Funktion zum Anzeigen der Warenkorb-Artikel
function displayCartItems() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartItemsContainer = document.getElementById('cart-items');
    const totalAmountElement = document.getElementById('total-amount');

    cartItemsContainer.innerHTML = '';

    let totalAmount = 0;
    cart.forEach(item => {
        const price = parseFloat(item.price) || 0;
        totalAmount += price * item.quantity;

        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';

        cartItem.innerHTML = `
            <img src="${item.images[0]}" alt="${item.name}" class="cart-item-image">
            <div class="cart-item-info">
                <h3>${item.name}</h3>
                <p>€${price.toFixed(2)}</p>
                <p>Quantity: ${item.quantity}</p>
            </div>
            <button class="remove-item-icon" data-id="${item.id}">&times;</button>
        `;

        cartItem.querySelector('.remove-item-icon').addEventListener('click', () => {
            removeFromCart(item.id);
        });

        cartItemsContainer.appendChild(cartItem);
    });

    if (totalAmountElement) {
        totalAmountElement.textContent = `€${totalAmount.toFixed(2)}`;
    }
}


// Funktion zum Entfernen eines Produkts aus dem Warenkorb
function removeFromCart(productId) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart = cart.filter(item => item.id !== productId);
    localStorage.setItem('cart', JSON.stringify(cart));
    displayCartItems();
    updateCartCount();
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
                <img src="images/tiktok-logo.png" alt="TikTok Logo" class="social-icon tiktok-icon">
            </a>
            <a href="https://www.instagram.com/nalancreations" target="_blank">
                <img src="images/insta-logo.png" alt="Instagram Logo" class="social-icon">
            </a>
        </div>
        <div class="footer-branding">&copy; 2024 NALANCREATIONS. ALL RIGHTS RESERVED.</div>
        <div class="legal-links">
            <a href="imprint.html">Imprint</a>
            <a href="privacy.html">Privacy Policy</a>
            <a href="terms.html">Terms & Conditions</a>
            <a href="cancellation.html">Right of Withdrawal</a>
        </div>
    `;
    document.body.appendChild(footer);
}
