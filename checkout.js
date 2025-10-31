// checkout.js - Updated with Delete and Edit Functionality

document.addEventListener('DOMContentLoaded', () => {
    if (typeof cart === 'undefined' || typeof saveCart === 'undefined') {
        console.error("Cart functions are not available. Make sure cart.js is loaded.");
        displayEmptyCheckout();
        return;
    }

    const summaryContainer = document.getElementById('checkout-summary-container');
    const totalEl = document.getElementById('checkout-total');
    const placeOrderBtn = document.getElementById('place-order-btn');
    const checkoutForm = document.getElementById('checkout-form');

    // --- MODIFICADO: La función principal para renderizar el resumen ahora es interactiva ---
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

            // --- MODIFICADO: Genera inputs para cada sabor en lugar de texto ---
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

            // --- MODIFICADO: Agrega un botón para eliminar el item principal ---
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

    // --- NUEVO: Lógica para manejar las actualizaciones y eliminaciones ---
    function handleCartUpdate(event) {
        const target = event.target;

        // Caso 1: Se hizo clic en un botón de eliminar
        if (target.classList.contains('delete-item-btn')) {
            const itemId = target.dataset.itemId;
            const itemIndex = cart.findIndex(item => item.id === itemId);
            
            if (itemIndex > -1) {
                cart.splice(itemIndex, 1); // Elimina el item del array del carrito
                saveCart(); // Guarda el carrito actualizado en localStorage
                renderCheckoutSummary(); // Vuelve a dibujar el resumen
            }
        }

        // Caso 2: Se cambió la cantidad de un sabor
        if (target.classList.contains('flavor-qty-input')) {
            const itemId = target.dataset.itemId;
            const flavorName = target.dataset.flavorName;
            const newQuantity = parseInt(target.value, 10);

            const item = cart.find(i => i.id === itemId);

            if (item) {
                if (newQuantity > 0) {
                    item.flavors[flavorName] = newQuantity;
                } else {
                    // Si la cantidad es 0, elimina el sabor
                    delete item.flavors[flavorName];
                }

                // Recalcular la cantidad total del item
                item.totalQuantity = Object.values(item.flavors).reduce((sum, qty) => sum + qty, 0);

                // Si un item se queda sin sabores, elimínalo del carrito
                if (item.totalQuantity === 0) {
                    const itemIndex = cart.findIndex(i => i.id === itemId);
                    if (itemIndex > -1) {
                        cart.splice(itemIndex, 1);
                    }
                }
                
                saveCart();
                renderCheckoutSummary();
            }
        }
    }

    // Agrega un solo event listener al contenedor para manejar todos los clics y cambios
    summaryContainer.addEventListener('click', handleCartUpdate);
    summaryContainer.addEventListener('change', handleCartUpdate);


    // --- Lógica del Formulario de Envío (¡CON LA SOLUCIÓN APLICADA!) ---
    checkoutForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (cart.length === 0) {
            alert("Your cart is empty.");
            return;
        }

        placeOrderBtn.textContent = 'Placing Order...';
        placeOrderBtn.disabled = true;

        // --- INICIO DE LA SOLUCIÓN ---
        // "Limpiamos" el carrito para asegurarnos de que no hay valores 'undefined'
        // que Firebase pueda rechazar silenciosamente.
        const sanitizedItems = cart.map(item => {
            return {
                id: item.id || '',
                name: item.name || 'Producto sin nombre',
                size: item.size || 'N/A',
                flavors: item.flavors || {},
                totalQuantity: item.totalQuantity || 0,
                pricePer: item.pricePer || 0,
                imageUrl: item.imageUrl || '' // Aseguramos que imageUrl no sea undefined
            };
        });
        // --- FIN DE LA SOLUCIÓN ---

        const orderData = {
            customerName: document.getElementById('customer-name').value,
            customerEmail: document.getElementById('customer-email').value,
            customerPhone: document.getElementById('customer-phone').value,
            customerAddress: document.getElementById('customer-address').value,
            customerAddress2: document.getElementById('customer-address-2').value,
            
            // ¡Usamos el array "limpio" en lugar del original!
            items: sanitizedItems, 
            
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

    // --- RENDER INICIAL ---
    renderCheckoutSummary();
});