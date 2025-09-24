// dashboard.js

// 1. Proteger la página: si no hay un usuario logueado, redirige a admin.html
auth.onAuthStateChanged(user => {
    if (!user) {
        window.location.href = 'admin.html';
    }
});

const addProductForm = document.getElementById('add-product-form');
const productList = document.getElementById('product-list');

// 2. Lógica para agregar un producto nuevo
addProductForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = addProductForm['product-name'].value;
    const price = parseFloat(addProductForm['product-price'].value);
    const imageFile = addProductForm['product-image'].files[0];

    try {
        // Subir la imagen a Firebase Storage
        const storageRef = storage.ref(`product-images/${imageFile.name}`);
        const uploadTask = await storageRef.put(imageFile);
        const imageUrl = await uploadTask.ref.getDownloadURL();

        // Guardar la información del producto en Firestore
        await db.collection('products').add({
            name: name,
            price: price,
            imageUrl: imageUrl,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        addProductForm.reset();
        alert('Product added successfully!');

    } catch (error) {
        console.error("Error adding product: ", error);
        alert('Error adding product.');
    }
});

// 3. Mostrar los productos de Firestore en tiempo real
db.collection('products').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
    let productsHtml = '';
    snapshot.forEach(doc => {
        const product = doc.data();
        const productId = doc.id;
        productsHtml += `
            <div style="display: flex; align-items: center; gap: 20px; border-bottom: 1px solid #eee; padding: 10px 0;">
                <img src="${product.imageUrl}" alt="${product.name}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 5px;">
                <div style="flex-grow: 1;">
                    <strong>${product.name}</strong>
                    <p>$${product.price.toFixed(2)}</p>
                </div>
                <button class="btn btn-secondary" onclick="deleteProduct('${productId}')">Delete</button>
            </div>
        `;
    });
    productList.innerHTML = productsHtml;
});

// 4. Función para eliminar un producto
async function deleteProduct(productId) {
    if (confirm('Are you sure you want to delete this product?')) {
        try {
            await db.collection('products').doc(productId).delete();
            alert('Product deleted successfully.');
        } catch (error) {
            console.error("Error deleting product: ", error);
            alert('Error deleting product.');
        }
    }
}