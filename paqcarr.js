// paqcarr.js
document.addEventListener('DOMContentLoaded', function() {
    initPaqCarr();
});

function initPaqCarr() {
    const mainImage = document.getElementById('paqcarrMainImage');
    const mainImageTitle = document.getElementById('paqcarrMainImageTitle');
    const mainImageDescription = document.getElementById('paqcarrMainImageDescription');
    const navItems = document.querySelectorAll('#paqcarr-container .image-nav-item');

    function updateMainImage(item) {
        const imageSrc = item.getAttribute('data-image');
        const imageTitle = item.getAttribute('data-title');
        const imageDescription = item.getAttribute('data-description');

        mainImage.src = imageSrc;
        mainImage.alt = imageTitle;
        mainImageTitle.textContent = imageTitle;
        mainImageDescription.textContent = imageDescription;

        navItems.forEach(navItem => navItem.classList.remove('active'));
        item.classList.add('active');
    }

    navItems.forEach(item => {
        item.addEventListener('click', function() {
            updateMainImage(this);
        });
    });

    // Inicializar el primer item como activo
    if (navItems.length > 0) {
        updateMainImage(navItems[0]);
    }

    // Añadir navegación con teclado
    document.addEventListener('keydown', function(e) {
        const activeItem = document.querySelector('#paqcarr-container .image-nav-item.active');
        let nextItem;

        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            nextItem = activeItem.nextElementSibling || navItems[0];
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            nextItem = activeItem.previousElementSibling || navItems[navItems.length - 1];
        }

        if (nextItem) {
            updateMainImage(nextItem);
        }
    });
}
