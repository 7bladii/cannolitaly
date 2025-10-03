document.addEventListener('DOMContentLoaded', async () => {
    // --- Lógica para el botón de volver ---
    const backButton = document.getElementById('back-link');
    if (backButton) {
        backButton.addEventListener('click', (event) => {
            event.preventDefault(); // Prevents the link from navigating to "#"
            history.back();         // This function navigates to the previous page
        });
    }

    // --- Lógica para cargar los detalles del producto ---
    const db = firebase.firestore();

    const productImage = document.getElementById('product-image');
    const productName = document.getElementById('product-name');
    const productPrice = document.getElementById('product-price');
    const productDescription = document.getElementById('product-description');
    const productDetailContainer = document.querySelector('.product-detail-container');

    const showError = (message) => {
        if (productDetailContainer) {
            productDetailContainer.innerHTML = `<h2 style="text-align: center; width: 100%;">${message}</h2>`;
        }
    };

    try {
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');

        if (!productId) {
            showError('Product not specified.');
            return;
        }

        const docRef = db.collection('products').doc(productId);
        const doc = await docRef.get();

        if (!doc.exists) {
            showError('An error occurred while loading the product.');
            console.error('No such document!');
            return;
        }

        const product = doc.data();
        
        document.title = `${product.name} - Cannolitaly`;

        if (productImage) {
            productImage.src = product.imageUrl;
            productImage.alt = product.name;
        }
        if (productName) {
            productName.textContent = product.name;
        }
        if (productPrice) {
            productPrice.textContent = `$${product.price.toFixed(2)}`;
        }
        if (productDescription) {
            productDescription.textContent = product.description;
        }
        
        // Asignar los datos del producto al botón "Add to Cart"
        const addToCartButton = document.querySelector('.add-to-cart-btn');
        if (addToCartButton) {
            addToCartButton.dataset.productId = productId;
            addToCartButton.dataset.name = product.name;
            addToCartButton.dataset.price = product.price;
            addToCartButton.dataset.imageUrl = product.imageUrl;
        }

    } catch (error) {
        console.error("Error getting product:", error);
        showError('An error occurred while loading the product.');
    }
});