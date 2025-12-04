document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();

    const cartIcon = document.getElementById('cart-icon');
    const cartPopup = document.getElementById('cart-popup');
    const closeCartButton = document.getElementById('close-cart');

    if (cartIcon && cartPopup) {
        cartIcon.addEventListener('click', (e) => {
            e.preventDefault();
            cartPopup.classList.add('open');
        });
    }

    if (closeCartButton && cartPopup) {
        closeCartButton.addEventListener('click', () => {
            cartPopup.classList.remove('open');
        });
    }

    const updateURL = (category, size = null, accs = null) => {
        let path = `/shop/${category}`;
        if (category === 'accessories' && accs) {
            path += `/${accs}`;
        } else if (size) {
            path += `/${size}`;
        }
        history.replaceState(null, '', path);
    };

    const getFiltersFromPath = () => {
        const pathParts = window.location.pathname.split('/').filter(Boolean);
        let category = 'all';
        let subFilter = null;

        if (pathParts[0] === 'shop' && pathParts[1]) {
            category = pathParts[1];
        }

        if (pathParts[2]) {
            subFilter = pathParts[2];
        }

        return { category, subFilter };
    };

    const showSubMenu = (category) => {
        document.querySelectorAll('.top-menu-wrapper-2').forEach(wrapper => wrapper.style.display = 'none');
        const subcategoryWrapper = document.getElementById(`${category}-subcategories`);
        if (subcategoryWrapper) {
            subcategoryWrapper.style.display = 'block';
        }
    };

    const activateFilterLinks = (category, subFilter) => {
        document.querySelectorAll('.top-menu a').forEach(link => link.classList.remove('active-filter'));
        const mainFilter = document.querySelector(`#${category}Filter`);
        if (mainFilter) mainFilter.classList.add('active-filter');

        document.querySelectorAll('.top-menu-wrapper-2 a').forEach(link => link.classList.remove('active-filter'));
        if (subFilter) {
            const subFilterLink = document.querySelector(`.top-menu-wrapper-2 a[data-category="${category}"][data-accs="${subFilter}"], 
                .top-menu-wrapper-2 a[data-category="${category}"][data-size="${subFilter}"]`);
            if (subFilterLink) subFilterLink.classList.add('active-filter');
        }
    };

    const categoryMap = {
        showAllFilter: 'all',
        bagsFilter: 'bags',
        balaclavasFilter: 'balaclavas',
        scarvesFilter: 'scarves',
        accessoriesFilter: 'accessories',
    };

    Object.keys(categoryMap).forEach(filterId => {
        const filterElement = document.getElementById(filterId);
        if (filterElement) {
            filterElement.addEventListener('click', (e) => {
                e.preventDefault();
                const category = categoryMap[filterId];

                showSubMenu(category);

                document.querySelectorAll('.top-menu a').forEach(link => link.classList.remove('active-filter'));
                filterElement.classList.add('active-filter');

                updateURL(category);
                loadProductList(category);
            });
        }
    });

    document.querySelectorAll('.top-menu-wrapper-2 a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const category = link.getAttribute('data-category');
            const size = link.getAttribute('data-size');
            const accs = link.getAttribute('data-accs');

            link.closest('.top-menu-wrapper-2').querySelectorAll('a').forEach(l => l.classList.remove('active-filter'));
            link.classList.add('active-filter');

            if (category === 'accessories') {
                updateURL(category, null, accs);
                loadProductList(category, null, accs);
            } else {
                updateURL(category, size);
                loadProductList(category, size);
            }
        });
    });

    // Produkte initial laden basierend auf der URL
    const { category, subFilter } = getFiltersFromPath();
    const currentPath = window.location.pathname;

    if (currentPath.startsWith('/product/')) {
        displayProductDetails();
    } else {
        showSubMenu(category); // Untermenü für die Kategorie anzeigen
        activateFilterLinks(category, subFilter); // Aktive Links markieren
        if (category === 'accessories') {
            loadProductList(category, null, subFilter);
        } else {
            loadProductList(category, subFilter);
        }
    }
    createFooter()
});


// Funktion zum Laden der Produkte aus einer JSON-Datei
async function fetchProducts() {
    try {
        const response = await fetch('/.netlify/functions/get-products'); // API-Endpunkt
        if (!response.ok) {
            throw new Error(`Error loading products: ${response.statusText}`);
        }
        const products = await response.json();
        console.log('Geladene Produkte:', products); // Debugging
        return products;
    } catch (error) {
        console.error('Fehler beim Laden der Produkte:', error);
        return [];
    }
}

