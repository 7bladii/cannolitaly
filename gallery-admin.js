document.addEventListener('DOMContentLoaded', () => {
    if (typeof firebase === 'undefined') {
        console.error("Firebase is not initialized.");
        return;
    }

    const db = firebase.firestore();
    const storage = firebase.storage();

    const uploadForm = document.getElementById('upload-form');
    const mediaFileInput = document.getElementById('media-file');
    const posterFileInput = document.getElementById('poster-file');
    const galleryList = document.getElementById('gallery-list');
    const uploadButton = uploadForm.querySelector('button');

    // --- 1. SUBIR NUEVOS ARCHIVOS (CON POSTER Y ORDEN) ---
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const mediaFiles = mediaFileInput.files;
        const posterFile = posterFileInput.files[0];

        if (mediaFiles.length === 0) {
            alert('Please select at least one main file to upload.');
            return;
        }

        const originalButtonText = uploadButton.textContent;
        uploadButton.textContent = `Uploading...`;
        uploadButton.disabled = true;

        let posterUrl = null;

        try {
            // Sube la imagen de portada primero (si existe)
            if (posterFile) {
                const posterPath = `gallery/posters/${Date.now()}_${posterFile.name}`;
                const posterRef = storage.ref(posterPath);
                const posterUploadTask = await posterRef.put(posterFile);
                posterUrl = await posterUploadTask.ref.getDownloadURL();
            }

            // Sube los archivos principales
            for (const file of mediaFiles) {
                const filePath = `gallery/${Date.now()}_${file.name}`;
                const fileRef = storage.ref(filePath);
                const uploadTask = await fileRef.put(file);
                const downloadURL = await uploadTask.ref.getDownloadURL();

                // Objeto de datos para Firestore
                const firestoreData = {
                    url: downloadURL,
                    path: filePath,
                    type: file.type,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    order: Date.now() // Asigna un número de orden inicial
                };

                // Si hay un poster y el archivo es un video, lo añade
                if (posterUrl && file.type.startsWith('video')) {
                    firestoreData.posterUrl = posterUrl;
                }

                await db.collection('gallery').add(firestoreData);
            }
            
            alert(`${mediaFiles.length} file(s) uploaded successfully!`);

        } catch (error) {
            console.error("Error during upload:", error);
            alert('An error occurred during the upload.');
        } finally {
            uploadForm.reset();
            uploadButton.textContent = originalButtonText;
            uploadButton.disabled = false;
            loadAdminGallery();
        }
    });

    // --- 2. MOSTRAR GALERÍA (ORDENADA Y ARRASTRABLE) ---
    async function loadAdminGallery() {
        galleryList.innerHTML = '<p>Loading media...</p>';
        try {
            // Ordena por el campo 'order'
            const snapshot = await db.collection('gallery').orderBy('order').get();
            
            galleryList.innerHTML = '';
            snapshot.forEach(doc => {
                const media = doc.data();
                const mediaId = doc.id;
                const itemDiv = document.createElement('div');
                itemDiv.className = 'gallery-item';
                itemDiv.setAttribute('data-id', mediaId); // Guarda el ID para reordenar

                if (media.type && media.type.startsWith('video')) {
                    const preview = media.posterUrl ? `<img src="${media.posterUrl}" alt="Video Poster">` : `<video src="${media.url}" muted></video>`;
                    itemDiv.innerHTML = preview;
                } else {
                    itemDiv.innerHTML = `<img src="${media.url}" alt="Gallery Media">`;
                }
                
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-button';
                deleteBtn.innerHTML = '&times;';
                deleteBtn.onclick = () => deleteMedia(mediaId, media.path);
                itemDiv.appendChild(deleteBtn);
                galleryList.appendChild(itemDiv);
            });

            // Inicializa la funcionalidad de arrastrar y soltar
            initSortable();

        } catch (error) {
            console.error("Error loading admin gallery:", error);
        }
    }

    // --- 3. INICIALIZAR DRAG-AND-DROP ---
    function initSortable() {
        if (window.Sortable) {
            new Sortable(galleryList, {
                animation: 150,
                ghostClass: 'sortable-ghost',
                onEnd: saveOrder // Llama a la función de guardar cuando se suelta un item
            });
        }
    }

    // --- 4. GUARDAR EL NUEVO ORDEN ---
    async function saveOrder() {
        const items = galleryList.querySelectorAll('.gallery-item');
        const batch = db.batch();

        items.forEach((item, index) => {
            const docId = item.getAttribute('data-id');
            if (docId) {
                const docRef = db.collection('gallery').doc(docId);
                batch.update(docRef, { order: index }); // Actualiza el 'order' con la nueva posición
            }
        });

        try {
            await batch.commit();
            console.log('New order saved successfully!');
        } catch (error) {
            console.error('Error saving new order:', error);
        }
    }

    // --- 5. BORRAR ARCHIVOS ---
    async function deleteMedia(docId, filePath) {
        if (!confirm('Are you sure you want to permanently delete this item?')) return;
        try {
            await db.collection('gallery').doc(docId).delete();
            await storage.ref(filePath).delete();
            // Nota: La lógica para borrar el poster de Storage no está incluida por simplicidad.
            loadAdminGallery();
        } catch (error) {
            console.error("Error deleting media:", error);
        }
    }

    // Carga inicial
    loadAdminGallery();
});