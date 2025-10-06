document.addEventListener('DOMContentLoaded', async () => {
    const db = firebase.firestore();
    const galleryGrid = document.getElementById('gallery-grid');

    if (!galleryGrid) return;

    try {
        const snapshot = await db.collection('galleryImages').orderBy('createdAt', 'desc').get();
        
        if (snapshot.empty) {
            galleryGrid.innerHTML = '<p>No photos have been added to the gallery yet.</p>';
            return;
        }

        galleryGrid.innerHTML = ''; // Clear loading message
        snapshot.forEach(doc => {
            const imageData = doc.data();
            const galleryItem = document.createElement('div');
            galleryItem.className = 'gallery-item';
            galleryItem.innerHTML = `<img src="${imageData.url}" alt="Cannolitaly Gallery Photo">`;
            galleryGrid.appendChild(galleryItem);
        });

    } catch (error) {
        console.error("Error fetching gallery images:", error);
        galleryGrid.innerHTML = '<p>Could not load photos at this time.</p>';
    }
});