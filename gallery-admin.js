document.addEventListener('DOMContentLoaded', () => {
    // Ensure Firebase is initialized before using its services
    if (typeof firebase === 'undefined') {
        console.error("Firebase is not initialized. Make sure firebase-init.js is loaded correctly.");
        return;
    }

    const db = firebase.firestore();
    const storage = firebase.storage();

    // --- DOM Elements ---
    const uploadForm = document.getElementById('upload-form');
    const mediaFileInput = document.getElementById('media-file');
    const galleryList = document.getElementById('gallery-list');
    
    // Check if essential elements exist to avoid errors
    if (!uploadForm || !mediaFileInput || !galleryList) {
        console.error("One or more essential HTML elements for the gallery admin page are missing.");
        return;
    }
    const uploadButton = uploadForm.querySelector('button');

    // --- 1. UPLOAD NEW MEDIA (Photo or Video) ---
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const file = mediaFileInput.files[0];

        if (!file) {
            alert('Please select a file to upload.');
            return;
        }

        uploadButton.textContent = 'Uploading...';
        uploadButton.disabled = true;

        try {
            // Create a unique file path in Firebase Storage
            const filePath = `gallery/${Date.now()}_${file.name}`;
            const fileRef = storage.ref(filePath);
            
            // Upload the file
            const uploadTask = await fileRef.put(file);
            const downloadURL = await uploadTask.ref.getDownloadURL();

            // Save the media information to the 'gallery' collection in Firestore
            await db.collection('gallery').add({
                url: downloadURL,
                path: filePath, // Store the file path for easy deletion later
                type: file.type, // e.g., 'image/jpeg' or 'video/mp4'
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            uploadForm.reset(); // Clear the form input
            loadAdminGallery(); // Refresh the list of media

        } catch (error) {
            console.error("Error uploading file:", error);
            alert('File upload failed. Please check the console and try again.');
        } finally {
            // Restore the button's state
            uploadButton.textContent = 'Upload to Gallery';
            uploadButton.disabled = false;
        }
    });

    // --- 2. DISPLAY EXISTING MEDIA in the admin panel ---
    async function loadAdminGallery() {
        galleryList.innerHTML = '<p>Loading media...</p>';
        
        try {
            const snapshot = await db.collection('gallery').orderBy('createdAt', 'desc').get();
            
            if (snapshot.empty) {
                galleryList.innerHTML = '<p>No media has been uploaded to the gallery yet.</p>';
                return;
            }
            
            galleryList.innerHTML = ''; // Clear the loading message
            snapshot.forEach(doc => {
                const media = doc.data();
                const mediaId = doc.id;
                
                const itemDiv = document.createElement('div');
                itemDiv.className = 'gallery-item';

                // Display a video or an image based on the file type
                if (media.type && media.type.startsWith('video')) {
                    itemDiv.innerHTML = `<video src="${media.url}" muted></video>`; // 'muted' prevents autoplay issues
                } else {
                    itemDiv.innerHTML = `<img src="${media.url}" alt="Gallery Media">`;
                }
                
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-button';
                deleteBtn.innerHTML = '&times;'; // A simple 'x' character for the icon
                deleteBtn.setAttribute('aria-label', 'Delete item');
                deleteBtn.onclick = () => deleteMedia(mediaId, media.path);
                
                itemDiv.appendChild(deleteBtn);
                galleryList.appendChild(itemDiv);
            });
        } catch (error) {
            console.error("Error loading admin gallery:", error);
            galleryList.innerHTML = '<p>Could not load gallery media. Please refresh the page.</p>';
        }
    }

    // --- 3. DELETE MEDIA from both Firestore and Storage ---
    async function deleteMedia(docId, filePath) {
        if (!confirm('Are you sure you want to permanently delete this item?')) {
            return;
        }

        try {
            // Delete the document from the Firestore database
            await db.collection('gallery').doc(docId).delete();
            
            // Delete the file from Firebase Storage
            await storage.ref(filePath).delete();
            
            loadAdminGallery(); // Refresh the list after deletion
        } catch (error) {
            console.error("Error deleting media:", error);
            alert('Failed to delete media. It might have already been deleted.');
        }
    }

    // Initial load of the gallery when the page is ready
    loadAdminGallery();
});