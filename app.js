// Funktion zum Laden der Produkte aus der JSON-Datei
async function fetchProducts() {
    try {
        const response = await fetch('products.json');
        if (!response.ok) {
            throw new Error(`Fehler beim Laden der Produkte: ${response.statusText}`);
        }
        const products = await response.json();
        return products;
    } catch (error) {
        console.error("Fehler beim Laden der Produkte:", error);
    }
}

// Funktion zur Anzeige der Produktliste auf der Shop-Seite
async function displayProductList(category = null) {
    const products = await fetchProducts(); // Warten, bis die Produkte geladen sind
    if (!products) return; // Abbruch, falls Produkte nicht geladen werden konnten

    const productContainer = document.getElementById('product-container');
    productContainer.innerHTML = ''; // Leert den Container, um Produkte zu aktualisieren

    // Filtere nach Kategorie, falls angegeben
    const filteredProducts = category ? products.filter(product => product.category.toLowerCase() === category.toLowerCase()) : products;

    // Produkte anzeigen
    filteredProducts.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';

        const firstImage = product.images[0];

        productCard.innerHTML = `
            <a href="product.html?id=${product.id}" class="product-link">
                <img src="${firstImage}" alt="${product.name}">
                <h2>${product.name}</h2>
            </a>
            <p class=".product-price-shop">
            <span class="price-amount-shop">${product.price}</span><span class="price-currency-shop"> €</span>
            </p>
        `;

        productContainer.appendChild(productCard);
    });
}




// Funktion zur Anzeige der Produktdetails auf der Produktseite
async function displayProductDetails() {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');

    const products = await fetchProducts();
    if (!products) return;

    const product = products.find(p => p.id === productId);
    const productDetailContainer = document.getElementById('product-detail-container');

    if (product) {
        let currentIndex = 0;

        // Erstelle Slider-Elemente
        const imageContainer = document.querySelector('.product-detail-images');
        const imgElement = document.createElement('img');
        imgElement.src = product.images[currentIndex];
        imgElement.alt = product.name;
        imgElement.className = 'product-image';
        imageContainer.appendChild(imgElement);

        // Thumbnail-Vorschaubilder unter dem Hauptbild hinzufügen
        const thumbnailsContainer = document.createElement('div');
        thumbnailsContainer.className = 'thumbnails-container';
        product.images.forEach((imageUrl, index) => {
            const thumbnail = document.createElement('img');
            thumbnail.src = imageUrl;
            thumbnail.alt = `${product.name} - Vorschau ${index + 1}`;
            thumbnail.className = 'thumbnail';
            if (index === currentIndex) thumbnail.classList.add('active');
            thumbnail.addEventListener('click', () => {
                currentIndex = index;
                updateImage();
            });
            thumbnailsContainer.appendChild(thumbnail);
        });
        imageContainer.appendChild(thumbnailsContainer);

        // Funktion zum Aktualisieren des Bildes und der aktiven Thumbnail-Klasse
        function updateImage() {
            imgElement.src = product.images[currentIndex];
            document.querySelectorAll('.thumbnail').forEach((thumb, index) => {
                thumb.classList.toggle('active', index === currentIndex);
            });
        }
        
        // Swipe-Gesten für mobile Geräte
        let startX = 0;
        let endX = 0;
        imgElement.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
        });
        imgElement.addEventListener('touchend', (e) => {
            endX = e.changedTouches[0].clientX;
            handleSwipe();
        });

        function handleSwipe() {
            if (endX < startX) {
                currentIndex = (currentIndex + 1) % product.images.length;
            } else if (endX > startX) {
                currentIndex = (currentIndex - 1 + product.images.length) % product.images.length;
            }
            updateImage();
        }

        // Produktinformationen hinzufügen und Buttons für den Warenkorb und PayPal einfügen
        const infoContainer = document.querySelector('.product-detail-info');
        infoContainer.innerHTML = `
            <h1 class="product-title">${product.name}</h1>
            <p class="product-description">${product.description}</p>
            <p class="product-price">
                <span class="price-amount">${product.price}</span><span class="price-currency"> €</span>
            </p>
        `;

        // PayPal Button hinzufügen
        const paypalButton = document.createElement('button');
        paypalButton.id = 'paypal-button';
        paypalButton.textContent = 'Direct Checkout';
        paypalButton.className = 'paypal-button';
        infoContainer.appendChild(paypalButton);

        // "or"-Element hinzufügen
        const orElement = document.createElement('span');
        orElement.className = 'or-text';
        orElement.textContent = 'OR';
        infoContainer.appendChild(orElement);

        // Add to Cart Button hinzufügen
        const addToCartButton = document.createElement('button');
        addToCartButton.id = 'add-to-cart-button';
        addToCartButton.innerHTML = `<img src="images/add_shopping_cart_24dp_E8EAED_FILL0_wght400_GRAD0_opsz24.png" alt="Zum Warenkorb hinzufügen">`;
        infoContainer.appendChild(addToCartButton);

        // Lade den PayPal-Link und füge ihn dem Button hinzu
        try {
            const response = await fetch('/.netlify/functions/get-paypal-link');
            if (!response.ok) {
                throw new Error(`Fehler beim Laden des PayPal-Links: ${response.statusText}`);
            }
            const data = await response.json();
            paypalButton.addEventListener('click', () => {
                window.open(data.link, '_blank');
            });
        } catch (error) {
            console.error('Fehler beim Abrufen des PayPal-Links:', error);
            paypalButton.disabled = true; // Deaktiviere den Button, wenn der Link nicht geladen werden kann
            paypalButton.textContent = 'DIRECT CHECKOUT';
        }

        // Event-Listener für den Warenkorb-Button
        addToCartButton.addEventListener('click', () => addToCart(product));
    } else {
        productDetailContainer.innerHTML = `<p>Produkt nicht gefunden.</p>`;
    }
}


