document.addEventListener('DOMContentLoaded', () => {

    // --- 1. AUTHENTICATION CHECK ---
    // This is crucial. It checks if a user is logged in. If not, it redirects them to the homepage.
    auth.onAuthStateChanged(user => {
        if (!user) {
            console.log("No user is logged in. Redirecting...");
            window.location.href = 'index.html'; // Or your login page
        } else {
            console.log("Admin user is logged in:", user.email);
            fetchProducts(); // If logged in, fetch and display the products
        }
    });

    // --- 2. LOGOUT FUNCTIONALITY ---
    const logoutButton = document.getElementById('logout-button');
    logoutButton.addEventListener('click', () => {
        auth.signOut().then(() => {
            console.log("User signed out successfully.");
            window.location.href = 'index.html'; // Redirect after logout
        }).catch(error => {
            console.error("Sign out error:", error);
        });
    });

    // --- 3. FETCH AND DISPLAY EXISTING PRODUCTS ---
    const productListContainer = document.getElementById('product-list');
    async function fetchProducts() {
        try {
            const snapshot = await db.collection('products').get();
            if (snapshot.empty) {
                productListContainer.innerHTML = '<p>No products found.</p>';
                return;
            }

            let productsHtml = '';
            snapshot.forEach(doc => {
                const product = doc.data();
                productsHtml += `
                    <div style="border: 1px solid #ccc; padding: 15px; border-radius: 8px;">
                        <h4>${product.name}</h4>
                        <p>${product.description}</p>
                    </div>
                `;
            });
            productListContainer.innerHTML = productsHtml;

        } catch (error) {
            console.error("Error fetching products:", error);
            productListContainer.innerHTML = '<p>Error loading products.</p>';
        }
    }

    // --- 4. ADD NEW PRODUCT FUNCTIONALITY ---
    const addProductForm = document.getElementById('add-product-form');
    const uploadStatus = document.getElementById('upload-status');

    addProductForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = addProductForm['product-name'].value;
        const description = addProductForm['product-description'].value;
        const imageFile = addProductForm['product-image'].files[0];
        
        const submitButton = addProductForm.querySelector('button');
        submitButton.disabled = true;
        uploadStatus.textContent = 'Uploading image...';

        try {
            // Step 1: Upload the image to Firebase Storage
            const storageRef = storage.ref(`product-images/${Date.now()}_${imageFile.name}`);
            const uploadTask = await storageRef.put(imageFile);
            const imageUrl = await uploadTask.ref.getDownloadURL();
            
            uploadStatus.textContent = 'Image uploaded. Saving product...';

            // Step 2: Create the product object with the correct structure
            const newProduct = {
                name: name,
                description: description,
                imageUrl: imageUrl,
                // 👇 THE IMPORTANT PART: Fields are added automatically! 👇
                prices: {
                    large: 6,
                    small: 3
                },
                minimums: {
                    large: 12,
                    small: 24
                }
            };

            // Step 3: Save the new product to Firestore
            await db.collection('products').add(newProduct);

            uploadStatus.textContent = '✅ Product added successfully!';
            addProductForm.reset(); // Clear the form
            fetchProducts(); // Refresh the product list

        } catch (error) {
            console.error("Error adding product:", error);
            uploadStatus.textContent = `❌ Error: ${error.message}`;
        } finally {
            submitButton.disabled = false;
            setTimeout(() => { uploadStatus.textContent = ''; }, 4000);
        }
    });

});