// Funktion zur Anzeige der Produktliste basierend auf der Kategorie und Größe
async function loadProductList(category = 'all', size = null, accs = null) {
    const productContainer = document.getElementById('product-container');
    const loadingIndicator = document.getElementById('loading-indicator');
    const productTitle = document.getElementById('product-title');

    // Ladeindikator anzeigen
    if (loadingIndicator) loadingIndicator.style.display = 'block';
    productContainer.style.display = 'none'; // Container ausblenden
    productContainer.innerHTML = ''; // Inhalt löschen

    // Titel aktualisieren
    productTitle.innerHTML = (category !== 'all')
        ? `${category.charAt(0).toUpperCase() + category.slice(1)}`
        : 'All<span class="mobile-line-break"> </span>Products';

    try {
        const products = await fetchProducts(); // Produkte laden
        if (!products || products.length === 0) {
            productContainer.innerHTML = '<p>No products available.</p>';
            return;
        }

        // Produkte filtern
        let filteredProducts = (category && category !== 'all')
            ? products.filter(product => product.category.toLowerCase() === category.toLowerCase())
            : products;

        if (size && size !== 'all') {
            filteredProducts = filteredProducts.filter(product => product.size && product.size.toLowerCase() === size.toLowerCase());
        }

        if (accs && accs !== 'all') {
            filteredProducts = filteredProducts.filter(product => product.accs && product.accs.toLowerCase() === accs.toLowerCase());
        }

        // Produkte anzeigen
        if (filteredProducts.length > 0) {
            filteredProducts.forEach(product => {
                const productCard = document.createElement('div');
                productCard.className = 'product-card';
        
                // Prüfen, ob Varianten vorhanden sind
                if (product.variants && product.variants.length > 0) {
                    productCard.innerHTML = `
                        <a href="/product/${product.id}" class="product-link">
                            <img src="${product.defaultImage || product.variants[0].images[0]}" alt="${product.name}">
                            <h2>${product.name}</h2>
                        </a>
                        <p class="product-price-shop">
                            ${
                                product.variants.some(variant => variant.stock > 0 || variant.stock === -1) 
                                ? `<span class="price-amount-shop">${product.price}</span><span class="price-currency-shop"> €</span>` 
                                : `<span class="sold-out-text">SOLD OUT</span>`
                            }
                        </p>
                        <div class="variant-colors-container">
                        ${
                            product.variants.slice(0, 3).map(variant => {
                                const isSoldOut = variant.stock === 0;
                                const colorStyle = variant.color.includes('/') 
                                    ? `linear-gradient(45deg, ${variant.color.split('/')[0]} 50%, ${variant.color.split('/')[1]} 50%)`
                                    : variant.color;
                                return `
                                    <span 
                                        class="variant-color ${isSoldOut ? 'sold-out' : ''}" 
                                        style="background: ${colorStyle};" 
                                        title="${isSoldOut ? 'Sold Out' : 'Available'}">
                                    </span>
                                `;
                            }).join('')
                        }
                            ${
                                product.variants.length > 3 
                                ? `<span class="variant-color-more">+${product.variants.length - 3}</span>` 
                                : ''
                            }
                        </div>
                    `;
                }
                 else {
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
                }
        
                productContainer.appendChild(productCard);
            });
        } else {
            productContainer.innerHTML = '<p>No products match your filters.</p>';
        }
    } catch (error) {
        console.error('Error loading products:', error);
        productContainer.innerHTML = '<p>Error loading products. Please try again later.</p>';
    } finally {
        // Ladeindikator ausblenden
        loadingIndicator.style.display = 'none';
        productContainer.style.display = 'grid';
    }
}

// Funktion zur Anzeige der Produktdetails
async function displayProductDetails() {
    const pathParts = window.location.pathname.split('/');
    const productId = pathParts[pathParts.length - 1];

    if (!productId) {
        console.error('Product ID not found in URL');
        document.getElementById('product-detail-container').innerHTML = '<p>Product not found.</p>';
        return;
    }

    try {
        const products = await fetchProducts();
        const product = products.find(p => p.id === productId);

        if (!product) {
            console.error(`No product found for ID: ${productId}`);
            document.getElementById('product-detail-container').innerHTML = '<p>Product not found.</p>';
            return;
        }

        const selectedVariant = createColorMenu(product); // Farbmenü erstellen und erste Variante zurückgeben
        createProductImages(product); // Produktbilder erstellen
        displayProductInfo(product, selectedVariant); // Produktinformationen mit der Variante anzeigen
        addButtonsAndEventListeners(product); // Event-Listener hinzufügen

    } catch (error) {
        console.error('Error displaying product details:', error);
        document.getElementById('product-detail-container').innerHTML = '<p>Error loading product details.</p>';
    }
}


