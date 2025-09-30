document.addEventListener('DOMContentLoaded', async () => {
    const db = firebase.firestore();
    const productGrid = document.getElementById('product-grid');

    if (!productGrid) return; // Exit if the product grid isn't on this page

    // Show a loading message while fetching data
    productGrid.innerHTML = "<p>Loading products...</p>";

    // Function to render products on the page
    function renderProducts(products) {
        productGrid.innerHTML = ''; // Clear the loading message
        products.forEach(product => {
            const productData = product.data();
            const productId = product.id;

            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            
            // The link now wraps both the image and the main info
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
        productGrid.innerHTML = "<p>Could not load products at this time.</p>";
    }

    // --- Event Listener for all "Add to Cart" Buttons ---
    productGrid.addEventListener('click', (event) => {
        // Check if the clicked element is a button with the correct class
        if (event.target.classList.contains('add-to-cart-btn')) {
            const button = event.target;
            
            const itemToAdd = {
                id: button.dataset.productId,
                name: button.dataset.name,
                price: parseFloat(button.dataset.price),
                imageUrl: button.dataset.imageUrl,
                quantity: 1 // Add one item by default
            };

            // Call the function from cart.js to add the item
            addToCart(itemToAdd);
            
            // Give user feedback
            alert(`"${itemToAdd.name}" has been added to your cart!`);
        }
    });
});