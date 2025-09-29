document.addEventListener('DOMContentLoaded', () => {
    const cartItemsContainer = document.getElementById('cart-items');
    const subtotalElement = document.getElementById('subtotal');
    const taxesElement = document.getElementById('taxes');
    const totalElement = document.getElementById('total');

    let cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];

    const TAX_RATE = 0.095; // 9.5% tax rate

    const updateCart = () => {
        if (!cartItemsContainer) return; // Safety check

        cartItemsContainer.innerHTML = '';
        let subtotal = 0;

        // If cart is empty, show a message and zero out the summary
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">Your cart is empty.</td></tr>';
            subtotalElement.textContent = '$0.00';
            taxesElement.textContent = '$0.00';
            totalElement.textContent = '$0.00';
            return;
        }

        cart.forEach((item, index) => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;

            const row = document.createElement('tr');
            // MODIFIED: This now includes the product image next to the name.
            row.innerHTML = `
                <td>
                    <div style="display: flex; align-items: center;">
                        <img src="${item.imageUrl}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; margin-right: 15px; border-radius: 4px;">
                        <span>${item.name}</span>
                    </div>
                </td>
                <td>$${item.price.toFixed(2)}</td>
                <td>${item.quantity}</td>
                <td>$${itemTotal.toFixed(2)}</td>
                <td><button class="remove-btn" data-index="${index}" style="background: none; border: none; color: #dc3545; cursor: pointer; font-size: 1.5em; font-weight: bold;">&times;</button></td>
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
        // Use .closest() to ensure the button is found even if the user clicks an element inside it
        const removeButton = event.target.closest('.remove-btn');
        if (removeButton) {
            const index = removeButton.dataset.index;
            cart.splice(index, 1); // Remove item from array
            localStorage.setItem('shoppingCart', JSON.stringify(cart)); // Update storage
            updateCart(); // Re-render the cart
        }
    });

    updateCart();
});