function createColorMenu(product) {
    const thumbnailsContainer = document.querySelector('.product-thumbnail-container');

    const colorMenuContainer = document.createElement('div');
    colorMenuContainer.className = 'product-color-menu';

    let selectedVariant = null; // Die ausgewählte Variante

    if (product.variants && product.variants.length > 0) {
        let showingAllColors = false;

        const renderColors = (showAll) => {
            colorMenuContainer.innerHTML = '';
            const variantsToShow = showAll ? product.variants : product.variants.slice(0, 4);

            variantsToShow.forEach((variant, index) => {
                const colorStyle = variant.color.includes('/')
                    ? `linear-gradient(45deg, ${variant.color.split('/')[0]} 50%, ${variant.color.split('/')[1]} 50%)`
                    : variant.color;

                const buttonWrapper = document.createElement('div');
                buttonWrapper.className = 'color-button-wrapper';
                buttonWrapper.style.position = 'relative';
                buttonWrapper.style.width = '20px';
                buttonWrapper.style.height = '20px';

                const colorButton = document.createElement('button');
                colorButton.className = 'color-button';
                colorButton.style.background = colorStyle;
                colorButton.dataset.index = index;
                colorButton.title = variant.name || `Color ${index + 1}`;

                if (variant.stock === 0) {
                    const strikethrough = document.createElement('div');
                    strikethrough.style.position = 'absolute';
                    strikethrough.style.top = '0';
                    strikethrough.style.left = '0';
                    strikethrough.style.width = '100%';
                    strikethrough.style.height = '100%';
                    strikethrough.style.pointerEvents = 'none';
                    strikethrough.style.backgroundImage = `linear-gradient(135deg, transparent 45%, black 45%, black 55%, transparent 55%)`;
                    strikethrough.style.zIndex = '1';

                    colorButton.style.opacity = '0.5';
                    buttonWrapper.appendChild(strikethrough);
                }

                // Standardmäßig die erste Variante als ausgewählt setzen
                if (index === 0 && !selectedVariant) {
                    selectedVariant = variant;
                }

                colorButton.addEventListener('click', () => {
                    selectedVariant = variant; // Aktualisiert die ausgewählte Variante
                    updateImagesForVariant(product, variant);
                    updateAddToCartButton(product, variant);
                    displayProductInfo(product, selectedVariant); // Produktinfo aktualisieren
                });

                buttonWrapper.appendChild(colorButton);
                colorMenuContainer.appendChild(buttonWrapper);
            });

            if (!showAll && product.variants.length > 4) {
                const moreButton = document.createElement('span');
                moreButton.className = 'show-more-colors';
                moreButton.textContent = `+${product.variants.length - 4}`;
                moreButton.style.textDecoration = 'underline';
                moreButton.style.cursor = 'pointer';
                moreButton.addEventListener('click', () => {
                    showingAllColors = true;
                    renderColors(true);
                });
                colorMenuContainer.appendChild(moreButton);
            }

            if (showAll) {
                const closeButton = document.createElement('span');
                closeButton.className = 'close-colors';
                closeButton.textContent = 'Close';
                closeButton.style.textDecoration = 'underline';
                closeButton.style.cursor = 'pointer';
                closeButton.addEventListener('click', () => {
                    showingAllColors = false;
                    renderColors(false);
                });
                colorMenuContainer.appendChild(closeButton);

                colorMenuContainer.style.display = 'flex';
                colorMenuContainer.style.flexWrap = 'wrap';
                colorMenuContainer.style.gap = '10px';
            } else {
                colorMenuContainer.style.display = 'flex';
                colorMenuContainer.style.flexWrap = 'nowrap';
                colorMenuContainer.style.gap = '10px';
            }
        };

        renderColors(false);
    }

    thumbnailsContainer.parentElement.insertBefore(colorMenuContainer, thumbnailsContainer);

    return selectedVariant; // Die ausgewählte Variante zurückgeben
}

