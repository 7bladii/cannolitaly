// cart.js - MODIFICADO para permitir editar y eliminar items desde el carrito

let cart = [];

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

function updateCartDisplay() {
    updateCartIconCount();
    updateCartPage(); 
}

function updateCartIconCount() {
    const cartCountEl = document.querySelector('.cart-count');
    if (!cartCountEl) return;
    
    const totalItems = cart.reduce((sum, item) => sum + item.totalQuantity, 0);
    
    cartCountEl.textContent = totalItems;
    cartCountEl.style.display = totalItems > 0 ? 'flex' : 'none';
}

// --- MODIFICADO: Esta es la función principal que actualizamos ---
function updateCartPage() {
    const cartItemsContainer = document.getElementById('cart-items-container');
    if (!cartItemsContainer) return;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="empty-cart">
                <h3>Your cart is empty.</h3>
                <a href="shop.html" class="btn">Continue Shopping</a>
            </div>
        `;
        // Ocultar resumen si el carrito está vacío
        const orderSummary = document.querySelector('.order-summary');
        if(orderSummary) orderSummary.style.display = 'none';
        return;
    } else {
        const orderSummary = document.querySelector('.order-summary');
        if(orderSummary) orderSummary.style.display = 'block';
    }

    let cartHTML = '';
    let subtotal = 0;

    cart.forEach(item => {
        // Genera inputs editables para cada sabor
        const flavorsBreakdown = Object.entries(item.flavors)
            .map(([flavor, qty]) => `
                <li class="cart-flavor-item">
                    <span>${flavor}</span>
                    <input 
                        type="number" 
                        class="flavor-qty-input-cart" 
                        value="${qty}" 
                        min="0"
                        data-item-id="${item.id}"
                        data-flavor-name="${flavor}"
                    >
                </li>
            `)
            .join('');

        const itemTotal = item.totalQuantity * item.pricePer;
        subtotal += itemTotal;

        cartHTML += `
            <div class="cart-item">
                <div class="cart-item-image">
                    <img src="${item.imageUrl}" alt="${item.name}">
                </div>
                <div class="cart-item-details">
                    <h4>${item.name} (${item.size})</h4>
                    <ul class="flavor-breakdown-editable">${flavorsBreakdown}</ul>
                </div>
                <div class="cart-item-actions-total">
                    <button class="delete-item-btn-cart" data-item-id="${item.id}">🗑️</button>
                    <div class="cart-item-total">
                        <p>Qty: ${item.totalQuantity}</p>
                        <strong>$${itemTotal.toFixed(2)}</strong>
                    </div>
                </div>
            </div>
        `;
    });

    cartItemsContainer.innerHTML = cartHTML;
    
    const subtotalEl = document.getElementById('cart-subtotal');
    const totalEl = document.getElementById('cart-total');
    if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `$${subtotal.toFixed(2)}`;
}


// --- NUEVO: Lógica para manejar la interactividad en la página del carrito ---
function handleCartPageUpdate(event) {
    const target = event.target;

    // Caso 1: Clic en el botón de eliminar
    if (target.classList.contains('delete-item-btn-cart')) {
        const itemId = target.dataset.itemId;
        const itemIndex = cart.findIndex(item => item.id === itemId);
        if (itemIndex > -1) {
            cart.splice(itemIndex, 1);
            saveCart();
            updateCartPage(); // Redibuja el carrito
        }
    }

    // Caso 2: Cambio en la cantidad de un sabor
    if (target.classList.contains('flavor-qty-input-cart')) {
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
                if (itemIndex > -1) {
                    cart.splice(itemIndex, 1);
                }
            }
            saveCart();
            updateCartPage();
        }
    }
}

// --- MODIFICADO: Agrega el listener al cargar la página ---
document.addEventListener('DOMContentLoaded', () => {
    loadCart();
    
    const cartItemsContainer = document.getElementById('cart-items-container');
    if (cartItemsContainer) {
        cartItemsContainer.addEventListener('click', handleCartPageUpdate);
        cartItemsContainer.addEventListener('change', handleCartPageUpdate);
    }
});