// Funktion zum Aktualisieren des Warenkorb-Zählers
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartCount = cart.reduce((total, item) => total + item.quantity, 0); // Summiert die Mengen
    const cartCountElement = document.getElementById('cart-count');
    
    if (cartCountElement) {
        cartCountElement.innerText = cartCount;
    }
}

function showModal(message) {
    const modal = document.getElementById('modal');
    const modalMessage = document.getElementById('modal-message');
    modalMessage.textContent = message;
    modal.style.display = 'block';

    // Schließen des Modals nach 3 Sekunden oder beim Klicken auf das Schließen-Icon
    setTimeout(() => { modal.style.display = 'none'; }, 3000);
    document.getElementById('close-modal').onclick = () => {
        modal.style.display = 'none';
    };
}

function addToCart(product) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingProduct = cart.find(item => item.id === product.id);

    if (existingProduct) {
        if (existingProduct.quantity < product.stock) {
            existingProduct.quantity += 1;
            showModal("Added to shopping cart!"); // Modal für Erfolg
        } else {
            showModal("Maximum quantity reached!"); // Modal für maximale Anzahl
        }
    } else {
        if (product.stock > 0) {
            cart.push({ ...product, quantity: 1, price: parseFloat(product.price) });
            showModal("Added to shopping cart!");
        } else {
            showModal("This product is not available anymore.");
        }
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}

document.addEventListener('DOMContentLoaded', () => {
    // Update Warenkorb beim Laden
    updateCartCount();

    // Elemente für Menü-Toggle und Schließen des Menüs auswählen, wenn vorhanden
    const menuToggle = document.querySelector('.menu-toggle');
    const sideMenu = document.getElementById('sideMenu');
    const closeMenuBtn = document.getElementById('closeMenuBtn');

    // Menü-Toggle-Events nur hinzufügen, wenn sie vorhanden sind
    if (menuToggle && sideMenu && closeMenuBtn) {
        menuToggle.addEventListener('click', () => {
            sideMenu.classList.toggle('open'); // Menü ein- und ausklappen
        });

        closeMenuBtn.addEventListener('click', () => {
            sideMenu.classList.remove('open'); // Menü schließen
        });

        // URL-Navigation für die Filter-Links im Side-Menü
        document.getElementById('showAllFilter').addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'shop.html'; // Navigiert zur Shop-Seite für alle Produkte
        });

        // Beispiel für Event-Listener für die Filter-Links im Side-Menü
document.getElementById('bagsFilter').addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = 'bags.html?category=bags'; // Navigiert zur Bags-Seite mit Kategorie als Parameter
});

document.getElementById('balaclavasFilter').addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = 'balaclavas.html?category=balaclavas'; // Navigiert zur Balaclavas-Seite mit Kategorie als Parameter
});

document.getElementById('handWarmersFilter').addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = 'handwarmers.html?category=hand warmers'; // Navigiert zur Hand Warmers-Seite mit Kategorie als Parameter
});

