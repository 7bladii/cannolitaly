// shop-loader.js

const productGrid = document.getElementById('product-grid');

db.collection('products').orderBy('createdAt', 'desc').get()
    .then(snapshot => {
        let productsHtml = '';
        if (snapshot.empty) {
            productGrid.innerHTML = '<p>No products available at the moment.</p>';
            return;
        }

        snapshot.forEach(doc => {
            const product = doc.data();
            productsHtml += `
                <a href="#" class="product-card">
                    <div class="product-image">
                        <img src="${product.imageUrl}" alt="${product.name}">
                    </div>
                    <div class="product-info">
                        <h3>${product.name}</h3>
                        <p class="price">$${product.price.toFixed(2)}</p>
                    </div>
                </a>
            `;
        });
        productGrid.innerHTML = productsHtml;
    })
    .catch(error => {
        console.error("Error fetching products: ", error);
        productGrid.innerHTML = '<p>Error loading products. Please try again later.</p>';
    });