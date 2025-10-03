document.addEventListener('DOMContentLoaded', async () => {
    const db = firebase.firestore();
    const productGrid = document.getElementById('product-grid');

    // Exit if the product grid container isn't on this page
    if (!productGrid) return;

    // Show a loading message while fetching data
    productGrid.innerHTML = "<p>Loading our delicious cannoli...</p>";

    /**
     * Renders a list of products into the product grid.
     * @param {Array} products - An array of Firestore document snapshots.
     */
    function renderProducts(products) {
        productGrid.innerHTML = ''; // Clear the loading message
        products.forEach(productDoc => {
            const productData = productDoc.data();
            const productId = productDoc.id;

            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            
            // The HTML structure for each product card.
            // The button includes all necessary data-* attributes for cart.js to use.
            productCard.innerHTML = `
                <a href="product-detail.html?id=${productId}" class="product-link">
                    <div class="product-image">
                        <img src="${productData.imageUrl}" alt="${productData.name}">
                    </div>
                    <div class="product-info-main">
                        <h3>${productData.name}</h3>
                        <p class="price">$${productData.price.toFixed(2)}</p>
                    </div>
                </a>
                <div class="product-actions">
                    <button 
                        class="btn add-to-cart-btn" 
                        data-product-id="${productId}" 
                        data-name="${productData.name}" 
                        data-price="${productData.price}"
                        data-image-url="${productData.imageUrl}">
                        Add to Cart
                    </button>
                </div>
            `;
            productGrid.appendChild(productCard);
        });
    }

    // Fetch products from Firestore and render them
    try {
        const querySnapshot = await db.collection('products').get();
        renderProducts(querySnapshot.docs);
    } catch (error) {
        console.error("Error getting products: ", error);
        productGrid.innerHTML = "<p>Could not load products at this time. Please try again later.</p>";
    }

    // The event listener for the buttons has been removed from this file
    // because the global listener in 'cart.js' already handles this functionality perfectly.
    // This prevents code duplication and keeps our logic clean.
});