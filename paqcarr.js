// Reemplaza todo el contenido de tu archivo carrusel.js con esto
document.addEventListener('DOMContentLoaded', function() {
    const mainImage = document.getElementById('mainImage');
    const mainImageTitle = document.getElementById('mainImageTitle');
    const mainImageDescription = document.getElementById('mainImageDescription');
    const navItems = document.querySelectorAll('.image-nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const imageSrc = this.getAttribute('data-image');
            const imageTitle = this.getAttribute('data-title');
            const imageDescription = this.getAttribute('data-description');
            mainImage.src = imageSrc;
            mainImage.alt = imageTitle;
            mainImageTitle.textContent = imageTitle;
            mainImageDescription.textContent = imageDescription;
            // Remover la clase 'active' de todos los items
            navItems.forEach(navItem => navItem.classList.remove('active'));
            // Añadir la clase 'active' al item seleccionado
            this.classList.add('active');
        });
    });
    // Inicializar el primer item como activo
    if (navItems.length > 0) {
        navItems[0].classList.add('active');
    }
});
