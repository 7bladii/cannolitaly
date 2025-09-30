document.addEventListener('DOMContentLoaded', async () => {
    // Inicializa la conexión con la base de datos de Firestore
    const db = firebase.firestore();
    const mainContent = document.querySelector('.main-content');

    try {
        // --- OBTENER EL ID DEL PRODUCTO DESDE LA URL ---
        const params = new URLSearchParams(window.location.search);
        const productId = params.get('id');

        if (!productId) {
            // Lanza un error si no hay ID para ser capturado por el bloque catch
            throw new Error('No product ID found in URL.');
        }

        // --- BUSCAR EL PRODUCTO EN FIRESTORE ---
        const productRef = db.collection('products').doc(productId);
        const doc = await productRef.get(); // 'await' pausa la ejecución hasta que la promesa se resuelva

        if (doc.exists) {
            // Si el producto existe, obtenemos sus datos
            const productData = doc.data();
            
            // --- ACTUALIZAR EL HTML CON LOS DATOS DEL PRODUCTO ---
            document.title = `${productData.name} - Cannolitaly`;
            
            // Usar selectores más específicos es una buena práctica
            document.querySelector('.product-info h1').textContent = productData.name;
            document.querySelector('.product-info .price').textContent = `$${productData.price.toFixed(2)}`;
            // **Recomendación:** Asegúrate de que tu párrafo de descripción en HTML tenga la clase "description"
            // Ejemplo: <p class="description">Loading description...</p>
            document.querySelector('.product-info .description').textContent = productData.description;
            
            const productImageEl = document.querySelector('.product-gallery img');
            productImageEl.src = productData.imageUrl;
            productImageEl.alt = productData.name;

        } else {
            // Lanza un error si el producto no se encuentra
            throw new Error('No such product in Firestore!');
        }

    } catch (error) {
        // El bloque 'catch' maneja cualquier error que ocurra en el bloque 'try'
        console.error("Error getting product:", error.message);
        if (error.message.includes('No product ID') || error.message.includes('No such product')) {
            mainContent.innerHTML = '<h1>Producto no encontrado.</h1>';
        } else {
            mainContent.innerHTML = '<h1>Ocurrió un error al cargar el producto.</h1>';
        }
    }
});