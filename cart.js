let cart = JSON.parse(localStorage.getItem('cart')) || [];

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    document.dispatchEvent(new CustomEvent('cartUpdated'));
}

function addToCart(newItem) {
    // Ordena los sabores alfabéticamente para que el ID sea consistente
    // y los une con un guion. Ej: "chocolate-pistachio"
    const sortedFlavors = newItem.flavors.sort().join('-');
    const compositeId = `${newItem.id}_${newItem.size}_${sortedFlavors}`;

    const existingItem = cart.find(item => item.compositeId === compositeId);

    if (existingItem) {
        // Si ya existe un item con la misma combinación de sabores, solo aumenta la cantidad
        existingItem.quantity += newItem.quantity;
    } else {
        // Si no, añade el nuevo item al carrito
        cart.push({ ...newItem, compositeId: compositeId });
    }
    
    saveCart();
    // La alerta ahora muestra todos los sabores seleccionados
    alert(`${newItem.quantity} x ${newItem.name} (${newItem.size}, ${newItem.flavors.join(', ')}) added to cart!`);
}

document.addEventListener('DOMContentLoaded', () => {
    const cartCountElement = document.querySelector('.cart-count');

    function updateCartCount() {
        if (!cartCountElement) return;
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCountElement.textContent = totalItems;
        cartCountElement.style.display = totalItems > 0 ? 'flex' : 'none';
    }

    document.addEventListener('cartUpdated', updateCartCount);
    updateCartCount();
});