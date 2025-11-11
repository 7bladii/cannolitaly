// checkout.js - Updated with Flatpickr AND Email Confirmation logic

document.addEventListener('DOMContentLoaded', () => {
    if (typeof cart === 'undefined' || typeof saveCart === 'undefined') {
        console.error("Cart functions are not available. Make sure cart.js is loaded.");
        displayEmptyCheckout();
        return;
    }

    // --- DOM Selectors ---
    const summaryContainer = document.getElementById('checkout-summary-container');
    const totalEl = document.getElementById('checkout-total');
    const placeOrderBtn = document.getElementById('place-order-btn');
    const checkoutForm = document.getElementById('checkout-form');
    const deliveryInput = document.getElementById('delivery-date');

    // --- NEW: Initialize Flatpickr professional calendar ---
    if (deliveryInput) {
        flatpickr(deliveryInput, { // Use the variable you already defined
            "allowInput": true,
            "disableMobile": true,
            "enableTime": false,      // 1. Disable time picker
            "dateFormat": "m/d/Y",    // 2. Date format (e.g., 11/05/2025)
            
            // 3. Set minimum date to 2 days from today (based on your rule)
            "minDate": new Date().fp_incr(2), 
        });
    }
    // --- End of Flatpickr initialization ---


    // --- Your function to render the summary ---
    function renderCheckoutSummary() {
        if (cart.length === 0) {
            displayEmptyCheckout();
            return;
        }

        let summaryHTML = '';
        let subtotal = 0;

        cart.forEach(item => {
            // --- FIX (1/2)! ---
            // "Safe" calculation for subtotal
            const quantity = item.totalQuantity || 0;
            const price = item.pricePer || 0;
            const itemTotal = quantity * price;
            // --- End of Fix ---
            
            subtotal += itemTotal;

            const flavorsBreakdown = Object.entries(item.flavors)
                .map(([flavor, qty]) => `
                    <li class="flavor-edit-item">
                        <span>${qty}x ${flavor}</span>
                        <input 
                            type="number" 
                            class="flavor-qty-input" 
                            value="${qty}" 
                            min="0"
                            data-item-id="${item.id}"
                            data-flavor-name="${flavor}"
                        >
                    </li>
                `)
                .join('');

            summaryHTML += `
                <div class="summary-item">
                    <div class="summary-item-header">
                        <p>${item.totalQuantity}x ${item.name} (${item.size})</p>
                        <div class="summary-item-controls">
                            <span class="item-total-price">$${itemTotal.toFixed(2)}</span>
                            <button class="delete-item-btn" data-item-id="${item.id}">🗑️</button>
                        </div>
                    </div>
                    <ul class="flavor-edit-list">${flavorsBreakdown}</ul>
                </div>
            `;
        });

        summaryContainer.innerHTML = summaryHTML;
        totalEl.textContent = `$${subtotal.toFixed(2)}`;
        placeOrderBtn.textContent = `Place Order ($${subtotal.toFixed(2)})`;
        placeOrderBtn.disabled = false;
    }

    function displayEmptyCheckout() {
        if (summaryContainer) summaryContainer.innerHTML = "<p>Your cart is empty.</p>";
        if (totalEl) totalEl.textContent = "$0.00";
        if (placeOrderBtn) {
            placeOrderBtn.textContent = "Cart is Empty";
            placeOrderBtn.disabled = true;
        }
    }

    // --- Your logic for updates and deletions (no changes) ---
    function handleCartUpdate(event) {
        const target = event.target;

        if (target.classList.contains('delete-item-btn')) {
            const itemId = target.dataset.itemId;
            const itemIndex = cart.findIndex(item => item.id === itemId);
            if (itemIndex > -1) {
                cart.splice(itemIndex, 1);
                saveCart(); 
                renderCheckoutSummary();
            }
        }
        if (target.classList.contains('flavor-qty-input')) {
            const itemId = target.dataset.itemId;
            const flavorName = target.dataset.flavorName;
            const newQuantity = parseInt(target.value, 10);
            const item = cart.find(i => i.id === itemId);
            if (item) {
                if (newQuantity > 0) {
                    item.flavors[flavorName] = newQuantity;
                } else {
                    delete item.flavors[flavorName];
                }
                item.totalQuantity = Object.values(item.flavors).reduce((sum, qty) => sum + qty, 0);
                if (item.totalQuantity === 0) {
                    const itemIndex = cart.findIndex(i => i.id === itemId);
                    if (itemIndex > -1) cart.splice(itemIndex, 1);
                }
                saveCart();
                renderCheckoutSummary();
            }
        }
    }

    summaryContainer.addEventListener('click', handleCartUpdate);
    summaryContainer.addEventListener('change', handleCartUpdate);


    // --- DATE LOGIC (REMOVED) ---
    // The setMinDeliveryDate() function was removed
    // Flatpickr handles this now.


    // --- Form Submission Logic (Merged) ---
    checkoutForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (cart.length === 0) {
            alert("Your cart is empty.");
            return;
        }

        placeOrderBtn.textContent = 'Placing Order...';
        placeOrderBtn.disabled = true;

        const sanitizedItems = cart.map(item => {
            return {
                id: item.id || '',
                name: item.name || 'Untitled Product', // <-- Translated
                size: item.size || 'N/A',
                flavors: item.flavors || {},
                totalQuantity: item.totalQuantity || 0,
                pricePer: item.pricePer || 0,
                imageUrl: item.imageUrl || ''
            };
        });
        
        const deliveryDateValue = deliveryInput.value;
        if (!deliveryDateValue) {
            alert('Please select a delivery date.'); // <-- Translated
            placeOrderBtn.textContent = 'Place Order';
            placeOrderBtn.disabled = false;
            return;
        }
        
        // This line still works because new Date()
        // can parse the "m/d/Y" format generated by Flatpickr.
        const deliveryDateTime = firebase.firestore.Timestamp.fromDate(new Date(deliveryDateValue));

        // --- FIX (2/2)! ---
        // "Safe" calculation for the Firebase total
        const safeTotal = cart.reduce((sum, item) => {
            const quantity = item.totalQuantity || 0; // Treat undefined as 0
            const price = item.pricePer || 0;       // Treat undefined as 0
            return sum + (quantity * price);
        }, 0); // Start at 0
        // --- End of Fix ---

        const orderData = {
            customerName: document.getElementById('customer-name').value,
            customerEmail: document.getElementById('customer-email').value,
            customerPhone: document.getElementById('customer-phone').value,
            customerAddress: document.getElementById('customer-address').value,
            customerAddress2: document.getElementById('customer-address-2').value,
            items: sanitizedItems, 
            
            total: safeTotal, // <-- We use the safe total
            
            status: 'Pending',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            deliveryDateTime: deliveryDateTime
        };

        // --- ✅ MODIFIED TRY/CATCH BLOCK FOR EMAIL ---
        try {
            const db = firebase.firestore();
            
            // 1. Guarda la orden y obtén la referencia
            const orderRef = await db.collection('orders').add(orderData);

            // 2. Prepara el email para el CLIENTE (HTML in English)
            const emailContent = {
                to: [orderData.customerEmail],
                message: {
                    subject: `Your order is confirmed! (ID: ${orderRef.id})`,
                    html: `
                        <h1>Thank you for your order, ${orderData.customerName}!</h1>
                        <p>We have received your order and are processing it.</p>
                        <p><strong>Order Number:</strong> ${orderRef.id}</p>
                        <p><strong>Total:</strong> $${orderData.total.toFixed(2)}</p>
                        <p>We will contact you soon with more details about your delivery.</p>
                        <br>
                        <p>- The Cannolitaly Team</p>
                    `
                }
            };

            // 3. Guarda el email del CLIENTE en la colección 'mail'
            await db.collection('mail').add(emailContent);
            
            // --- ⬇️ NUEVO BLOQUE PARA EL ADMIN ⬇️ ---
            
            // 4. Prepara el email para el ADMIN
            const adminEmailContent = {
                // ⚠️ CAMBIA ESTO por tu correo de administrador
                to: ['cannolitali@gmail.com'], 
                message: {
                    subject: `¡Nuevo Pedido en Cannolitaly! - ID: ${orderRef.id}`,
                    html: `
                        <h1>¡Has recibido un nuevo pedido!</h1>
                        <p><strong>ID de Pedido:</strong> ${orderRef.id}</p>
                        <p><strong>Cliente:</strong> ${orderData.customerName}</p>
                        <p><strong>Email:</strong> ${orderData.customerEmail}</p>
                        <p><strong>Teléfono:</strong> ${orderData.customerPhone}</p>
                        <p><strong>Dirección:</strong> ${orderData.customerAddress} ${orderData.customerAddress2 || ''}</p>
                        <p><strong>Fecha de Entrega:</strong> ${deliveryDateValue}</p>
                        <hr>
                        <h2>Total: $${orderData.total.toFixed(2)}</h2>
                        <br>
                        <p>Ingresa al panel de admin para gestionarlo.</p>
                    `
                }
            };

            // 5. Guarda el email del ADMIN en la colección 'mail'
            await db.collection('mail').add(adminEmailContent);

            // --- ⬆️ FIN DEL BLOQUE PARA EL ADMIN ⬆️ ---
            
            // 6. Limpia el carrito y redirige (como antes)
            localStorage.removeItem('cannolitalyCart');
            window.location.href = 'confirmation.html';

        } catch (error) {
            console.error("Error placing order or sending email:", error);
            alert("There was an error placing your order. Please try again.");
            placeOrderBtn.textContent = 'Place Order';
            placeOrderBtn.disabled = false;
        }
    });

    // --- INITIAL RENDER ---
    renderCheckoutSummary();
    // setMinDeliveryDate(); // <-- This line was removed
});