document.addEventListener('DOMContentLoaded', () => {
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const adminLayout = document.querySelector('.admin-layout');

    if (sidebarToggle && adminLayout) {
        sidebarToggle.addEventListener('click', () => {
            adminLayout.classList.toggle('sidebar-open');
        });
    }
});