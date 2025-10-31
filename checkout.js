// checkout.js - Corregido para evitar error de 'NaN' en el total

document.addEventListener('DOMContentLoaded', () => {
    if (typeof cart === 'undefined' || typeof saveCart === 'undefined') {
        console.error("Cart functions are not available. Make sure cart.js is loaded.");
        displayEmptyCheckout();
        return;
    }

    // --- Selectores del DOM ---
    const summaryContainer = document.getElementById('checkout-summary-container');
    const totalEl = document.getElementById('checkout-total');
    const placeOrderBtn = document.getElementById('place-order-btn');
    const checkoutForm = document.getElementById('checkout-form');
    const deliveryInput = document.getElementById('delivery-date');


    // --- Tu función para renderizar el resumen ---
    function renderCheckoutSummary() {
        if (cart.length === 0) {
            displayEmptyCheckout();
            return;
        }

        let summaryHTML = '';
        let subtotal = 0;

        cart.forEach(item => {
            // --- ¡CORRECCIÓN (1/2)! ---
            // Cálculo "seguro" para el subtotal
            const quantity = item.totalQuantity || 0;
            const price = item.pricePer || 0;
            const itemTotal = quantity * price;
            // --- Fin de la Corrección ---
            
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

    // --- Tu lógica para manejar actualizaciones y eliminaciones (sin cambios) ---
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

    // --- LÓGICA DE FECHA (sin cambios) ---
    function setMinDeliveryDate() {
        if (!deliveryInput) return;
        const today = new Date();
        const minDate = new Date(today.setDate(today.getDate() + 2)); 
        minDate.setHours(9, 0, 0, 0); 
        const year = minDate.getFullYear();
        const month = (minDate.getMonth() + 1).toString().padStart(2, '0');
        const day = minDate.getDate().toString().padStart(2, '0');
        const hours = minDate.getHours().toString().padStart(2, '0');
        const minutes = minDate.getMinutes().toString().padStart(2, '0');
        const minDateTimeString = `${year}-${month}-${day}T${hours}:${minutes}`;
        deliveryInput.min = minDateTimeString;
        deliveryInput.value = minDateTimeString;
    }

    // --- Lógica del Formulario de Envío (Fusionada) ---
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
                name: item.name || 'Producto sin nombre',
                size: item.size || 'N/A',
                flavors: item.flavors || {},
                totalQuantity: item.totalQuantity || 0,
                pricePer: item.pricePer || 0,
                imageUrl: item.imageUrl || ''
            };
        });
        
        const deliveryDateValue = deliveryInput.value;
        if (!deliveryDateValue) {
            alert('Por favor, selecciona una fecha y hora de entrega.');
            placeOrderBtn.textContent = 'Place Order';
            placeOrderBtn.disabled = false;
            return;
        }
        const deliveryDateTime = firebase.firestore.Timestamp.fromDate(new Date(deliveryDateValue));

        // --- ¡CORRECCIÓN (2/2)! ---
        // Cálculo "seguro" del total para Firebase
        const safeTotal = cart.reduce((sum, item) => {
            const quantity = item.totalQuantity || 0; // Trata undefined como 0
            const price = item.pricePer || 0;       // Trata undefined como 0
            return sum + (quantity * price);
        }, 0); // Inicia en 0
        // --- Fin de la Corrección ---

        const orderData = {
            customerName: document.getElementById('customer-name').value,
            customerEmail: document.getElementById('customer-email').value,
            customerPhone: document.getElementById('customer-phone').value,
            customerAddress: document.getElementById('customer-address').value,
            customerAddress2: document.getElementById('customer-address-2').value,
            items: sanitizedItems, 
            
            total: safeTotal, // <-- Usamos el total seguro en lugar del cálculo anterior
            
            status: 'Pending',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            deliveryDateTime: deliveryDateTime
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
    setMinDeliveryDate(); 
});