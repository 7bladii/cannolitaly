// cart.js - FINAL VERSION WITH TOAST NOTIFICATION

let cart = JSON.parse(localStorage.getItem('cart')) || [];

// --- NEW FUNCTION: Shows the toast notification ---
function showToast(message) {
    const toast = document.getElementById('toast-notification');
    if (!toast) return; // Don't run if the element doesn't exist

    toast.textContent = message;
    toast.classList.add('show');

    // After 3 seconds, remove the show class to fade it out
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000); // 3000 milliseconds = 3 seconds
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    document.dispatchEvent(new CustomEvent('cartUpdated'));
}

function addToCart(newItem) {
    // Sort flavors alphabetically to create a consistent ID
    const sortedFlavors = newItem.flavors.sort().join('-');
    const compositeId = `${newItem.id}_${newItem.size}_${sortedFlavors}`;

    const existingItem = cart.find(item => item.compositeId === compositeId);

    if (existingItem) {
        existingItem.quantity += newItem.quantity;
    } else {
        cart.push({ ...newItem, compositeId: compositeId });
    }
    
    saveCart();

    // --- KEY CHANGE: Replaced alert() with showToast() ---
    // A more professional message in English
    const message = `${newItem.name} (${newItem.size}) successfully added to cart!`;
    showToast(message);
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