// Funktion zur Aktualisierung der Bilder basierend auf der ausgewählten Variante
function updateImagesForVariant(product, variant) {
    const mainImageContainer = document.querySelector('.product-main-image-container');
    const thumbnailsContainer = document.querySelector('.product-thumbnail-container');
    const productTitleElement = document.querySelector('.product-title-details');

    mainImageContainer.innerHTML = '';
    thumbnailsContainer.innerHTML = '';

    // Aktualisiere die Überschrift mit dem Variantennamen
    if (productTitleElement) {
        productTitleElement.textContent = `${variant.name}`;
    }

    const imgElement = document.createElement('img');
    imgElement.src = variant.images[0];
    imgElement.alt = `${product.name} - ${variant.name}`;
    imgElement.className = 'product-main-image';
    mainImageContainer.appendChild(imgElement);

    variant.images.forEach((imageUrl, index) => {
        const thumbnail = document.createElement('img');
        thumbnail.src = imageUrl;
        thumbnail.alt = `${product.name} - ${variant.name} - Vorschau ${index + 1}`;
        thumbnail.className = 'product-thumbnail';
        if (index === 0) thumbnail.classList.add('active');
        thumbnail.addEventListener('click', () => {
            imgElement.src = imageUrl;
            document.querySelectorAll('.product-thumbnail').forEach(thumb => thumb.classList.remove('active'));
            thumbnail.classList.add('active');
        });
        thumbnailsContainer.appendChild(thumbnail);
    });
}

