document.addEventListener('DOMContentLoaded', () => {
    const db = firebase.firestore();
    const galleryGrid = document.getElementById('gallery-grid');

    async function loadGallery() {
        if (!galleryGrid) return;
        galleryGrid.innerHTML = '<p>Loading gallery...</p>';

        try {
            // Fetches from the 'gallery' collection to match the admin script
            const snapshot = await db.collection('gallery').orderBy('createdAt', 'desc').get();
            
            if (snapshot.empty) {
                galleryGrid.innerHTML = '<p>The gallery is currently empty.</p>';
                return;
            }

            galleryGrid.innerHTML = ''; // Clear loading message
            snapshot.forEach(doc => {
                const media = doc.data();
                const galleryItem = document.createElement('div');
                galleryItem.className = 'gallery-item';

                // **KEY CHANGE**: Checks if the media is a video or an image
                if (media.type && media.type.startsWith('video')) {
                    // If it's a video, create a <video> element
                    galleryItem.innerHTML = `
                        <video controls>
                            <source src="${media.url}" type="${media.type}">
                            Your browser does not support the video tag.
                        </video>
                    `;
                } else {
                    // Otherwise, create an <img> element inside a link
                    galleryItem.innerHTML = `
                        <a href="${media.url}" target="_blank">
                            <img src="${media.url}" alt="Gallery image">
                        </a>
                    `;
                }
                galleryGrid.appendChild(galleryItem);
            });

        } catch (error) {
            console.error("Error loading gallery:", error);
            galleryGrid.innerHTML = '<p>Could not load the gallery at this time.</p>';
        }
    }

    loadGallery();
});