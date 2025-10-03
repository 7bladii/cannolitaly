document.addEventListener('DOMContentLoaded', () => {
    // --- Select UI elements using the correct IDs from the new HTML structure ---
    const cartItemsList = document.getElementById('cart-items-list');
    const summarySubtotal = document.getElementById('summary-subtotal');
    const summaryTaxes = document.getElementById('summary-taxes');
    const summaryTotal = document.getElementById('summary-total');
    const emptyCartMessage = document.getElementById('empty-cart-message');
    const cartLayout = document.querySelector('.cart-layout');
    const checkoutBtn = document.getElementById('checkout-btn');

    const TAX_RATE = 0.095; // Example tax rate (9.5% for Los Angeles)

    /**
     * Renders all items from localStorage into the cart page.
     */
    function renderCart() {
        // Use the consistent 'cart' key for localStorage
        const cart = JSON.parse(localStorage.getItem('cart')) || [];

        // Safety check if elements don't exist
        if (!cartLayout || !emptyCartMessage) return;

        // Show the 'empty cart' message if the cart is empty
        if (cart.length === 0) {
            emptyCartMessage.style.display = 'block';
            cartLayout.style.display = 'none';
        } else {
            emptyCartMessage.style.display = 'none';
            cartLayout.style.display = 'grid'; // Use 'grid' to show the two-column layout
        }

        cartItemsList.innerHTML = ''; // Clear previous items
        let subtotal = 0;

        cart.forEach((item, index) => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;

            // This HTML matches the professional design in your style.css
            const cartItemHTML = `
                <div class="cart-item">
                    <div class="cart-item-image">
                        <img src="${item.imageUrl}" alt="${item.name}">
                    </div>
                    <div class="cart-item-details">
                        <h4>${item.name}</h4>
                        <p class="item-price">$${item.price.toFixed(2)}</p>
                        <div class="cart-item-actions">
                            <span>Qty: ${item.quantity}</span>
                            <button class="remove-btn" data-index="${index}">Remove</button>
                        </div>
                    </div>
                    <div class="cart-item-total">
                        $${itemTotal.toFixed(2)}
                    </div>
                </div>
            `;
            cartItemsList.innerHTML += cartItemHTML;
        });

        const taxes = subtotal * TAX_RATE;
        const total = subtotal + taxes;

        // Update the summary section with calculated totals
        summarySubtotal.textContent = `$${subtotal.toFixed(2)}`;
        summaryTaxes.textContent = `$${taxes.toFixed(2)}`;
        summaryTotal.textContent = `$${total.toFixed(2)}`;
        
        // Disable the checkout button if the cart is empty
        if (checkoutBtn) {
            checkoutBtn.disabled = cart.length === 0;
        }

        addRemoveListeners();
    }

    /**
     * Adds event listeners to all "Remove" buttons.
     */
    function addRemoveListeners() {
        document.querySelectorAll('.remove-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const indexToRemove = parseInt(event.target.dataset.index);
                removeItemFromCart(indexToRemove);
            });
        });
    }

    /**
     * Removes an item from the cart array and updates localStorage.
     * @param {number} index - The index of the item to remove.
     */
    function removeItemFromCart(index) {
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        cart.splice(index, 1); // Remove the item
        localStorage.setItem('cart', JSON.stringify(cart));
        
        // Notify other parts of the app (like the header count) that the cart has changed
        document.dispatchEvent(new CustomEvent('cartUpdated'));

        renderCart(); // Re-render the cart page with the item removed
    }

    // Listen for cart updates that might happen on other pages
    document.addEventListener('cartUpdated', renderCart);

    // Initial render when the page loads
    renderCart();
});