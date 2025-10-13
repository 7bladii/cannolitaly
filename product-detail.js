// product-detail.js - Updated for multiple flavor quantities

document.addEventListener('DOMContentLoaded', async () => {
    // Ensure Firebase is initialized
    if (typeof firebase === 'undefined') {
        console.error("Firebase is not initialized.");
        document.body.innerHTML = "<h1>Error: Firebase connection failed.</h1>";
        return;
    }
    
    const db = firebase.firestore();

    // --- 1. GET DOM ELEMENTS ---
    const productNameEl = document.getElementById('product-name');
    const productDescriptionEl = document.getElementById('product-description');
    const productImageEl = document.getElementById('product-image');
    const form = document.getElementById('product-options-form');

    if (!form) return; // Stop if the form doesn't exist on the page

    // New dynamic elements
    const sizeOptions = document.querySelectorAll('input[name="size"]');
    const flavorInputs = document.querySelectorAll('.flavor-qty-input');
    const totalQuantityDisplay = document.getElementById('total-quantity-display');
    const totalPriceDisplay = document.getElementById('total-price-display');
    const validationMessage = document.getElementById('validation-message');
    const addToCartBtn = document.getElementById('add-to-cart-btn');

    let productData; // Variable to store the loaded product data

    // --- 2. FETCH PRODUCT DATA FROM FIRESTORE ---
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');
        if (!productId) throw new Error("Product ID not found in URL.");

        const doc = await db.collection('products').doc(productId).get();
        if (!doc.exists) throw new Error("Product not found.");
        
        productData = { id: doc.id, ...doc.data() };
        
        // Populate static product info
        productNameEl.textContent = productData.name;
        productDescriptionEl.textContent = productData.description;
        productImageEl.src = productData.imageUrl;
        productImageEl.alt = productData.name;
        document.title = `${productData.name} - Cannolitaly`;

    } catch (error) {
        console.error("Error fetching product:", error);
        productNameEl.textContent = "Product Not Found";
        form.style.display = 'none';
        return;
    }

    // --- 3. CORE LOGIC & UI UPDATES ---
    function updateTotals() {
        // Get selected size and price per cannoli from Firestore data
        const selectedSizeInput = document.querySelector('input[name="size"]:checked');
        const sizeValue = selectedSizeInput.value.toLowerCase(); // 'large' or 'small'
        const pricePerCannoli = productData.prices[sizeValue];
        const minQuantity = productData.minimums[sizeValue];
        
        // Calculate total quantity from all flavor inputs
        let totalQuantity = 0;
        flavorInputs.forEach(input => {
            totalQuantity += parseInt(input.value) || 0;
        });

        // Update displays
        totalQuantityDisplay.textContent = totalQuantity;
        const totalPrice = totalQuantity * pricePerCannoli;
        totalPriceDisplay.textContent = `$${totalPrice.toFixed(2)}`;
        
        // Validation Logic
        let isValid = true;
        let message = "";

        if (totalQuantity === 0) {
            message = 'Please add at least one cannoli.';
            isValid = false;
        } else if (totalQuantity < minQuantity) {
            message = `Minimum order for ${sizeValue} size is ${minQuantity} cannolis.`;
            isValid = false;
        }

        validationMessage.textContent = message;
        addToCartBtn.disabled = !isValid;
    }

    // --- 4. EVENT LISTENERS ---
    sizeOptions.forEach(radio => radio.addEventListener('change', updateTotals));
    flavorInputs.forEach(input => input.addEventListener('input', updateTotals));

    // --- 5. ADD TO CART LOGIC ---
    addToCartBtn.addEventListener('click', () => {
        const totalQuantity = parseInt(totalQuantityDisplay.textContent);
        if (addToCartBtn.disabled || totalQuantity <= 0) {
            return; // Don't add to cart if validation fails
        }

        const selectedSizeInput = document.querySelector('input[name="size"]:checked');
        const sizeValue = selectedSizeInput.value;
        const pricePerItem = productData.prices[sizeValue.toLowerCase()];

        // Build the detailed flavors object for the cart
        const selectedFlavors = {};
        flavorInputs.forEach(input => {
            const quantity = parseInt(input.value) || 0;
            if (quantity > 0) {
                selectedFlavors[input.dataset.flavor] = quantity;
            }
        });
        
        // Create the new, detailed cart item object
        const cartItem = {
            id: productData.id,
            name: productData.name,
            size: sizeValue,
            pricePer: pricePerItem,
            totalQuantity: totalQuantity,
            flavors: selectedFlavors, // e.g., { Pistachio: 6, Chocolate: 6 }
            imageUrl: productData.imageUrl
        };

        // Call the global addToCart function from cart.js
        addToCart(cartItem);

        // Visual feedback for the user
        const originalBtnText = addToCartBtn.textContent;
        addToCartBtn.textContent = 'Added!';
        setTimeout(() => { addToCartBtn.textContent = originalBtnText; }, 2000);
        
        // Reset form after adding
        form.reset();
        // Manually trigger radio button style and recalculate totals
        document.getElementById('size-large').checked = true; 
        updateTotals();
    });
    
    // --- 6. INITIAL UI STATE ---
    // Initial call to set the correct prices and validation messages on page load
    updateTotals();
});