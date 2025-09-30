// in uploader.js

document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('file-input');
    const previewGrid = document.getElementById('preview-grid');
    const uploadButton = document.getElementById('upload-btn');
    const feedback = document.getElementById('feedback');
    let selectedFiles = []; // Array to store the selected files

    fileInput.addEventListener('change', (event) => {
        // Clear previous previews and feedback
        previewGrid.innerHTML = '';
        feedback.textContent = '';
        selectedFiles = [];

        const files = Array.from(event.target.files);

        // Enforce the 6-file limit
        if (files.length > 6) {
            feedback.textContent = 'Error: You can only select up to 6 files.';
            feedback.style.color = 'red';
            uploadButton.style.display = 'none'; // Hide button if limit is exceeded
            return;
        }

        selectedFiles = files;

        // Create a preview for each selected file
        selectedFiles.forEach(file => {
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';

            if (file.type.startsWith('image/')) {
                const img = document.createElement('img');
                img.src = URL.createObjectURL(file);
                previewItem.appendChild(img);
            } else if (file.type.startsWith('video/')) {
                const video = document.createElement('video');
                video.src = URL.createObjectURL(file);
                video.autoplay = true;
                video.muted = true;
                video.loop = true;
                previewItem.appendChild(video);
            }
            
            previewGrid.appendChild(previewItem);
        });

        // Show the upload button if files have been selected
        if (selectedFiles.length > 0) {
            uploadButton.style.display = 'inline-block';
        } else {
            uploadButton.style.display = 'none';
        }
    });

    // Placeholder for upload functionality
    uploadButton.addEventListener('click', () => {
        if (selectedFiles.length === 0) {
            alert('Please select files to upload.');
            return;
        }

        // Here is where you would add your code to upload the files
        // to a service like Firebase Storage.
        feedback.textContent = `Uploading ${selectedFiles.length} file(s)...`;
        feedback.style.color = 'green';
        
        console.log('Files to upload:', selectedFiles);
        // Example: uploadFilesToFirebase(selectedFiles);
    });
});