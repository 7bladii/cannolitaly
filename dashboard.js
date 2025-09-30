document.addEventListener('DOMContentLoaded', () => {
    // Asumiendo que firebase-init.js ya inicializó Firebase
    const db = firebase.firestore();
    const storage = firebase.storage();

    // Referencias a los elementos del DOM
    const productList = document.getElementById('product-list');
    const addProductBtn = document.getElementById('add-product-btn');
    const modal = document.getElementById('product-modal');
    const modalClose = document.querySelector('.modal-close');
    const productForm = document.getElementById('product-form');
    const modalTitle = document.getElementById('modal-title');
    const productIdInput = document.getElementById('product-id');
    const productNameInput = document.getElementById('product-name');
    const productDescInput = document.getElementById('product-description');
    const productPriceInput = document.getElementById('product-price');
    const productImageInput = document.getElementById('product-image');

    let currentImageUrl = ''; // Para guardar la URL de la imagen al editar

    // --- FUNCIONES ---

    /**
     * Abre el modal. Si se pasa un producto, es para editar. Si no, es para añadir.
     */
    const openModal = (product = null) => {
        productForm.reset(); // Limpia el formulario
        if (product) {
            // Modo Edición: Rellena el formulario con los datos del producto
            modalTitle.textContent = 'Edit Product';
            productIdInput.value = product.id;
            productNameInput.value = product.name;
            productDescInput.value = product.description;
            productPriceInput.value = product.price;
            currentImageUrl = product.imageUrl; // Guarda la URL de la imagen actual
        } else {
            // Modo Añadir: Deja el formulario vacío
            modalTitle.textContent = 'Add New Product';
            productIdInput.value = '';
            currentImageUrl = '';
        }
        modal.classList.add('active'); // Muestra el modal
    };

    /**
     * Cierra el modal.
     */
    const closeModal = () => {
        modal.classList.remove('active');
    };

    /**
     * Obtiene los productos de Firestore en tiempo real y los muestra en la página.
     */
    const fetchAndRenderProducts = () => {
        db.collection('products').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
            productList.innerHTML = ''; // Limpia la lista antes de volver a dibujarla
            snapshot.forEach(doc => {
                const product = { id: doc.id, ...doc.data() };

                // Previene errores si algún producto no tiene precio
                const price = typeof product.price === 'number' ? product.price.toFixed(2) : '0.00';

                const productCard = `
                    <div class="product-card-admin">
                        <img src="${product.imageUrl}" alt="${product.name}">
                        <div class="product-card-admin-info">
                            <h4>${product.name}</h4>
                            <p>$${price}</p>
                            <div class="product-card-admin-actions">
                                <button class="btn btn-secondary edit-btn" data-id="${product.id}">Edit</button>
                                <button class="btn btn-delete delete-btn" data-id="${product.id}">Delete</button>
                            </div>
                        </div>
                    </div>
                `;
                productList.innerHTML += productCard;
            });
        });
    };

    /**
     * Maneja el envío del formulario para AÑADIR o EDITAR un producto.
     */
    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = productIdInput.value;
        const imageFile = productImageInput.files[0];
        let imageUrl = currentImageUrl; // Usa la URL existente por defecto

        const productData = {
            name: productNameInput.value,
            description: productDescInput.value,
            price: parseFloat(productPriceInput.value),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            // Paso 1: Si se seleccionó una nueva imagen, súbela y obtén la URL.
            if (imageFile) {
                const filePath = `product-images/${Date.now()}_${imageFile.name}`;
                const storageRef = storage.ref(filePath);
                const uploadTask = await storageRef.put(imageFile);
                imageUrl = await uploadTask.ref.getDownloadURL(); // Obtiene la URL correcta y completa
            }
            
            productData.imageUrl = imageUrl; // Asigna la URL (ya sea la nueva o la que ya existía)

            // Paso 2: Guarda los datos en Firestore.
            if (id) {
                // Si hay un ID, actualiza el producto existente.
                await db.collection('products').doc(id).update(productData);
            } else {
                // Si no hay ID, crea un nuevo producto.
                productData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                await db.collection('products').add(productData);
            }

            closeModal();
        } catch (error) {
            console.error('Error saving product:', error);
            alert('There was an error saving the product.');
        }
    });

    /**
     * Maneja los clics en los botones de "Edit" y "Delete" usando event delegation.
     */
    productList.addEventListener('click', async (e) => {
        const target = e.target;
        const productId = target.dataset.id;

        if (!productId) return; // Si no se hizo clic en un botón con data-id, no hace nada

        if (target.classList.contains('edit-btn')) {
            const doc = await db.collection('products').doc(productId).get();
            if (doc.exists) {
                openModal({ id: doc.id, ...doc.data() });
            }
        }

        if (target.classList.contains('delete-btn')) {
            if (confirm('Are you sure you want to delete this product?')) {
                try {
                    await db.collection('products').doc(productId).delete();
                } catch (error) {
                    console.error('Error deleting product:', error);
                    alert('There was an error deleting the product.');
                }
            }
        }
    });

    // --- EVENT LISTENERS PARA EL MODAL ---
    addProductBtn.addEventListener('click', () => openModal());
    modalClose.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        // Cierra el modal si se hace clic fuera del contenido
        if (e.target === modal) {
            closeModal();
        }
    });

    // --- INICIALIZACIÓN ---
    fetchAndRenderProducts();
});

