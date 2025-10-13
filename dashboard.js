document.addEventListener('DOMContentLoaded', () => {
    if (typeof firebase === 'undefined') { 
        console.error("Firebase not loaded. Make sure all Firebase scripts are included in your HTML."); 
        return; 
    }

    const db = firebase.firestore();
    const storage = firebase.storage();

    // --- DOM Elements ---
    const addProductBtn = document.getElementById('add-product-btn');
    const modal = document.getElementById('product-modal');
    const closeModalBtn = modal.querySelector('.modal-close-btn');
    const productForm = document.getElementById('product-form');
    const productGrid = document.getElementById('product-grid-admin');
    const modalTitle = document.getElementById('modal-title');
    const productIdInput = document.getElementById('product-id');

    // --- Modal Control ---
    function openModal() { modal.classList.add('visible'); }
    function closeModal() { 
        modal.classList.remove('visible'); 
        productForm.reset();
        productIdInput.value = '';
        document.getElementById('product-image').required = true;
    }

    addProductBtn.addEventListener('click', () => {
        modalTitle.textContent = 'Add New Product';
        openModal();
    });
    closeModalBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    // --- LOAD AND DISPLAY PRODUCTS ---
    async function loadProducts() {
        try {
            const snapshot = await db.collection('products').get();
            productGrid.innerHTML = ''; 

            if (snapshot.empty) {
                productGrid.innerHTML = '<p>No products found. Click "+ Add New Product" to begin.</p>';
                return;
            }

            snapshot.forEach(doc => {
                const product = { id: doc.id, ...doc.data() };
                const card = document.createElement('div');
                card.className = 'product-card-admin';
                // We add data-id here to make it easier to find the card later when editing
                card.setAttribute('data-id', product.id); 
                card.innerHTML = `
                    <img src="${product.imageUrl}" alt="${product.name}">
                    <div class="product-info-admin">
                        <h3>${product.name}</h3>
                        <div class="product-actions-admin">
                            <button class="btn btn-secondary edit-btn" data-id="${product.id}">Edit</button>
                            <button class="btn btn-danger delete-btn" data-id="${product.id}" data-image-path="${product.imagePath || ''}">Delete</button>
                        </div>
                    </div>
                `;
                productGrid.appendChild(card);
            });
            
            addCardActionListeners();

        } catch (error) {
            console.error("Error loading products:", error);
        }
    }
    
    // --- ADD/EDIT/DELETE LISTENERS ---
    function addCardActionListeners() {
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', (e) => openModalForEdit(e.target.dataset.id));
        });
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', (e) => deleteProduct(e.target.dataset.id, e.target.dataset.imagePath));
        });
    }

    // --- SAVE/UPDATE PRODUCT ---
    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const saveBtn = productForm.querySelector('button[type="submit"]');
        saveBtn.textContent = 'Saving...';
        saveBtn.disabled = true;

        const productId = productIdInput.value;
        const isEditing = !!productId;

        try {
            // Get the existing image URL and Path to avoid overwriting if no new image is uploaded
            let productToUpdate = isEditing ? (await db.collection('products').doc(productId).get()).data() : {};
            let imageUrl = productToUpdate.imageUrl || '';
            let imagePath = productToUpdate.imagePath || '';
            
            const imageFile = document.getElementById('product-image').files[0];

            if (imageFile) {
                const filePath = `products/${Date.now()}_${imageFile.name}`;
                const fileRef = storage.ref(filePath);
                await fileRef.put(imageFile);
                imageUrl = await fileRef.getDownloadURL();
                imagePath = filePath; 
            }

            const productData = {
                name: document.getElementById('product-name').value,
                description: document.getElementById('product-description').value,
                prices: {
                    large: parseFloat(document.getElementById('price-large').value),
                    small: parseFloat(document.getElementById('price-small').value)
                },
                minimums: {
                    large: parseInt(document.getElementById('min-large').value),
                    small: parseInt(document.getElementById('min-small').value)
                },
                imageUrl: imageUrl,
                imagePath: imagePath
            };

            if (isEditing) {
                await db.collection('products').doc(productId).update(productData);
            } else {
                await db.collection('products').add(productData);
            }
            
            closeModal();
            loadProducts();

        } catch (error) {
            console.error("Error saving product:", error);
            alert("Failed to save product.");
        } finally {
            saveBtn.textContent = 'Save Product';
            saveBtn.disabled = false;
        }
    });

    // --- EDIT PRODUCT ---
    async function openModalForEdit(id) {
        try {
            const doc = await db.collection('products').doc(id).get();
            if (!doc.exists) return;
            const product = doc.data();

            modalTitle.textContent = 'Edit Product';
            productIdInput.value = id;
            document.getElementById('product-name').value = product.name;
            document.getElementById('product-description').value = product.description;
            document.getElementById('price-large').value = product.prices.large;
            document.getElementById('price-small').value = product.prices.small;
            document.getElementById('min-large').value = product.minimums.large;
            document.getElementById('min-small').value = product.minimums.small;
            document.getElementById('product-image').required = false;
            
            openModal();
        } catch (error) {
            console.error("Error fetching product for edit:", error);
        }
    }
    
    // --- DELETE PRODUCT ---
    async function deleteProduct(id, imagePath) {
        if (!confirm('Are you sure you want to delete this product?')) return;

        try {
            await db.collection('products').doc(id).delete();

            if (imagePath) {
                await storage.ref(imagePath).delete();
            }
            
            loadProducts();
        } catch (error) {
            console.error("Error deleting product:", error);
            alert("Failed to delete product.");
        }
    }

    // Initial load of products
    loadProducts();
});