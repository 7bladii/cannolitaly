document.addEventListener('DOMContentLoaded', () => {
    // Selects the cart counter in the header
    const cartCountElement = document.querySelector('.cart-count');
    // Selects all buttons with the class 'add-to-cart-btn'
    const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');

    // Loads the cart from browser storage (localStorage) or creates an empty array
    let cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];

    /**
     * Updates the cart icon's counter and visibility.
     */
    const updateCartDisplay = () => {
        let totalItems = 0;
        // Calculates the total quantity of all items in the cart
        cart.forEach(item => {
            totalItems += item.quantity;
        });

        if (cartCountElement) {
            cartCountElement.textContent = totalItems;
            // Shows the counter only if there are items in the cart
            cartCountElement.style.display = totalItems > 0 ? 'flex' : 'none';
        }
    };

    /**
     * Adds a product to the cart or updates its quantity.
     * @param {string} productId - The unique ID of the product.
     * @param {string} name - The name of the product.
     * @param {string} price - The price of the product.
     */
    const addToCart = (productId, name, price) => {
        // Checks if the product is already in the cart
        const existingItem = cart.find(item => item.id === productId);

        if (existingItem) {
            // If it exists, increments the quantity
            existingItem.quantity++;
        } else {
            // If it's a new item, adds it to the cart array
            cart.push({
                id: productId,
                name: name,
                price: parseFloat(price),
                quantity: 1
            });
        }

        // Saves the updated cart back to localStorage
        localStorage.setItem('shoppingCart', JSON.stringify(cart));
        // Updates the display to show the new total
        updateCartDisplay();
    };

    // Attaches a 'click' event listener to every "Add to Cart" button
    addToCartButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const { productId, name, price } = event.target.dataset;
            addToCart(productId, name, price);
        });
    });

    // Updates the cart display when the page first loads
    updateCartDisplay();
});