document.getElementById('otherAccessoriesFilter').addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = 'otheraccessories.html?category=other accessories'; // Navigiert zur Other Accessories-Seite mit Kategorie als Parameter
});
    }

    // Logo-Event nur hinzufügen, wenn es existiert
    const logo = document.querySelector('.logo');
    if (logo) {
        logo.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'shop.html'; // Zurück zur Shop-Seite
        });
    }

    // URL-Parameter beim Laden prüfen, um Filter bei einem Seiten-Refresh zu übernehmen
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category') || null;

    // Nur auf der Shop-Seite die Produktliste anzeigen
    if (document.getElementById('product-container')) {
        displayProductList(category); // Zeigt gefilterte oder alle Produkte an
    }

    
});



function updateImage() {
    // Aktualisiere das Hauptbild basierend auf dem aktuellen Index
    imgElement.src = product.images[currentIndex];

    // Entferne die `active`-Klasse von allen Thumbnails
    document.querySelectorAll('.thumbnail').forEach((thumb, index) => {
        thumb.classList.toggle('active', index === currentIndex);
    });
}

function displayCartItems() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartItemsContainer = document.getElementById('cart-items');
    const totalAmountElement = document.getElementById('total-amount');

    cartItemsContainer.innerHTML = ''; // Leere den Container

    let totalAmount = 0;
    cart.forEach(item => {
        const price = parseFloat(item.price) || 0; // Fallback zu 0, falls `price` nicht vorhanden ist
        totalAmount += price * item.quantity;

        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';

        cartItem.innerHTML = `
            <img src="${item.images[0]}" alt="${item.name}" class="cart-item-image">
            <div class="cart-item-info">
                <h3><a href="product.html?id=${item.id}">${item.name}</a></h3>
                <p class=".product-price-cart1">
            <span class="price-amount-cart1">Price: ${price.toFixed(2)}</span><span class="price-currency-cart1"> €</span>
            </p>
                <p>Quntity: ${item.quantity}</p>
            </div>
            <img src="images/shopping_cart_off_24dp_E8EAED_FILL0_wght400_GRAD0_opsz24.png" 
                 alt="Entfernen" class="remove-item-icon" data-id="${item.id}">
        `;

        // Event-Listener für das Entfernen-Icon
        cartItem.querySelector('.remove-item-icon').addEventListener('click', () => {
            removeFromCart(item.id);
        });

        cartItemsContainer.appendChild(cartItem);
    });
    
    totalAmountElement.innerHTML = `<span class="price-amount-cart2">Total: ${totalAmount.toFixed(2)}</span><span class="price-currency-cart2"> €</span>`;
}


function removeFromCart(productId) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart = cart.filter(item => item.id !== productId);
    localStorage.setItem('cart', JSON.stringify(cart));
    displayCartItems(); // Warenkorb aktualisieren
    updateCartCount(); // Zähler im Icon aktualisieren
}

function filterProductsByCategory(category) {
    const products = JSON.parse(localStorage.getItem('products')) || [];
    const filteredProducts = products.filter(product => product.category === category);
    displayProductList(filteredProducts);
}


document.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('cart')) {
        localStorage.setItem('cart', JSON.stringify([])); // Leeren Warenkorb initialisieren
    }
    if (document.getElementById('cart-items')) {
        displayCartItems(); // Zeigt die Produkte im Warenkorb an
    }
    
});


// Event-Listener für das Laden der jeweiligen Seite
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('product-container')) {
        // Wir sind auf der Shop-Seite
        displayProductList();
    } else if (document.getElementById('product-detail-container')) {
        // Wir sind auf der Produktseite
        displayProductDetails();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('landing-container')) {
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
});




document.querySelector('#bagsFilter').addEventListener('click', () => filterProductsByCategory('bags'));


infoContainer.innerHTML = `
    <h1 class="product-title">${product.name}</h1>
    <p class="product-description">${product.description}</p>
    <p class="product-price">
            <span class="price-amount">${product.price}</span><span class="price-currency"> €</span>
            </p>
    <button id="add-to-cart-button">
        <img src="images/add_shopping_cart_24dp_E8EAED_FILL0_wght400_GRAD0_opsz24.png" alt="Zum Warenkorb hinzufügen">
    </button>
`;

cartItem.innerHTML = `
    <img src="${item.images[0]}" alt="${item.name}" class="cart-item-image">
    <div class="cart-item-info">
        <h3><a href="product.html?id=${item.id}">${item.name}</a></h3>
        <p>Preis: ${price.toFixed(2)} €</p>
        <p>Menge: ${item.quantity} / ${item.stock}</p> <!-- Zeigt an, wie viele Stücke im Warenkorb sind -->
    </div>
    <img src="images/shopping_cart_off_24dp_E8EAED_FILL0_wght400_GRAD0_opsz24.png" 
         alt="Entfernen" class="remove-item-icon" data-id="${item.id}">
`;

