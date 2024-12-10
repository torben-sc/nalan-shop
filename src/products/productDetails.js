import { fetchProducts } from '../utils/helpers.js';

// Funktion zur Anzeige der Produktdetails
export async function displayProductDetails() {
    const pathParts = window.location.pathname.split('/');
    const productId = pathParts[pathParts.length - 1]; // Extrahiere die ID vom Ende des Pfads

    const products = await fetchProducts();
    if (!products) return;

    const product = products.find(p => p.id === productId);
    if (!product) {
        document.getElementById('product-detail-container').innerHTML = `<p>Produkt nicht gefunden.</p>`;
        return;
    }

    createProductImages(product);
    displayProductInfo(product);
    addButtonsAndEventListeners(product);
}

// Hilfsfunktion zur Erstellung der Hauptbilder und Thumbnails
function createProductImages(product) {
    const mainImageContainer = document.querySelector('.product-main-image-container');
    const thumbnailsContainer = document.querySelector('.product-thumbnail-container');

    mainImageContainer.innerHTML = '';
    thumbnailsContainer.innerHTML = '';

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

function updateImage(imgElement, currentIndex, images) {
    imgElement.src = images[currentIndex];
    document.querySelectorAll('.product-thumbnail').forEach((thumb, index) => {
        thumb.classList.toggle('active', index === currentIndex);
    });
}

function displayProductInfo(product) {
    const infoContainer = document.querySelector('.product-info');
    infoContainer.innerHTML = `
        <a href="/shop" class="back-link">Back to Collection</a>
        <h1 class="product-title-details">${product.name}</h1>
        <p class="product-price">€${product.price.toFixed(2)}</p>
        <p class="product-description">${product.description}</p>
    `;
}

function addButtonsAndEventListeners(product) {
    const infoContainer = document.querySelector('.product-info');

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';

    const directCheckoutButton = document.createElement('button');
    directCheckoutButton.id = 'direct-checkout-button';
    directCheckoutButton.className = 'checkout-button';
    directCheckoutButton.textContent = 'Direct Checkout';
    directCheckoutButton.addEventListener('click', () => {
        window.location.href = `/.netlify/functions/get-paypal-link?productId=${product.id}`;
    });
    buttonContainer.appendChild(directCheckoutButton);

    const orElement = document.createElement('p');
    orElement.className = 'or-text';
    orElement.textContent = 'OR';
    buttonContainer.appendChild(orElement);

    const addToCartButton = document.createElement('button');
    addToCartButton.className = 'add-to-cart-button';
    addToCartButton.textContent = 'Add to cart';
    addToCartButton.addEventListener('click', () => {
        addToCart(product);
        document.getElementById('cart-popup').classList.add('open');
    });
    buttonContainer.appendChild(addToCartButton);

    infoContainer.appendChild(buttonContainer);
}
