document.addEventListener('DOMContentLoaded', () => {
    // Selects the cart counter in the header
    const cartCountElement = document.querySelector('.cart-count');
    
    // Loads the cart from browser storage (localStorage) or creates an empty array
    let cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];

    /**
     * Saves the cart to localStorage and updates the cart icon count.
     */
    function saveCart() {
        localStorage.setItem('shoppingCart', JSON.stringify(cart));
        updateCartCount();
    }

    /**
     * Updates only the cart icon's counter bubble.
     */
    function updateCartCount() {
        if (!cartCountElement) return;

        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

        cartCountElement.textContent = totalItems;
        // Use 'flex' to match modern CSS centering techniques, 'block' also works
        cartCountElement.style.display = totalItems > 0 ? 'flex' : 'none';
    }

    /**
     * Adds a product to the cart or updates its quantity.
     * @param {object} newItem - The product item to add to the cart.
     */
    function addToCart(newItem) {
        const existingItem = cart.find(item => item.id === newItem.id);

        if (existingItem) {
            // If the item already exists, increase its quantity
            existingItem.quantity += newItem.quantity;
        } else {
            // Otherwise, add the new item to the cart array
            cart.push(newItem);
        }
        
        // Save the updated cart to localStorage and update the UI
        saveCart();
    }

    // --- GLOBAL EVENT LISTENER for "Add to Cart" buttons ---
    // This listens for clicks on the entire document, which is efficient for
    // buttons that are added to the page dynamically.
    document.addEventListener('click', (event) => {
        // Check if the clicked element is an "Add to Cart" button
        const addButton = event.target.closest('.add-to-cart-btn');
        
        if (addButton) {
            const { productId, name, price, imageUrl } = addButton.dataset;

            // Ensure all necessary data is present on the button
            if (productId && name && price && imageUrl) {
                // Create a product object from the button's data attributes
                const itemToAdd = {
                    id: productId,
                    name: name,
                    price: parseFloat(price),
                    imageUrl: imageUrl,
                    quantity: 1 // Add one item at a time by default
                };
                
                // Call the main function to add the item to the cart
                addToCart(itemToAdd);

                // Optional: Give the user feedback
                alert(`"${itemToAdd.name}" was added to your cart.`);

            } else {
                console.error('Product data attributes are missing from the button.');
            }
        }
    });

    // --- Initialize the cart icon count when the page first loads ---
    updateCartCount();
});