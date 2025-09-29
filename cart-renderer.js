document.addEventListener('DOMContentLoaded', () => {
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];

    if (!cartItemsContainer) {
        console.error("Cart items container not found!");
        return;
    }

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p>Your cart is currently empty.</p>';
        return;
    }

    let total = 0;
    let cartHTML = `
        <style>
            .cart-item { display: flex; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 20px; }
            .cart-item-image { width: 80px; height: 80px; object-fit: cover; border-radius: 8px; margin-right: 20px; }
            .cart-item-info { flex-grow: 1; }
            .cart-item-info h4 { margin: 0 0 5px 0; }
            .cart-summary { text-align: right; margin-top: 30px; font-size: 1.2em; }
            .checkout-btn { margin-top: 20px; float: right; }
        </style>
    `;

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;

        cartHTML += `
            <div class="cart-item" data-product-id="${item.id}">
                <img src="${item.imageUrl}" alt="${item.name}" class="cart-item-image">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p>${item.quantity} x $${item.price.toFixed(2)}</p>
                </div>
                <p>$${itemTotal.toFixed(2)}</p>
            </div>
        `;
    });

    cartHTML += `
        <div class="cart-summary">
            <strong>Total: $${total.toFixed(2)}</strong>
        </div>
        <button class="btn checkout-btn">Checkout</button>
    `;

    cartItemsContainer.innerHTML = cartHTML;
});
