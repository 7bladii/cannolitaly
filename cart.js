document.addEventListener('DOMContentLoaded', () => {
    // Selects the cart counter in the header
    const cartCountElement = document.querySelector('.cart-count');
    // Selects the container for the floating mini-cart items
    const miniCartItemsContainer = document.getElementById('mini-cart-items');

    // Loads the cart from browser storage (localStorage) or creates an empty array
    let cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];

    /**
     * Saves the cart to localStorage and updates ALL displays.
     */
    const saveCart = () => {
        localStorage.setItem('shoppingCart', JSON.stringify(cart));
        updateCartCount();
        renderMiniCart(); // <-- AÑADIDO: Actualiza también el mini-carrito
    };

    /**
     * Updates only the cart icon's counter bubble.
     */
    const updateCartCount = () => {
        if (!cartCountElement) return;
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

        cartCountElement.textContent = totalItems;
        cartCountElement.style.display = totalItems > 0 ? 'flex' : 'none';
    };

    /**
     * Renders the items inside the floating mini-cart.
     */
    const renderMiniCart = () => {
        // If this page doesn't have a mini-cart container, do nothing.
        if (!miniCartItemsContainer) return;

        miniCartItemsContainer.innerHTML = ''; // Clear previous items

        if (cart.length === 0) {
            miniCartItemsContainer.innerHTML = '<p style="padding: 15px; text-align: center;">Your cart is empty.</p>';
            return;
        }

        cart.forEach(item => {
            const itemHTML = `
                <div style="display: flex; align-items: center; padding: 10px; border-bottom: 1px solid #f0f0f0;">
                    <img src="${item.imageUrl}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; margin-right: 12px; border-radius: 4px;">
                    <div style="flex-grow: 1;">
                        <p style="margin: 0; font-weight: bold; font-size: 0.95em;">${item.name}</p>
                        <p style="margin: 0; font-size: 0.85em; color: #555;">${item.quantity} x $${item.price.toFixed(2)}</p>
                    </div>
                </div>
            `;
            miniCartItemsContainer.innerHTML += itemHTML;
        });
    };

    /**
     * Adds a product to the cart or updates its quantity.
     */
    const addToCart = (productId, name, price, imageUrl) => {
        const existingItem = cart.find(item => item.id === productId);

        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push({
                id: productId,
                name: name,
                price: parseFloat(price),
                imageUrl: imageUrl,
                quantity: 1
            });
        }
        
        saveCart();
    };

    // Use Event Delegation to listen for clicks on dynamically added buttons
    document.addEventListener('click', (event) => {
        const addButton = event.target.closest('.add-to-cart-btn');
        if (addButton) {
            const { productId, name, price, imageUrl } = addButton.dataset;

            if (productId && name && price && imageUrl) {
                addToCart(productId, name, price, imageUrl);
            } else {
                console.error('Product data is missing from the button.');
            }
        }
    });

    // --- Initialize all displays when the page first loads ---
    updateCartCount();
    renderMiniCart();
});


