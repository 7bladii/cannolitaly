document.addEventListener('DOMContentLoaded', async () => {
    const db = firebase.firestore();
    const productGrid = document.getElementById('product-grid');

    if (!productGrid) return;

    productGrid.innerHTML = "<p>Loading our delicious products...</p>";

    function renderProducts(products) {
        productGrid.innerHTML = ''; // Clear loading message
        products.forEach(productDoc => {
            const productData = { id: productDoc.id, ...productDoc.data() };
            
            // --- KEY CHANGE HERE ---
            // Safely gets the price from the new data structure.
            // It looks for product.prices.large. If it doesn't exist, it defaults to 0.
            const displayPrice = productData.prices?.large || 0;

            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            
            // The "Add to Cart" button is removed from this view,
            // as users must click through to the detail page to select options.
            productCard.innerHTML = `
                <a href="product-detail.html?id=${productData.id}" class="product-link">
                    <div class="product-image">
                        <img src="${productData.imageUrl}" alt="${productData.name}">
                    </div>
                    <div class="product-info-main">
                        <h3>${productData.name}</h3>
                    </div>
                </a>
            `;
            productGrid.appendChild(productCard);
        });
    }

    try {
        const querySnapshot = await db.collection('products').get();
        renderProducts(querySnapshot.docs);
    } catch (error) {
        console.error("Error getting products: ", error);
        productGrid.innerHTML = "<p>Could not load products at this time. Please try again later.</p>";
    }
});