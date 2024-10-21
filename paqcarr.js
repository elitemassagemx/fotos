document.addEventListener('DOMContentLoaded', function() {
initPaqCarr();
});
function initPaqCarr() {
const mainImage = document.getElementById('paqcarrMainImage');
const mainImageTitle = document.getElementById('paqcarrMainImageTitle');
const mainImageDescription = document.getElementById('paqcarrMainImageDescription');
const navItems = document.querySelectorAll('#paqcarr-container .image-nav-item');
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
}
