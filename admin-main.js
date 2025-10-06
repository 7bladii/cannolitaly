document.addEventListener('DOMContentLoaded', () => {
    // --- GLOBAL REFERENCES ---
    const auth = firebase.auth();
    const db = firebase.firestore();
    const storage = firebase.storage();

    // --- 1. AUTH & LOGOUT (Global for all admin pages) ---
    auth.onAuthStateChanged(user => {
        if (!user) {
            window.location.href = 'login.html';
        }
    });

    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            auth.signOut().then(() => window.location.href = 'login.html');
        });
    }

    // --- 2. PRODUCT MANAGEMENT (Runs only on dashboard.html) ---
    if (document.getElementById('product-list')) {
        
        // --- TODO TU CÓDIGO DE PRODUCTOS VA AQUÍ ---
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

        let currentImageUrl = '';

        const openModal = (product = null) => {
            productForm.reset();
            if (product) {
                modalTitle.textContent = 'Edit Product';
                productIdInput.value = product.id;
                productNameInput.value = product.name;
                productDescInput.value = product.description;
                productPriceInput.value = product.prices.large;
                currentImageUrl = product.imageUrl;
            } else {
                modalTitle.textContent = 'Add New Product';
                productIdInput.value = '';
                currentImageUrl = '';
            }
            modal.style.display = 'flex';
        };

        const closeModal = () => {
            modal.style.display = 'none';
        };

        const fetchAndRenderProducts = () => {
            db.collection('products').orderBy('name').onSnapshot(snapshot => {
                if (snapshot.empty) {
                    productList.innerHTML = '<p>No products found. Click "+ Add New Product" to begin.</p>';
                    return;
                }
                productList.innerHTML = '';
                snapshot.forEach(doc => {
                    const product = { id: doc.id, ...doc.data() };
                    const price = product.prices?.large ? product.prices.large.toFixed(2) : '0.00';
                    const productCard = `
                        <div class="product-card-admin" data-id="${product.id}">
                            <img src="${product.imageUrl}" alt="${product.name}">
                            <div class="product-card-admin-info">
                                <h4>${product.name}</h4>
                                <p>$${price}</p>
                                <div class="product-card-admin-actions">
                                    <button class="btn btn-secondary edit-btn">Edit</button>
                                    <button class="btn btn-delete delete-btn">Delete</button>
                                </div>
                            </div>
                        </div>
                    `;
                    productList.innerHTML += productCard;
                });
            });
        };
        
        productForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = productIdInput.value;
            const imageFile = productImageInput.files[0];
            let imageUrl = currentImageUrl;
            const largePrice = parseFloat(productPriceInput.value);

            const productData = {
                name: productNameInput.value,
                description: productDescInput.value,
                prices: { large: largePrice, small: largePrice / 2 },
                minimums: { large: 12, small: 24 },
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            try {
                if (imageFile) {
                    const filePath = `product-images/${Date.now()}_${imageFile.name}`;
                    const storageRef = storage.ref(filePath);
                    const uploadTask = await storageRef.put(imageFile);
                    imageUrl = await uploadTask.ref.getDownloadURL();
                }
                productData.imageUrl = imageUrl;

                if (id) {
                    await db.collection('products').doc(id).update(productData);
                } else {
                    productData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                    await db.collection('products').add(productData);
                }
                closeModal();
            } catch (error) {
                console.error('Error saving product:', error);
                alert('There was an error saving the product.');
            }
        });

        productList.addEventListener('click', async (e) => {
            const card = e.target.closest('.product-card-admin');
            if (!card) return;
            const productId = card.dataset.id;

            if (e.target.classList.contains('edit-btn')) {
                const doc = await db.collection('products').doc(productId).get();
                if (doc.exists) {
                    openModal({ id: doc.id, ...doc.data() });
                }
            }

            if (e.target.classList.contains('delete-btn')) {
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

        addProductBtn.addEventListener('click', () => openModal());
        modalClose.addEventListener('click', closeModal);
        modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

        fetchAndRenderProducts();
    }

    // --- 3. GALLERY MANAGEMENT (Runs only on gallery-admin.html) ---
    if (document.getElementById('admin-gallery-grid')) {
        const galleryForm = document.getElementById('add-gallery-image-form');
        const galleryImageInput = document.getElementById('gallery-image-upload');
        const galleryStatus = document.getElementById('gallery-upload-status');
        const adminGalleryGrid = document.getElementById('admin-gallery-grid');
        
        async function fetchGalleryPhotos() {
            try {
                const snapshot = await db.collection('galleryImages').orderBy('createdAt', 'desc').get();
                adminGalleryGrid.innerHTML = '';
                if (snapshot.empty) {
                    adminGalleryGrid.innerHTML = '<p>No gallery photos found.</p>';
                    return;
                }
                snapshot.forEach(doc => {
                    const imageData = doc.data();
                    const imageId = doc.id;
                    adminGalleryGrid.innerHTML += `
                        <div class="product-card-admin" data-id="${imageId}" data-path="${imageData.path}">
                            <img src="${imageData.url}" alt="Gallery Image">
                            <div class="product-actions-admin">
                                <button class="btn btn-delete delete-btn">Delete</button>
                            </div>
                        </div>
                    `;
                });
            } catch (error) { console.error("Error fetching gallery photos:", error); }
        }
        
        galleryForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const imageFile = galleryImageInput.files[0];
            if (!imageFile) return;

            const submitButton = galleryForm.querySelector('button');
            submitButton.disabled = true;
            galleryStatus.textContent = 'Uploading...';

            try {
                const filePath = `gallery-images/${Date.now()}_${imageFile.name}`;
                const storageRef = storage.ref(filePath);
                await storageRef.put(imageFile);
                const downloadURL = await storageRef.getDownloadURL();

                await db.collection('galleryImages').add({
                    url: downloadURL,
                    path: filePath,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                galleryStatus.textContent = '✅ Photo uploaded successfully!';
                galleryForm.reset();
            } catch (error) {
                console.error("Error uploading image:", error);
                galleryStatus.textContent = '❌ Error uploading photo.';
            } finally {
                submitButton.disabled = false;
                setTimeout(() => { galleryStatus.textContent = ''; }, 4000);
            }
        });

        adminGalleryGrid.addEventListener('click', async (e) => {
            if (e.target.classList.contains('delete-btn')) {
                const card = e.target.closest('.product-card-admin');
                const imageId = card.dataset.id;
                const imagePath = card.dataset.path;

                if (confirm('Delete this photo from the gallery?')) {
                    try {
                        await db.collection('galleryImages').doc(imageId).delete();
                        if (imagePath) await storage.ref(imagePath).delete();
                    } catch (error) { console.error('Error deleting photo:', error); }
                }
            }
        });
        
        fetchGalleryPhotos();
    }
});