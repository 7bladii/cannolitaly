document.addEventListener('DOMContentLoaded', function() {
    // Firebase services
    const db = firebase.firestore();
    const storage = firebase.storage();

    // Modal elements
    const productModal = document.getElementById('product-modal');
    const addProductBtn = document.getElementById('add-product-btn');
    const closeModalBtn = document.querySelector('.modal-close');
    
    // Form elements
    const productForm = document.getElementById('product-form');
    const modalTitle = document.getElementById('modal-title');
    const productIdField = document.getElementById('product-id');
    const productNameField = document.getElementById('product-name');
    const productDescriptionField = document.getElementById('product-description'); // Nuevo
    const productPriceField = document.getElementById('product-price');
    const productImageField = document.getElementById('product-image');
    
    const productList = document.getElementById('product-list');

    // --- Modal Logic ---
    const openModal = () => productModal.classList.add('active');
    const closeModal = () => {
        productModal.classList.remove('active');
        productForm.reset();
        productIdField.value = '';
    };

    addProductBtn.addEventListener('click', () => {
        modalTitle.textContent = 'Add New Product';
        openModal();
    });
    closeModalBtn.addEventListener('click', closeModal);
    productModal.addEventListener('click', (e) => {
        if (e.target === productModal) closeModal();
    });

    // --- Render Products ---
    function renderProducts(products) {
        productList.innerHTML = '';
        products.forEach(product => {
            const data = product.data();
            const id = product.id;
            
            const card = document.createElement('div');
            card.className = 'product-card-admin';
            card.innerHTML = `
                <img src="${data.imageUrl}" alt="${data.name}">
                <div class="product-card-admin-info">
                    <h4>${data.name}</h4>
                    <p class="product-desc-admin">${data.description || ''}</p>
                    <p class="product-price-admin">$${data.price.toFixed(2)}</p>
                    <div class="product-card-admin-actions">
                        <button class="btn btn-secondary edit-btn" data-id="${id}">Edit</button>
                        <button class="btn btn-delete delete-btn" data-id="${id}">Delete</button>
                    </div>
                </div>
            `;
            productList.appendChild(card);
        });
    }
    
    db.collection('products').onSnapshot(snapshot => {
        renderProducts(snapshot.docs);
    });

    // --- Handle Product Form Submission (Add & Edit) ---
    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = productNameField.value;
        const description = productDescriptionField.value; // Nuevo
        const price = parseFloat(productPriceField.value);
        const imageFile = productImageField.files[0];
        const id = productIdField.value;

        try {
            if (id) {
                const docRef = db.collection('products').doc(id);
                await docRef.update({ name, description, price }); // Nuevo
                
                if (imageFile) {
                    const storageRef = storage.ref(`products/${id}`);
                    const snapshot = await storageRef.put(imageFile);
                    const imageUrl = await snapshot.ref.getDownloadURL();
                    await docRef.update({ imageUrl });
                }
            } else {
                const imageRefName = `products/${Date.now()}-${imageFile.name}`;
                const storageRef = storage.ref(imageRefName);
                const snapshot = await storageRef.put(imageFile);
                const imageUrl = await snapshot.ref.getDownloadURL();
                
                await db.collection('products').add({ name, description, price, imageUrl }); // Nuevo
            }
            closeModal();
        } catch (error) {
            console.error("Error saving product:", error);
            alert("Could not save product. See console for details.");
        }
    });

    // --- Handle Edit and Delete Buttons ---
    productList.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;

        if (e.target.classList.contains('delete-btn')) {
            if (confirm('Are you sure you want to delete this product?')) {
                await db.collection('products').doc(id).delete();
            }
        }

        if (e.target.classList.contains('edit-btn')) {
            const doc = await db.collection('products').doc(id).get();
            const data = doc.data();
            
            modalTitle.textContent = 'Edit Product';
            productIdField.value = id;
            productNameField.value = data.name;
            productDescriptionField.value = data.description; // Nuevo
            productPriceField.value = data.price;
            
            openModal();
        }
    });
});