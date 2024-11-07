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


async function displayProductList(category = null, size = null) {
    // Prüfe die URL auf einen category- und size-Parameter, falls nicht gesetzt
    if (!category || !size) {
        const urlParams = new URLSearchParams(window.location.search);
        category = category || urlParams.get('category') || 'all';
        size = size || urlParams.get('size') || 'all';
    }

    const products = await fetchProducts();
    if (!products) return;

    const productContainer = document.getElementById('product-container');
    const productTitle = document.getElementById('product-title');

    productContainer.innerHTML = ''; // Container leeren, um Produkte zu aktualisieren

    // Filtere nach Kategorie, falls angegeben
    let filteredProducts = (category && category !== 'all') 
        ? products.filter(product => product.category.toLowerCase() === category.toLowerCase()) 
        : products;

    // Filtere nach Größe, falls angegeben
    if (size && size !== 'all') {
        filteredProducts = filteredProducts.filter(product => product.size && product.size.toLowerCase() === size.toLowerCase());
    }

    // Überschrift aktualisieren
    if (category && category !== 'all') {
        productTitle.textContent = `${category.charAt(0).toUpperCase() + category.slice(1)}`;
    } else {
        productTitle.textContent = 'All Products';
    }

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
            <p class="product-price-shop">
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
    if (!product) {
        document.getElementById('product-detail-container').innerHTML = `<p>Produkt nicht gefunden.</p>`;
        return;
    }

    // Hauptbild und Thumbnails erstellen
    const mainImageContainer = document.querySelector('.product-main-image-container');
    const thumbnailsContainer = document.querySelector('.product-thumbnail-container');
    let currentIndex = 0;

    // Hauptbild des Produkts
    const imgElement = document.createElement('img');
    imgElement.src = product.images[currentIndex];
    imgElement.alt = product.name;
    imgElement.className = 'product-main-image';
    mainImageContainer.appendChild(imgElement);

    // Thumbnail-Vorschaubilder unter dem Hauptbild hinzufügen
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

    // Funktion zum Aktualisieren des Hauptbildes und der aktiven Thumbnail-Klasse
    function updateImage() {
        imgElement.src = product.images[currentIndex];
        document.querySelectorAll('.product-thumbnail').forEach((thumb, index) => {
            thumb.classList.toggle('active', index === currentIndex);
        });
    }

    // Produktinformationen hinzufügen
    const infoContainer = document.querySelector('.product-info');
    infoContainer.innerHTML = `
        <a href="shop.html" class="back-link">Back to Collection</a>
        <h1 class="product-title-details">${product.name}</h1>
        <p class="product-price">€${product.price.toFixed(2)}</p>
        <p class="product-description">${product.description}</p>
    `;

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
    directCheckoutButton.addEventListener('click', async () => {
        try {
            // PayPal Link von Netlify Function abrufen
            const response = await fetch('/.netlify/functions/get-paypal-link');
            if (!response.ok) {
                throw new Error(`Fehler beim Laden des PayPal-Links: ${response.statusText}`);
            }
            const data = await response.json();
            window.open(data.link, '_blank');
        } catch (error) {
            console.error('Fehler beim Abrufen des PayPal-Links:', error);
            showModal("Unable to proceed to Direct Checkout. Please try again later.");
        }
    });

    // Event-Listener für Add-to-Cart
    addToCartButton.addEventListener('click', () => {
        addToCart(product);
    });
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
    
    if (!modal || !modalMessage) {
        console.error('Modal oder Modal-Nachricht nicht gefunden');
        return;
    }

    // Setze den Modal-Text
    modalMessage.textContent = message;

    // Zeigt das Modal an
    modal.style.display = 'block';

    // Schließt das Modal automatisch nach 3 Sekunden
    setTimeout(() => {
        modal.style.display = 'none';
    }, 3000);

    // Klick auf das Schließen-Symbol
    const closeModalBtn = document.getElementById('close-modal');
    if (closeModalBtn) {
        closeModalBtn.onclick = () => {
            modal.style.display = 'none';
        };
    }

    // Klick außerhalb des Modals schließt es auch
    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
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
            cart.push({ ...product, quantity: 1 });
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

    const categories = ['showAllFilter', 'bagsFilter', 'balaclavasFilter', 'handWarmersFilter', 'otherAccessoriesFilter'];
    const categoryNames = {
        showAllFilter: 'all',
        bagsFilter: 'bags',
        balaclavasFilter: 'balaclavas',
        handWarmersFilter: 'hand warmers',
        otherAccessoriesFilter: 'other accessories',
    };

    // Hinzufügen von Event-Listenern für alle Filterlinks
    categories.forEach(id => {
        const filterElement = document.getElementById(id);
        if (filterElement) {
            filterElement.addEventListener('click', (e) => {
                e.preventDefault();
                const category = categoryNames[id];
                window.location.href = `shop.html?category=${category}`;
            });
        }
    });

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
            window.location.href = 'shop.html?category=all'; // Navigiert zur Shop-Seite und setzt category auf 'all'
        });

        document.getElementById('bagsFilter').addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'shop.html?category=bags'; // Navigiert zur Shop-Seite und setzt category auf 'bags'
        });

        document.getElementById('balaclavasFilter').addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'shop.html?category=balaclavas'; // Navigiert zur Shop-Seite und setzt category auf 'balaclavas'
        });

        document.getElementById('handWarmersFilter').addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'shop.html?category=hand warmers'; // Navigiert zur Shop-Seite und setzt category auf 'hand warmers'
        });

        document.getElementById('otherAccessoriesFilter').addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'shop.html?category=other accessories'; // Navigiert zur Shop-Seite und setzt category auf 'other accessories'
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
        <img src="images/shopping-bag-thin-svgrepo-com.svg" alt="Zum Warenkorb hinzufügen">
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

