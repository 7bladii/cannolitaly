document.addEventListener('DOMContentLoaded', () => {
    if (typeof firebase === 'undefined') {
        console.error("Firebase is not initialized.");
        return;
    }

    const db = firebase.firestore();
    const storage = firebase.storage();

    const uploadForm = document.getElementById('upload-form');
    const mediaFileInput = document.getElementById('media-file');
    const posterFileInput = document.getElementById('poster-file'); // Nuevo campo
    const galleryList = document.getElementById('gallery-list');
    const uploadButton = uploadForm.querySelector('button');

    // --- 1. SUBIR NUEVOS ARCHIVOS (CON LÓGICA DE POSTER) ---
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const mediaFiles = mediaFileInput.files;
        const posterFile = posterFileInput.files[0]; // El poster es solo uno

        if (mediaFiles.length === 0) {
            alert('Please select at least one main file to upload.');
            return;
        }

        const originalButtonText = uploadButton.textContent;
        uploadButton.textContent = `Uploading...`;
        uploadButton.disabled = true;

        let posterUrl = null;

        try {
            // --- PASO A: Subir la imagen de portada PRIMERO (si existe) ---
            if (posterFile) {
                console.log('Uploading poster image...');
                const posterPath = `gallery/posters/${Date.now()}_${posterFile.name}`;
                const posterRef = storage.ref(posterPath);
                const posterUploadTask = await posterRef.put(posterFile);
                posterUrl = await posterUploadTask.ref.getDownloadURL();
                console.log('Poster uploaded successfully:', posterUrl);
            }

            // --- PASO B: Subir los archivos principales (fotos/videos) ---
            for (const file of mediaFiles) {
                const filePath = `gallery/${Date.now()}_${file.name}`;
                const fileRef = storage.ref(filePath);
                
                const uploadTask = await fileRef.put(file);
                const downloadURL = await uploadTask.ref.getDownloadURL();

                // Creamos el objeto para guardar en Firestore
                const firestoreData = {
                    url: downloadURL,
                    path: filePath,
                    type: file.type,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                };

                // Si subimos un poster, lo añadimos al objeto
                if (posterUrl && file.type.startsWith('video')) {
                    firestoreData.posterUrl = posterUrl;
                }

                await db.collection('gallery').add(firestoreData);
            }
            
            alert(`${mediaFiles.length} file(s) uploaded successfully!`);

        } catch (error) {
            console.error("Error during upload:", error);
            alert('An error occurred during the upload. Please check the console.');
        } finally {
            // Limpiar y restaurar el formulario al final
            uploadForm.reset();
            uploadButton.textContent = originalButtonText;
            uploadButton.disabled = false;
            loadAdminGallery(); // Recargar la lista de la galería
        }
    });

    // --- 2. MOSTRAR GALERÍA EXISTENTE (Sin cambios) ---
    async function loadAdminGallery() {
        galleryList.innerHTML = '<p>Loading media...</p>';
        try {
            const snapshot = await db.collection('gallery').orderBy('createdAt', 'desc').get();
            if (snapshot.empty) {
                galleryList.innerHTML = '<p>No media has been uploaded yet.</p>';
                return;
            }
            galleryList.innerHTML = '';
            snapshot.forEach(doc => {
                const media = doc.data();
                const mediaId = doc.id;
                const itemDiv = document.createElement('div');
                itemDiv.className = 'gallery-item';

                if (media.type && media.type.startsWith('video')) {
                    // Si el video tiene un poster, lo usamos como vista previa
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
        } catch (error) {
            console.error("Error loading admin gallery:", error);
        }
    }

    // --- 3. BORRAR ARCHIVOS (Sin cambios) ---
    async function deleteMedia(docId, filePath) {
        if (!confirm('Are you sure you want to permanently delete this item?')) return;
        try {
            await db.collection('gallery').doc(docId).delete();
            await storage.ref(filePath).delete();
            // También deberíamos borrar el poster de Storage si existe, pero lo omitimos por simplicidad
            loadAdminGallery();
        } catch (error) {
            console.error("Error deleting media:", error);
        }
    }

    // Carga inicial
    loadAdminGallery();
});