// Hilfsfunktion zur Erstellung der Hauptbilder und Thumbnails
function createProductImages(product) {
    const mainImageContainer = document.querySelector('.product-main-image-container');
    const thumbnailsContainer = document.querySelector('.product-thumbnail-container');

    mainImageContainer.innerHTML = ''; // Vorherige Bilder entfernen
    thumbnailsContainer.innerHTML = ''; // Vorherige Thumbnails entfernen

    let images = [];
    if (product.variants && product.variants.length > 0) {
        // Verwende die Bilder der ersten Variante standardmäßig
        images = product.variants[0].images;
    } else if (product.images && product.images.length > 0) {
        // Fallback: Verwende Bilder des Produkts (falls keine Varianten vorhanden)
        images = product.images;
    } else {
        console.error('Keine Bilder verfügbar für Produkt:', product.name);
        return;
    }

    let currentIndex = 0;

    const imgElement = document.createElement('img');
    imgElement.src = images[currentIndex];
    imgElement.alt = product.name;
    imgElement.className = 'product-main-image';
    mainImageContainer.appendChild(imgElement);

    images.forEach((imageUrl, index) => {
        const thumbnail = document.createElement('img');
        thumbnail.src = imageUrl;
        thumbnail.alt = `${product.name} - Vorschau ${index + 1}`;
        thumbnail.className = 'product-thumbnail';
        if (index === currentIndex) thumbnail.classList.add('active');
        thumbnail.addEventListener('click', () => {
            currentIndex = index;
            updateImage(imgElement, currentIndex, images);
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
function displayProductInfo(product, selectedVariant = null) {
    const infoContainer = document.querySelector('.product-info');

    // Standardanzeige, falls keine Variante ausgewählt wurde
    let displayName = product.name;
    let displayPrice = product.stock > 0 ? `€${product.price.toFixed(2)}` : 'SOLD OUT';

    // Wenn eine Variante ausgewählt ist, passe die Anzeige an
    if (selectedVariant) {
        displayName = selectedVariant.name;
        
        if (selectedVariant.stock > 0) {
            displayPrice = `€${selectedVariant.price.toFixed(2)}`;
        } else if (selectedVariant.stock === -1) {
            // Custom Order Available
            displayPrice = `
                <div style="text-align: left;">
                    <div style="font-size: 24px; font-weight: bold; margin-bottom: 15px;">
                        €${product.price.toFixed(2)}
                    </div>
                    <strong>Custom Order Available</strong> <br><br>
                    This original color combination is no longer available.<br>
                    You can request a custom version in similar or new colors.<br>
                    Contact me via 
                    <a href="https://www.instagram.com/nalancreations" target="_blank" style="color: #E55013; text-decoration: none;">Instagram</a> 
                    or 
                    <a href="mailto:nalancreations@gmx.de" style="color: #E55013; text-decoration: none;">Email</a>
                </div>
                <p></p>
                <p></p>
            `;
        } else {
            displayPrice = 'SOLD OUT';
        }
    }

    infoContainer.innerHTML = `
        <a href="/shop" class="back-link">Back to Collection</a>
        <h1 class="product-title-details">${displayName}</h1>
        <p class="product-price">${displayPrice}</p>
        <p class="product-description">${product.description}</p>
        <div class="only-germany-noti">
            Currently only shipping to Germany. For international requests, contact me on
            <a href="https://www.instagram.com/nalancreations" target="_blank" style="color: #E55013; text-decoration: none;">Instagram</a>
            or
            <a href="mailto:nalancreations@gmx.de" style="color: #E55013; text-decoration: none;">Email</a>.
        </div>
    `;
}

// Funktion zur Aktualisierung des Add-to-Cart Buttons
function updateAddToCartButton(product, variant) {
    const buttonContainer = document.querySelector('.button-container');
    buttonContainer.innerHTML = ''; // Vorherige Buttons entfernen

    if (variant.stock > 0) {
        // Button hinzufügen, wenn die Variante auf Lager ist
        const addToCartButton = document.createElement('button');
        addToCartButton.className = 'add-to-cart-button';
        addToCartButton.textContent = 'Add to cart';
        addToCartButton.addEventListener('click', () => {
            addToCart({
                id: variant.id,
                name: `${variant.name}`,
                images: variant.images,
                price: product.price,
                stock: variant.stock
            });

            const cartPopup = document.getElementById('cart-popup');
            if (cartPopup) {
                cartPopup.classList.add('open');
            }
            displayCartItems();
        });
        buttonContainer.appendChild(addToCartButton);
    } else if (variant.stock === -1) {
    }
    else {
        // Sold-Out Text anzeigen, wenn die Variante ausverkauft ist
        const soldOutText = document.createElement('p');
        soldOutText.className = 'sold-out-text-2';
        soldOutText.innerHTML = `
        <div style="text-align: center; margin-bottom: 10px;">
            <strong>THIS VARIANT IS SOLD OUT</strong> <br>
            REQUESTS POSSIBLE ON 
            <a href="https://www.instagram.com/nalancreations" target="_blank" class="sold-out-link">INSTAGRAM</a> 
            OR 
            <a href="mailto:nalancreations@gmx.de" class="sold-out-link">EMAIL</a>
        </div>`;
        buttonContainer.appendChild(soldOutText);
    }
}

// Hilfsfunktion zur Erstellung der Buttons und deren Event-Listener
function addButtonsAndEventListeners(product) {
    const infoContainer = document.querySelector('.product-info');

    // Container für die Buttons oder den Sold-Out Text
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';

    // Füge den Button-Container dem Info-Container hinzu
    infoContainer.appendChild(buttonContainer);

    if (product.variants && product.variants.length > 0) {
        // Platzhalter für die Nachricht "Please select a color"
        const messagePlaceholder = document.createElement('p');
        messagePlaceholder.className = 'selection-message';
        messagePlaceholder.textContent = 'PLEASE SELECT A COLOR'; // All caps
        messagePlaceholder.style.color = '#24388E'; // Dark Blue
        messagePlaceholder.style.fontWeight = 'bold';
        messagePlaceholder.style.textAlign = 'center';
        messagePlaceholder.style.marginBottom = '10px';

        buttonContainer.appendChild(messagePlaceholder);

        // Event-Listener für Variantenauswahl hinzufügen
        product.variants.forEach((variant, index) => {
            const colorButton = document.querySelector(`.color-button[data-index="${index}"]`);
            if (colorButton) {
                colorButton.addEventListener('click', () => {
                    // Verstecke die Nachricht und zeige den Add-to-Cart-Button für die ausgewählte Variante
                    messagePlaceholder.style.display = 'none';
                    updateAddToCartButton(product, variant);
                });
            }
        });
    } else if (product.stock > 0) {
        // Für Produkte ohne Varianten: Standardmäßiger Add-to-Cart-Button
        const addToCartButton = document.createElement('button');
        addToCartButton.className = 'add-to-cart-button';
        addToCartButton.textContent = 'Add to cart';
        addToCartButton.addEventListener('click', () => {
            addToCart(product);

            const cartPopup = document.getElementById('cart-popup');
            if (cartPopup) {
                cartPopup.classList.add('open');
            }
            displayCartItems();
        });
        buttonContainer.appendChild(addToCartButton);
    } else {
        // Sold-Out Text für Produkte ohne Varianten
        const soldOutText = document.createElement('p');
        soldOutText.className = 'sold-out-text-2';
        soldOutText.innerHTML = `
        <div style="text-align: center; margin-bottom: 10px;">
            <strong>SOLD OUT</strong> <br>
            REQUESTS POSSIBLE ON 
            <a href="https://www.instagram.com/nalancreations" target="_blank" class="sold-out-link">INSTAGRAM</a> 
            OR 
            <a href="mailto:nalancreations@gmx.de" class="sold-out-link">EMAIL</a>
        </div>`;
        buttonContainer.appendChild(soldOutText);
    }
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
                    const orderID = await createPayPalOrder(
                        cart.map(item => ({
                            id: item.id, // Diese ID sollte die Variant-ID sein
                            quantity: item.quantity
                        }))
                    );
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