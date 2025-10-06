// product-detail.js - CÓDIGO COMPLETO PARA MÚLTIPLES SABORES

document.addEventListener('DOMContentLoaded', async () => {
    const db = firebase.firestore();

    // --- 1. OBTENER ELEMENTOS DEL DOM ---
    const productNameEl = document.getElementById('product-name');
    const productDescriptionEl = document.getElementById('product-description');
    const productImageEl = document.getElementById('product-image');
    const form = document.getElementById('product-options-form');
    
    // Si no hay formulario en la página, detener la ejecución.
    if (!form) return;

    // Entradas del formulario y elementos dinámicos
    const quantityInput = document.getElementById('quantity');
    const minOrderNoticeEl = document.getElementById('min-order-notice');
    const totalPriceEl = document.getElementById('total-price');
    const addToCartBtn = form.querySelector('.add-to-cart-btn');

    let productData; // Variable para guardar los datos del producto

    // --- 2. OBTENER DATOS DEL PRODUCTO DESDE FIRESTORE ---
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');
        if (!productId) throw new Error("El ID del producto no se encontró en la URL.");

        const doc = await db.collection('products').doc(productId).get();
        if (!doc.exists) throw new Error("Producto no encontrado.");
        
        productData = { id: doc.id, ...doc.data() };
        
        // Rellenar la información estática del producto
        productNameEl.textContent = productData.name;
        productDescriptionEl.textContent = productData.description;
        productImageEl.src = productData.imageUrl;
        productImageEl.alt = productData.name;
        document.title = `${productData.name} - Cannolitaly`;

    } catch (error) {
        console.error("Error al obtener el producto:", error);
        productNameEl.textContent = "Producto no encontrado";
        form.style.display = 'none'; // Ocultar formulario si el producto no carga
        return;
    }

    // --- 3. LÓGICA CENTRAL Y ACTUALIZACIONES DE LA INTERFAZ ---
    function updateUI() {
        const selectedSize = document.querySelector('input[name="size"]:checked').value;
        const quantity = parseInt(quantityInput.value) || 0;
        const selectedFlavors = document.querySelectorAll('input[name="flavor"]:checked');

        // Obtener precios y mínimos desde los datos del producto cargados
        const pricePerItem = productData.prices[selectedSize];
        const minQuantity = productData.minimums[selectedSize];
        
        // Actualizar precio total
        const totalPrice = quantity * pricePerItem;
        totalPriceEl.textContent = `$${totalPrice.toFixed(2)}`;
        
        // Actualizar aviso de orden mínima y validación de sabor
        minOrderNoticeEl.textContent = `Minimum order: ${minQuantity} ${selectedSize} cannolis`;

        // Validar cantidad Y si al menos un sabor fue seleccionado
        if (quantity < minQuantity || selectedFlavors.length === 0) {
            addToCartBtn.disabled = true;
            // Poner el mensaje en rojo si la cantidad es incorrecta
            minOrderNoticeEl.style.color = (quantity < minQuantity) ? '#d9534f' : '#888';
            // Si el problema es la falta de sabor, mostrar un mensaje específico
            if (selectedFlavors.length === 0) {
                 minOrderNoticeEl.textContent = "Please select at least one flavor.";
                 minOrderNoticeEl.style.color = '#d9534f';
            }
        } else {
            addToCartBtn.disabled = false;
            minOrderNoticeEl.style.color = '#888'; // Restaurar color por defecto
        }
    }

    // --- 4. EVENT LISTENERS (ESCUCHADORES DE EVENTOS) ---

    // Escuchar cualquier cambio dentro del formulario para actualizar la UI
    form.addEventListener('input', updateUI);

    // Manejar el envío del formulario
    form.addEventListener('submit', (event) => {
        event.preventDefault(); // Prevenir que la página se recargue

        const selectedSize = document.querySelector('input[name="size"]:checked').value;
        const quantity = parseInt(quantityInput.value);
        const pricePerItem = productData.prices[selectedSize];
        
        // Crear un array con los nombres de los sabores seleccionados
        const selectedFlavors = Array.from(document.querySelectorAll('input[name="flavor"]:checked')).map(checkbox => checkbox.value);

        // Crear el objeto que se añadirá al carrito
        const itemToAdd = {
            id: productData.id,
            name: productData.name,
            price: pricePerItem,
            imageUrl: productData.imageUrl,
            quantity: quantity,
            size: selectedSize,
            flavors: selectedFlavors // Guardamos un array de sabores
        };

        // Llamar a la función global addToCart de cart.js
        addToCart(itemToAdd);

        // Feedback visual para el usuario
        addToCartBtn.textContent = 'Added!';
        setTimeout(() => { addToCartBtn.textContent = 'Add to Cart'; }, 2000);
    });
    
    // --- 5. ESTADO INICIAL DE LA INTERFAZ ---
    // Establecer la cantidad inicial al mínimo requerido para el tamaño grande
    quantityInput.value = productData.minimums.large; 
    // Llamar una vez al cargar la página para establecer el estado inicial correcto
    updateUI();
});