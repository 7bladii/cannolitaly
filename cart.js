document.addEventListener('DOMContentLoaded', () => {
    // Select UI elements
    const cartCountElement = document.querySelector('.cart-count');
    const cartPreviewContainer = document.getElementById('cart-preview-items');
    
    // Load cart from localStorage or start with an empty array
    let cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];

    /**
     * Updates the HTML for the cart preview dropdown.
     */
    function updateCartPreview() {
        if (!cartPreviewContainer) return;

        if (cart.length === 0) {
            cartPreviewContainer.innerHTML = '<p style="text-align:center; color:#777;">Your cart is empty.</p>';
        } else {
            cartPreviewContainer.innerHTML = ''; // Clear old items
            cart.forEach(item => {
                const itemHTML = `
                    <div class="cart-preview-item">
                        <img src="${item.imageUrl}" alt="${item.name}">
                        <div class="cart-preview-item-info">
                            <h5>${item.name} (x${item.quantity})</h5>
                            <p>$${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                    </div>
                `;
                cartPreviewContainer.innerHTML += itemHTML;
            });
        }
    }

    /**
     * Updates the cart icon's counter bubble.
     */
    function updateCartCount() {
        if (!cartCountElement) return;
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCountElement.textContent = totalItems;
        cartCountElement.style.display = totalItems > 0 ? 'flex' : 'none';
    }

    /**
     * Saves the cart and updates all UI components.
     */
    function saveCartAndupdateUI() {
        localStorage.setItem('shoppingCart', JSON.stringify(cart));
        updateCartCount();
        updateCartPreview();
    }

    /**
     * Adds an item to the cart or updates its quantity.
     * @param {object} newItem - The product to add.
     */
    function addToCart(newItem) {
        const existingItem = cart.find(item => item.id === newItem.id);

        if (existingItem) {
            existingItem.quantity += newItem.quantity;
        } else {
            cart.push(newItem);
        }
        
        saveCartAndupdateUI();
    }

    // --- GLOBAL EVENT LISTENER for "Add to Cart" buttons ---
    document.addEventListener('click', (event) => {
        const addButton = event.target.closest('.add-to-cart-btn');
        
        if (addButton) {
            const { productId, name, price, imageUrl } = addButton.dataset;

            if (productId && name && price && imageUrl) {
                const itemToAdd = {
                    id: productId,
                    name: name,
                    price: parseFloat(price),
                    imageUrl: imageUrl,
                    quantity: 1
                };
                
                addToCart(itemToAdd);

                // Better User Feedback: Briefly change button text
                const originalText = addButton.textContent;
                addButton.textContent = 'Added!';
                setTimeout(() => {
                    addButton.textContent = originalText;
                }, 1500); // Revert after 1.5 seconds

            } else {
                console.error('Product data attributes are missing from the button.');
            }
        }
    });

    // --- Initialize the UI when the page first loads ---
    saveCartAndupdateUI();
});