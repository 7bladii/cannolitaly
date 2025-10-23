// product-detail.js - Updated for MIXED SIZE orders with FLEXIBLE validation

document.addEventListener('DOMContentLoaded', async () => {
    if (typeof firebase === 'undefined') {
        console.error("Firebase is not initialized.");
        document.body.innerHTML = "<h1>Error: Firebase connection failed.</h1>";
        return;
    }
    
    const db = firebase.firestore();

    const productNameEl = document.getElementById('product-name');
    const productDescriptionEl = document.getElementById('product-description');
    const productImageEl = document.getElementById('product-image');
    const form = document.getElementById('product-options-form');

    if (!form) return;

    const sizeOptions = document.querySelectorAll('input[name="size"]');
    const flavorInputs = document.querySelectorAll('.flavor-qty-input');
    const totalQuantityDisplay = document.getElementById('total-quantity-display');
    const totalPriceDisplay = document.getElementById('total-price-display');
    const validationMessage = document.getElementById('validation-message');
    const addToCartBtn = document.getElementById('add-to-cart-btn');

    let productData;

    let flavorQuantities = {
        large: {},
        small: {}
    };
    
    flavorInputs.forEach(input => {
        const flavorName = input.dataset.flavor;
        flavorQuantities.large[flavorName] = 0;
        flavorQuantities.small[flavorName] = 0;
    });

    try {
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');
        if (!productId) throw new Error("Product ID not found in URL.");

        const doc = await db.collection('products').doc(productId).get();
        if (!doc.exists) throw new Error("Product not found.");
        
        productData = { id: doc.id, ...doc.data() };
        
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

    // --- LÓGICA CENTRAL ---

    function updateTotalsAndValidate() {
        const selectedSize = document.querySelector('input[name="size"]:checked').value.toLowerCase();
        flavorInputs.forEach(input => {
            const flavorName = input.dataset.flavor;
            flavorQuantities[selectedSize][flavorName] = parseInt(input.value) || 0;
        });

        const totalLarge = Object.values(flavorQuantities.large).reduce((sum, qty) => sum + qty, 0);
        const totalSmall = Object.values(flavorQuantities.small).reduce((sum, qty) => sum + qty, 0);

        const grandTotalQuantity = totalLarge + totalSmall;
        const grandTotalPrice = (totalLarge * productData.prices.large) + (totalSmall * productData.prices.small);
        totalQuantityDisplay.textContent = grandTotalQuantity;
        totalPriceDisplay.textContent = `$${grandTotalPrice.toFixed(2)}`;

        // --- Lógica de Validación FINAL Y FLEXIBLE ---
        const minLarge = productData.minimums.large;
        const minSmall = productData.minimums.small;
        let isValid = true;
        let message = "";

        const anyMinimumMet = (totalLarge >= minLarge || totalSmall >= minSmall);

        if (grandTotalQuantity === 0) {
            message = 'Please add cannolis to your order.';
            isValid = false;
        } else if (anyMinimumMet) {
            // ¡ÉXITO! Si un mínimo ya se cumplió, la orden es siempre válida.
            // La validación estricta se desactiva.
            message = "";
            isValid = true;
        } else {
            // Si NINGÚN mínimo se ha cumplido, revisamos si hay cantidades inválidas.
            if ((totalLarge > 0 && totalLarge < minLarge) || (totalSmall > 0 && totalSmall < minSmall)) {
                message = `You must order the minimum first (${minLarge} large or ${minSmall} small).`;
                isValid = false;
            }
        }

        validationMessage.textContent = message;
        addToCartBtn.disabled = !isValid;
    }

    function switchSizeView() {
        const selectedSize = document.querySelector('input[name="size"]:checked').value.toLowerCase();
        flavorInputs.forEach(input => {
            const flavorName = input.dataset.flavor;
            input.value = flavorQuantities[selectedSize][flavorName] || 0;
        });
        updateTotalsAndValidate();
    }
    
    function resetForm() {
        flavorInputs.forEach(input => {
            const flavorName = input.dataset.flavor;
            flavorQuantities.large[flavorName] = 0;
            flavorQuantities.small[flavorName] = 0;
            input.value = 0;
        });
        document.getElementById('size-large').checked = true;
        updateTotalsAndValidate();
    }

    // --- EVENT LISTENERS ---
    sizeOptions.forEach(radio => radio.addEventListener('change', switchSizeView));
    flavorInputs.forEach(input => input.addEventListener('input', updateTotalsAndValidate));

    // --- ADD TO CART ---
    addToCartBtn.addEventListener('click', () => {
        if (addToCartBtn.disabled) return;
        
        const totalLarge = Object.values(flavorQuantities.large).reduce((sum, qty) => sum + qty, 0);
        const totalSmall = Object.values(flavorQuantities.small).reduce((sum, qty) => sum + qty, 0);

        if (totalLarge > 0) {
            const largeCartItem = {
                id: productData.id + '-large',
                name: productData.name,
                size: 'Large',
                pricePer: productData.prices.large,
                totalQuantity: totalLarge,
                flavors: flavorQuantities.large,
                imageUrl: productData.imageUrl
            };
            addToCart(largeCartItem);
        }

        if (totalSmall > 0) {
            const smallCartItem = {
                id: productData.id + '-small',
                name: productData.name,
                size: 'Small',
                pricePer: productData.prices.small,
                totalQuantity: totalSmall,
                flavors: flavorQuantities.small,
                imageUrl: productData.imageUrl
            };
            addToCart(smallCartItem);
        }

        const originalBtnText = addToCartBtn.textContent;
        addToCartBtn.textContent = 'Added!';
        setTimeout(() => { addToCartBtn.textContent = originalBtnText; }, 2000);
        
        resetForm();
    });
    
    // --- INITIAL UI STATE ---
    updateTotalsAndValidate();
});