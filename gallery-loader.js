document.addEventListener('DOMContentLoaded', () => {
    const galleryGrid = document.getElementById('gallery-grid');
    if (!galleryGrid) {
        console.error('Gallery grid element not found!');
        return;
    }

    if (typeof firebase === 'undefined') {
        galleryGrid.innerHTML = '<p>Error: Firebase is not connected.</p>';
        console.error("Firebase is not initialized.");
        return;
    }

    const db = firebase.firestore();

    db.collection('gallery').orderBy('createdAt', 'desc').get()
      .then((querySnapshot) => {
        
        if (querySnapshot.empty) {
            galleryGrid.innerHTML = '<p>No photos or videos have been added yet.</p>';
            return;
        }

        galleryGrid.innerHTML = '';

        querySnapshot.forEach((doc) => {
            const media = doc.data();
            if (!media.url) return;

            // Lógica para Videos (Reescrita con createElement)
            if (media.type && media.type.startsWith('video')) {
                const videoLink = document.createElement('a');
                videoLink.href = media.url;
                videoLink.setAttribute('data-fancybox', 'gallery');
                videoLink.setAttribute('data-autoplay', 'true');
                videoLink.setAttribute('data-muted', 'true');
                
                // --- CAMBIO CLAVE: Construimos el video paso a paso ---
                const videoEl = document.createElement('video');
                
                // 1. Asignamos la URL
                videoEl.src = `${media.url}#t=0.1`;
                
                // 2. Asignamos los atributos
                videoEl.muted = true;
                videoEl.playsInline = true; // En JS, 'playsinline' se escribe 'playsInline'
                videoEl.preload = 'metadata';
                
                // 3. Asignamos el poster si existe
                if (media.posterUrl) {
                    videoEl.poster = media.posterUrl;
                }
                
                // 4. Añadimos el video construido al enlace
                videoLink.appendChild(videoEl);
                galleryGrid.appendChild(videoLink);

            // Lógica para Imágenes (Sin cambios)
            } else {
                const imageLink = document.createElement('a');
                imageLink.href = media.url;
                imageLink.setAttribute('data-fancybox', 'gallery');
                
                const img = document.createElement('img');
                img.src = media.url;
                img.alt = 'Cannolitaly Gallery Photo';

                imageLink.appendChild(img);
                galleryGrid.appendChild(imageLink);
            }
        });

        Fancybox.bind('[data-fancybox="gallery"]', {
            on: {
                close: () => {
                     document.querySelectorAll('video').forEach(vid => vid.pause());
                }
            }
        });

    }).catch((error) => {
        console.error("Error loading gallery:", error);
        galleryGrid.innerHTML = '<p>Could not load the gallery at this time.</p>';
    });
});