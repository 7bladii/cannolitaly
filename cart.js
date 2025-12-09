let cart = [];

// --- VARIABLES GLOBALES PARA PROPINAS ---
let currentSubtotal = 0;
let currentTipAmount = 0;

// --- UTILIDADES ---

function showToast(message) {
    const toast = document.getElementById('toast-notification');
    if (!toast) {
        alert(message);
        return;
    }
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// --- GESTIÓN DEL CARRITO (CORE) ---

function loadCart() {
    const cartData = localStorage.getItem('cannolitalyCart');
    cart = cartData ? JSON.parse(cartData) : [];
    updateCartDisplay();
}

function saveCart() {
    localStorage.setItem('cannolitalyCart', JSON.stringify(cart));
    document.dispatchEvent(new CustomEvent('cartUpdated'));
}

function addToCart(newItem) {
    const existingItemIndex = cart.findIndex(item => item.id === newItem.id && item.size === newItem.size);

    if (existingItemIndex > -1) {
        const existingItem = cart[existingItemIndex];
        existingItem.totalQuantity += newItem.totalQuantity;
        
        for (const flavor in newItem.flavors) {
            if (existingItem.flavors[flavor]) {
                existingItem.flavors[flavor] += newItem.flavors[flavor];
            } else {
                existingItem.flavors[flavor] = newItem.flavors[flavor];
            }
        }
    } else {
        cart.push(newItem);
    }

    saveCart();
    updateCartDisplay(); 
    showToast(`${newItem.totalQuantity} cannoli added to cart!`);
}

// --- ACTUALIZACIÓN DE INTERFAZ (UI) ---

function updateCartDisplay() {
    updateCartIconCount();
    if (document.getElementById('cart-items-container')) {
        updateCartPage();
    }
}

function updateCartIconCount() {
    const cartCountEl = document.querySelector('.cart-count');
    if (!cartCountEl) return;
    
    const totalItems = cart.reduce((sum, item) => sum + item.totalQuantity, 0);
    
    cartCountEl.textContent = totalItems;
    cartCountEl.style.display = totalItems > 0 ? 'flex' : 'none';
}

function updateCartPage() {
    const cartItemsContainer = document.getElementById('cart-items-container');
    if (!cartItemsContainer) return;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="empty-cart" style="text-align: center; padding: 40px;">
                <h3>Your cart is empty.</h3>
                <a href="shop.html" class="btn" style="margin-top: 1rem; display: inline-block;">Continue Shopping</a>
            </div>
        `;
        const orderSummary = document.querySelector('.cart-summary-column');
        if(orderSummary) orderSummary.style.display = 'none';
        return;
    } else {
        const orderSummary = document.querySelector('.cart-summary-column');
        if(orderSummary) orderSummary.style.display = 'block';
    }

    let cartHTML = '';
    let subtotal = 0;

    cart.forEach(item => {
        const flavorsBreakdown = Object.entries(item.flavors)
            .map(([flavor, qty]) => `
                <li class="cart-flavor-item" style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span>${flavor}</span>
                    <input 
                        type="number" 
                        class="flavor-qty-input-cart" 
                        value="${qty}" 
                        min="0"
                        data-item-id="${item.id}"
                        data-flavor-name="${flavor}"
                        style="width: 50px; padding: 2px;"
                    >
                </li>
            `)
            .join('');

        const itemTotal = item.totalQuantity * item.pricePer;
        subtotal += itemTotal;

        cartHTML += `
            <div class="cart-item" style="border-bottom: 1px solid #eee; padding: 20px 0; display: flex; gap: 20px;">
                <div class="cart-item-image">
                    <img src="${item.imageUrl || 'images/placeholder.jpg'}" alt="${item.name}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px;">
                </div>
                <div class="cart-item-details" style="flex: 1;">
                    <h4 style="margin: 0 0 10px 0;">${item.name} (${item.size})</h4>
                    <ul class="flavor-breakdown-editable" style="list-style: none; padding: 0; font-size: 0.9em; color: #555;">
                        ${flavorsBreakdown}
                    </ul>
                </div>
                <div class="cart-item-actions-total" style="text-align: right; display: flex; flex-direction: column; justify-content: space-between;">
                    <button class="delete-item-btn-cart" data-item-id="${item.id}" style="background: none; border: none; cursor: pointer; color: #ff4444; font-size: 1.2rem;" title="Remove Item">🗑️</button>
                    <div class="cart-item-total">
                        <p style="margin: 5px 0; font-size: 0.9rem;">Total Qty: ${item.totalQuantity}</p>
                        <strong style="font-size: 1.1rem;">$${itemTotal.toFixed(2)}</strong>
                    </div>
                </div>
            </div>
        `;
    });

    cartItemsContainer.innerHTML = cartHTML;
    
    // --- ACTUALIZACIÓN DE TOTALES Y PROPINAS ---
    currentSubtotal = subtotal; // Guardamos subtotal globalmente para calcular porcentajes

    const subtotalEl = document.getElementById('cart-subtotal');
    if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    
    // Recalcular total final (incluyendo propina si ya estaba seleccionada)
    recalculateTotal();
}

// --- LÓGICA DE PROPINAS (NUEVO) ---

// Esta función se llama desde el HTML onclick="selectTip(...)"
window.selectTip = function(percentage, btnElement) {
    // 1. Actualizar estilos de los botones (Visual)
    const buttons = document.querySelectorAll('.tip-btn');
    buttons.forEach(btn => {
        btn.classList.remove('active');
        // Resetear estilos inline
        btn.style.background = '#fff';
        btn.style.color = '#333';
        btn.style.border = '1px solid #ddd';
    });
    
    // Activar el botón clicado
    if(btnElement) {
        btnElement.classList.add('active');
        btnElement.style.background = '#333';
        btnElement.style.color = '#fff';
        btnElement.style.border = '1px solid #333';
    }

    // 2. Calcular la propina (Matemáticas)
    currentTipAmount = currentSubtotal * percentage;

    // 3. Mostrar/Ocultar la línea de propina en el resumen
    const tipDisplay = document.getElementById('tip-amount-display');
    const tipValue = document.getElementById('tip-value');
    
    if (percentage > 0) {
        if(tipDisplay) tipDisplay.style.display = 'block';
        if(tipValue) tipValue.textContent = `$${currentTipAmount.toFixed(2)}`;
    } else {
        if(tipDisplay) tipDisplay.style.display = 'none';
    }

    // 4. Actualizar el Total Final
    recalculateTotal();
};

function recalculateTotal() {
    const totalEl = document.getElementById('cart-total');
    const finalTotal = currentSubtotal + currentTipAmount;
    if (totalEl) totalEl.textContent = `$${finalTotal.toFixed(2)}`;
}

// --- MANEJO DE EVENTOS (INTERACCIÓN) ---

function handleCartPageUpdate(event) {
    const target = event.target;

    // Botón Eliminar
    if (target.classList.contains('delete-item-btn-cart') || target.closest('.delete-item-btn-cart')) {
        const btn = target.classList.contains('delete-item-btn-cart') ? target : target.closest('.delete-item-btn-cart');
        const itemId = btn.dataset.itemId;
        
        const itemIndex = cart.findIndex(item => item.id === itemId);
        if (itemIndex > -1) {
            cart.splice(itemIndex, 1);
            saveCart();
            updateCartPage();
            updateCartIconCount();
            
            // ⚠️ IMPORTANTE: Si cambia el carrito, reseteamos la propina a 0 para evitar errores matemáticos
            resetTipToZero();
        }
    }

    // Cambio en Inputs de cantidad
    if (target.classList.contains('flavor-qty-input-cart')) {
        const itemId = target.dataset.itemId;
        const flavorName = target.dataset.flavorName;
        const newQuantity = parseInt(target.value, 10);

        const item = cart.find(i => i.id === itemId);
        if (item) {
            if (!isNaN(newQuantity) && newQuantity > 0) {
                item.flavors[flavorName] = newQuantity;
            } else {
                delete item.flavors[flavorName];
            }

            item.totalQuantity = Object.values(item.flavors).reduce((sum, qty) => sum + qty, 0);

            if (item.totalQuantity === 0) {
                const itemIndex = cart.findIndex(i => i.id === itemId);
                if (itemIndex > -1) {
                    cart.splice(itemIndex, 1);
                }
            }
            saveCart();
            updateCartPage();
            updateCartIconCount();
            
            // ⚠️ Reseteamos propina si cambia el subtotal
            resetTipToZero();
        }
    }
}

// Helper para resetear propina visual y lógicamente
function resetTipToZero() {
    currentTipAmount = 0;
    const buttons = document.querySelectorAll('.tip-btn');
    
    // Resetear estilos visuales
    buttons.forEach(btn => {
        btn.classList.remove('active');
        btn.style.background = '#fff';
        btn.style.color = '#333';
        btn.style.border = '1px solid #ddd';
    });

    // Buscamos el botón de "No" (el último) y lo activamos visualmente
    if(buttons.length > 0) {
        const noTipBtn = buttons[buttons.length - 1]; 
        const tipDisplay = document.getElementById('tip-amount-display');

        noTipBtn.classList.add('active');
        noTipBtn.style.background = '#333';
        noTipBtn.style.color = '#fff';
        noTipBtn.style.border = '1px solid #333';
        
        if(tipDisplay) tipDisplay.style.display = 'none';
    }
    
    recalculateTotal();
}

// --- LÓGICA DE PAGO CON STRIPE (BACKEND) ---

async function initiateCheckout() {
    const checkoutBtn = document.getElementById('checkout-btn');
    if (!checkoutBtn) return;

    const originalText = checkoutBtn.innerText;
    checkoutBtn.disabled = true;
    checkoutBtn.innerText = "Processing to Stripe...";

    try {
        // 1. Preparar items
        const itemsToBuy = cart.map(item => ({
            name: `Sicilian Cannoli (${item.size})`, 
            
            image: item.imageUrl, 
            price: item.pricePer,
            quantity: item.totalQuantity,
            
            // Descripción limpia para Stripe
            description: "Freshly filled Sicilian Cannoli",
            
            // Enviamos los sabores SOLO al backend (ocultos en la UI de pago)
            // para que lleguen al email.
            flavors: item.flavors 
        }));

        // 2. Enviar a Firebase (Incluyendo la propina)
        const response = await fetch('https://us-central1-cannoli-f1d4d.cloudfunctions.net/createStripeSession', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                items: itemsToBuy,
                tipAmount: currentTipAmount // ENVIAMOS LA PROPINA AQUÍ
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Network response was not ok');
        }

        const session = await response.json();

        if (session.url) {
            window.location.href = session.url;
        } else {
            throw new Error('No session URL received');
        }

    } catch (error) {
        console.error("Checkout Error:", error);
        showToast("Unable to start checkout. Please try again.");
        checkoutBtn.disabled = false;
        checkoutBtn.innerText = originalText;
    }
}

// --- INICIALIZACIÓN ---

document.addEventListener('DOMContentLoaded', () => {
    loadCart();
    
    const cartItemsContainer = document.getElementById('cart-items-container');
    if (cartItemsContainer) {
        cartItemsContainer.addEventListener('change', handleCartPageUpdate);
        cartItemsContainer.addEventListener('click', handleCartPageUpdate);
    }

    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', initiateCheckout);
    }
});