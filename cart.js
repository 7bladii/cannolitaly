// cart.js - FINAL VERSION (Handles flavor objects and shows toast notifications)

let cart = [];

// --- 1. TOAST NOTIFICATION FUNCTION ---
function showToast(message) {
    const toast = document.getElementById('toast-notification');
    if (!toast) {
        // Fallback to alert if toast element is not on the page
        alert(message);
        return;
    }
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// --- 2. CORE CART FUNCTIONS ---

// Load cart from localStorage when the page starts
function loadCart() {
    const cartData = localStorage.getItem('cannolitalyCart');
    cart = cartData ? JSON.parse(cartData) : [];
    updateCartDisplay();
}

// Save cart to localStorage and notify other parts of the site
function saveCart() {
    localStorage.setItem('cannolitalyCart', JSON.stringify(cart));
    // This custom event lets the header cart icon update itself
    document.dispatchEvent(new CustomEvent('cartUpdated'));
}

// --- 3. ADD ITEM TO CART (CORRECTED LOGIC) ---
function addToCart(newItem) {
    // Find if an item with the same ID and size already exists
    const existingItemIndex = cart.findIndex(item => item.id === newItem.id && item.size === newItem.size);

    if (existingItemIndex > -1) {
        // If it exists, update the quantities
        const existingItem = cart[existingItemIndex];
        existingItem.totalQuantity += newItem.totalQuantity;

        // Merge the quantities of each flavor
        for (const flavor in newItem.flavors) {
            if (existingItem.flavors[flavor]) {
                existingItem.flavors[flavor] += newItem.flavors[flavor];
            } else {
                existingItem.flavors[flavor] = newItem.flavors[flavor];
            }
        }
    } else {
        // If it's a new item, add it to the cart
        // NO .sort() IS NEEDED, THIS FIXES THE ERROR
        cart.push(newItem);
    }

    saveCart();
    updateCartDisplay(); // Update all visual parts of the cart

    // Use the toast notification for a professional look
    showToast(`${newItem.totalQuantity} cannoli added to cart!`);
}

// --- 4. UPDATE ALL CART DISPLAYS ---
function updateCartDisplay() {
    updateCartIconCount();
    updateCartPage(); // This will render items on your cart.html
    // You can add a function for the cart preview dropdown here as well
}

function updateCartIconCount() {
    const cartCountEl = document.querySelector('.cart-count');
    if (!cartCountEl) return;
    
    const totalItems = cart.reduce((sum, item) => sum + item.totalQuantity, 0);
    
    cartCountEl.textContent = totalItems;
    cartCountEl.style.display = totalItems > 0 ? 'flex' : 'none';
}

function updateCartPage() {
    // This function populates your main cart.html page
    const cartItemsContainer = document.getElementById('cart-items-container');
    if (!cartItemsContainer) return; // Only run on the cart page

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="empty-cart">
                <h3>Your cart is empty.</h3>
                <a href="shop.html" class="btn">Continue Shopping</a>
            </div>
        `;
        // Also hide the summary or totals if you have them
        return;
    }

    let cartHTML = '';
    let subtotal = 0;

    cart.forEach(item => {
        // Generate the HTML list for the flavor breakdown
        const flavorsBreakdown = Object.entries(item.flavors)
            .map(([flavor, qty]) => `<li>${qty}x ${flavor}</li>`)
            .join('');

        const itemTotal = item.totalQuantity * item.pricePer;
        subtotal += itemTotal;

        cartHTML += `
            <div class="cart-item">
                <div class="cart-item-image">
                    <img src="${item.imageUrl}" alt="${item.name}">
                </div>
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    <p class="item-price">Size: ${item.size}</p>
                    <ul class="flavor-breakdown">${flavorsBreakdown}</ul>
                </div>
                <div class="cart-item-actions">
                    <span>Qty: ${item.totalQuantity}</span>
                </div>
                <div class="cart-item-total">
                    $${itemTotal.toFixed(2)}
                </div>
            </div>
        `;
    });

    cartItemsContainer.innerHTML = cartHTML;
    
    // Update summary totals on the cart page
    const subtotalEl = document.getElementById('cart-subtotal');
    const totalEl = document.getElementById('cart-total');
    if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `$${subtotal.toFixed(2)}`; // Assuming no tax/shipping for now
}


// --- 5. INITIAL LOAD ---
// Load the cart as soon as the page is ready
document.addEventListener('DOMContentLoaded', loadCart);