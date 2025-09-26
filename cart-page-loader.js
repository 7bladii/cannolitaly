document.addEventListener('DOMContentLoaded', () => {
    const cartItemsContainer = document.getElementById('cart-items');
    const subtotalElement = document.getElementById('subtotal');
    const taxesElement = document.getElementById('taxes');
    const totalElement = document.getElementById('total');

    let cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];

    const TAX_RATE = 0.095; // 9.5% tax rate

    const updateCart = () => {
        cartItemsContainer.innerHTML = '';
        let subtotal = 0;

        cart.forEach((item, index) => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.name}</td>
                <td>$${item.price.toFixed(2)}</td>
                <td>${item.quantity}</td>
                <td>$${itemTotal.toFixed(2)}</td>
                <td><button class="remove-btn" data-index="${index}">Remove</button></td>
            `;
            cartItemsContainer.appendChild(row);
        });

        const taxes = subtotal * TAX_RATE;
        const total = subtotal + taxes;

        subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
        taxesElement.textContent = `$${taxes.toFixed(2)}`;
        totalElement.textContent = `$${total.toFixed(2)}`;
    };

    cartItemsContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('remove-btn')) {
            const index = event.target.dataset.index;
            cart.splice(index, 1);
            localStorage.setItem('shoppingCart', JSON.stringify(cart));
            updateCart();
        }
    });

    updateCart();
});