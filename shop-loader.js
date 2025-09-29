// Asegúrate de que tu firebase-init.js ya esté inicializando la app de Firebase.
const db = firebase.firestore();
const productGrid = document.getElementById('product-grid');

// Función para mostrar los productos en la página
function renderProducts(products) {
    if (!productGrid) return; // Si no hay grid en la página, no hagas nada.
    productGrid.innerHTML = ''; // Limpia la lista actual
    products.forEach(product => {
        const productData = product.data();
        const productId = product.id;

        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <!-- ENLACE AÑADIDO ALREDEDOR DE LA IMAGEN -->
            <a href="product-detail.html?id=${productId}" class="product-image-link">
                <div class="product-image">
                    <img src="${productData.imageUrl}" alt="${productData.name}">
                </div>
            </a>
            <div class="product-info">
                <h3>${productData.name}</h3>
                <p class="price">$${productData.price.toFixed(2)}</p>
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

// Obtener los productos de la colección 'products' en Firestore
db.collection('products').get()
    .then(querySnapshot => {
        renderProducts(querySnapshot.docs);
    })
    .catch(error => {
        console.error("Error getting products: ", error);
        if (productGrid) {
            productGrid.innerHTML = "<p>Could not load products at this time.</p>";
        }
    });

