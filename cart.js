// This script should be loaded on ALL pages to manage the cart state globally.

// --- 1. GLOBAL CART STATE AND FUNCTIONS ---

// Load cart from localStorage or initialize an empty array.
// This `cart` variable is now globally accessible.
let cart = JSON.parse(localStorage.getItem('cart')) || [];

/**
 * Saves the current cart state to localStorage.
 */
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    // Dispatch a custom event to notify the UI (like the cart icon) that the cart has changed.
    document.dispatchEvent(new CustomEvent('cartUpdated'));
}

/**
 * Adds a new product to the cart or updates its quantity if it already exists.
 * This function is now global and can be called from any other script.
 * @param {object} newItem - The product object to add.
 */
function addToCart(newItem) {
    const existingItem = cart.find(item => item.id === newItem.id);

    if (existingItem) {
        existingItem.quantity += newItem.quantity;
    } else {
        cart.push(newItem);
    }
    
    saveCart(); // Save the updated cart and notify the UI.
    console.log('Cart updated:', cart);
}

// --- 2. UI MANAGEMENT (runs after the DOM is ready) ---

document.addEventListener('DOMContentLoaded', () => {
    const cartCountElement = document.querySelector('.cart-count');

    /**
     * Updates the number displayed on the cart icon.
     */
    function updateCartCount() {
        if (!cartCountElement) return;

        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        
        cartCountElement.textContent = totalItems;
        cartCountElement.style.display = totalItems > 0 ? 'flex' : 'none';
    }

    // Listen for the custom 'cartUpdated' event to refresh the cart count.
    document.addEventListener('cartUpdated', updateCartCount);

    // Initial update when the page loads.
    updateCartCount();

    // --- 3. GLOBAL CLICK HANDLER FOR "ADD TO CART" BUTTONS ---
    // Using "event delegation" on `document` ensures this works even for buttons
    // that are added to the page dynamically (like from shop-loader.js).
    document.addEventListener('click', (event) => {
        const addButton = event.target.closest('.add-to-cart-btn');
        
        if (addButton) {
            const { productId, name, price, imageUrl } = addButton.dataset;
            const quantityInput = document.getElementById('quantity');
            const quantity = quantityInput ? parseInt(quantityInput.value) : 1;

            if (productId && name && price && imageUrl) {
                addToCart({
                    id: productId,
                    name: name,
                    price: parseFloat(price),
                    imageUrl: imageUrl,
                    quantity: quantity
                });

                // Provide visual feedback to the user
                const originalText = addButton.textContent;
                addButton.textContent = 'Added!';
                addButton.disabled = true;
                setTimeout(() => {
                    addButton.textContent = originalText;
                    addButton.disabled = false;
                }, 1500);
            }
        }
    });
});