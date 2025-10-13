// checkout.js - Final Version with Address Line 2

document.addEventListener('DOMContentLoaded', () => {
    // Make sure cart.js is loaded and the global 'cart' variable exists
    if (typeof cart === 'undefined') {
        console.error("Cart data is not available. Make sure cart.js is loaded before checkout.js");
        displayEmptyCheckout();
        return;
    }

    // --- 1. GET DOM ELEMENTS ---
    const summaryContainer = document.getElementById('checkout-summary-container');
    const totalEl = document.getElementById('checkout-total');
    const placeOrderBtn = document.getElementById('place-order-btn');
    const checkoutForm = document.getElementById('checkout-form');

    // --- 2. RENDER THE ORDER SUMMARY ---
    function renderCheckoutSummary() {
        if (cart.length === 0) {
            displayEmptyCheckout();
            return;
        }

        let summaryHTML = '';
        let subtotal = 0;

        cart.forEach(item => {
            const itemTotal = item.totalQuantity * item.pricePer;
            subtotal += itemTotal;

            const flavorsBreakdown = Object.entries(item.flavors)
                .map(([flavor, qty]) => `<li style="font-size: 0.9em; color: #555;">${qty}x ${flavor}</li>`)
                .join('');

            summaryHTML += `
                <div class="summary-item" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
                    <div class="item-info">
                        <p style="margin: 0; font-weight: 500;">${item.totalQuantity}x ${item.name} (${item.size})</p>
                        <ul style="list-style-type: none; padding-left: 10px; margin-top: 5px; margin-bottom: 0;">${flavorsBreakdown}</ul>
                    </div>
                    <p style="margin: 0; font-weight: 500;">$${itemTotal.toFixed(2)}</p>
                </div>
            `;
        });

        summaryContainer.innerHTML = summaryHTML;
        totalEl.textContent = `$${subtotal.toFixed(2)}`;
        placeOrderBtn.textContent = `Place Order ($${subtotal.toFixed(2)})`;
        placeOrderBtn.disabled = false;
    }

    // --- 3. HANDLE EMPTY CART SCENARIO ---
    function displayEmptyCheckout() {
        if (summaryContainer) summaryContainer.innerHTML = "<p>Your cart is empty.</p>";
        if (totalEl) totalEl.textContent = "$0.00";
        if (placeOrderBtn) {
            placeOrderBtn.textContent = "Cart is Empty";
            placeOrderBtn.disabled = true;
        }
    }

    // --- 4. HANDLE FORM SUBMISSION ---
    checkoutForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (cart.length === 0) {
            alert("Your cart is empty. Please add items before placing an order.");
            return;
        }

        placeOrderBtn.textContent = 'Placing Order...';
        placeOrderBtn.disabled = true;

        const orderData = {
            customerName: document.getElementById('customer-name').value,
            customerEmail: document.getElementById('customer-email').value,
            customerPhone: document.getElementById('customer-phone').value,
            customerAddress: document.getElementById('customer-address').value,
            // --- CAMBIO: Guardamos la dirección 2 ---
            customerAddress2: document.getElementById('customer-address-2').value,
            items: cart,
            total: cart.reduce((sum, item) => sum + (item.totalQuantity * item.pricePer), 0),
            status: 'Pending',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            const db = firebase.firestore();
            await db.collection('orders').add(orderData);
            
            localStorage.removeItem('cannolitalyCart');
            
            window.location.href = 'confirmation.html';

        } catch (error) {
            console.error("Error placing order:", error);
            alert("There was an error placing your order. Please try again.");
            placeOrderBtn.textContent = 'Place Order';
            placeOrderBtn.disabled = false;
        }
    });

    // --- 5. INITIAL RENDER ---
    renderCheckoutSummary();
});