document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    displayProductDetails();
});

document.addEventListener('DOMContentLoaded', () => {
    // Setze Event-Listener für das Schließen des Modals
    const closeModalBtn = document.getElementById('close-modal');
    if (closeModalBtn) {
        closeModalBtn.onclick = () => {
            const modal = document.getElementById('modal');
            modal.style.display = 'none';
        };
    }

    // Beispiel für das Anzeigen des Modals
    showModal("Test message: Added to cart!");
});

function setupSizeFilters() {
    const sizeFilters = ['allSizesFilter', 'smallSizeFilter', 'bigSizeFilter'];
    const sizeNames = {
        allSizesFilter: 'all',
        smallSizeFilter: 'small',
        bigSizeFilter: 'big'
    };

    sizeFilters.forEach(id => {
        const filterElement = document.getElementById(id);
        if (filterElement) {
            filterElement.addEventListener('click', (e) => {
                e.preventDefault();
                const size = sizeNames[id];
                const category = 'bags'; // Hier gehen wir davon aus, dass wir auf der Bags-Seite sind
                window.location.href = `bags.html?category=${category}&size=${size}`;
            });
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // Update Warenkorb beim Laden
    updateCartCount();

    // Kategorien-Event-Listener hinzufügen
    const categories = ['showAllFilter', 'bagsFilter', 'balaclavasFilter', 'handWarmersFilter', 'otherAccessoriesFilter'];
    const categoryNames = {
        showAllFilter: 'all',
        bagsFilter: 'bags',
        balaclavasFilter: 'balaclavas',
        handWarmersFilter: 'hand warmers',
        otherAccessoriesFilter: 'other accessories',
    };

    categories.forEach(id => {
        const filterElement = document.getElementById(id);
        if (filterElement) {
            filterElement.addEventListener('click', (e) => {
                e.preventDefault();
                const category = categoryNames[id];
                window.location.href = `shop.html?category=${category}`;
            });
        }
    });

    // Setup für die Größenfilter
    setupSizeFilters();

    // Elemente für Menü-Toggle und Schließen des Menüs auswählen
    const menuToggle = document.querySelector('.menu-toggle');
    const sideMenu = document.getElementById('sideMenu');
    const closeMenuBtn = document.getElementById('closeMenuBtn');

    // Menü-Toggle-Events nur hinzufügen, wenn vorhanden
    if (menuToggle && sideMenu && closeMenuBtn) {
        menuToggle.addEventListener('click', () => {
            sideMenu.classList.toggle('open'); // Menü ein- und ausklappen
        });

        closeMenuBtn.addEventListener('click', () => {
            sideMenu.classList.remove('open'); // Menü schließen
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

    // URL-Parameter beim Laden prüfen
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category') || null;
    const size = urlParams.get('size') || null;

    // Produktliste anzeigen
    if (document.getElementById('product-container')) {
        displayProductList(category, size);
    }
});
