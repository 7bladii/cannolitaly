document.addEventListener('DOMContentLoaded', () => {
    // Ensure Firebase is initialized before continuing
    if (typeof firebase === 'undefined') {
        console.error("Firebase is not loaded. Make sure the Firebase scripts are included in your HTML.");
        return;
    }
    const db = firebase.firestore();

    // Get elements from the DOM
    const summaryItems = document.getElementById('summary-items');
    const summaryTotalEl = document.getElementById('summary-total');
    const checkoutForm = document.getElementById('checkout-form');
    
    // Check if essential elements exist
    if (!summaryItems || !summaryTotalEl || !checkoutForm) {
        console.error("One or more checkout elements are missing from the page.");
        return;
    }

    // Load cart from localStorage
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const placeOrderBtn = checkoutForm.querySelector('button[type="submit"]');

    /**
     * Renders the order summary based on items in the cart.
     */
    function renderSummary() {
        if (cart.length === 0) {
            summaryItems.innerHTML = '<p>Your cart is empty.</p>';
            if (placeOrderBtn) {
                placeOrderBtn.disabled = true; // Disable button if cart is empty
                placeOrderBtn.textContent = 'Cart is Empty';
            }
            return;
        }

        summaryItems.innerHTML = '';
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        cart.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'summary-item';
            const flavors = item.flavors && item.flavors.length > 0 ? ` <small>(${item.flavors.join(', ')})</small>` : '';
            
            itemDiv.innerHTML = `
                <span>${item.quantity} x ${item.name}${flavors}</span>
                <span>$${(item.price * item.quantity).toFixed(2)}</span>
            `;
            summaryItems.appendChild(itemDiv);
        });

        summaryTotalEl.textContent = `$${total.toFixed(2)}`;
    }

    /**
     * Handles the form submission to place an order.
     */
    checkoutForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        placeOrderBtn.textContent = 'Placing Order...';
        placeOrderBtn.disabled = true;
        
        // This object structure matches what your admin panel expects
        const orderData = {
            customerName: document.getElementById('customer-name').value,
            customerEmail: document.getElementById('customer-email').value,
            customerPhone: document.getElementById('customer-phone').value,
            customerAddress: document.getElementById('customer-address').value,
            items: cart,
            total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            status: 'Pending', // Default status for new orders
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            // Save the order to the 'orders' collection in Firestore
            await db.collection('orders').add(orderData);
            
            // Clear the cart from local storage after successful order
            localStorage.removeItem('cart');
            
            // Redirect to the confirmation page
            window.location.href = 'confirmation.html';

        } catch (error) {
            console.error("Error placing order:", error);
            alert("There was an error placing your order. Please try again.");
            placeOrderBtn.textContent = 'Place Order';
            placeOrderBtn.disabled = false;
        }
    });

    // Initial render of the summary when the page loads
    renderSummary();
});