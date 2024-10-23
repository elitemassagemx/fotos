// carrusel.js
document.addEventListener('DOMContentLoaded', function() {
    loadCarouselContent();
    loadPaqcarrContent();
});

// Cargar el contenido del primer carrusel
function loadCarouselContent() {
    fetch('carrusel.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('carrusel-container').innerHTML = data;
            setTimeout(initImageNav, 100, 'carrusel-container');
        })
        .catch(error => console.error('Error loading carousel:', error));
}

// Cargar el contenido del segundo carrusel
function loadPaqcarrContent() {
    fetch('paqcarr.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('paqcarr-container').innerHTML = data;
            setTimeout(initImageNav, 100, 'paqcarr-container');
        })
        .catch(error => console.error('Error loading paqcarr:', error));
}

// Función de inicialización para ambos carruseles
function initImageNav(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container ${containerId} not found`);
        return;
    }

    const imageNavItems = container.querySelectorAll('.image-nav-item');
    if (imageNavItems.length === 0) {
        console.error(`No image nav items found in ${containerId}`);
        return;
    }

    const mainImageContainer = container.querySelector('.main-image-container');
    if (!mainImageContainer) {
        // Crear el contenedor de imagen principal si no existe
        const newMainContainer = document.createElement('div');
        newMainContainer.className = 'main-image-container';
        newMainContainer.innerHTML = `
            <img src="" alt="" class="main-image">
            <div class="image-info">
                <h3></h3>
                <p></p>
            </div>
        `;
        container.insertBefore(newMainContainer, container.firstChild);
    }

    // Manejar clics en los elementos de navegación
    imageNavItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remover clase activa de todos los items
            imageNavItems.forEach(i => i.classList.remove('active'));
            
            // Añadir clase activa al item seleccionado
            this.classList.add('active');

            // Actualizar imagen principal y texto
            const mainImage = container.querySelector('.main-image');
            const imageInfo = container.querySelector('.image-info');
            
            mainImage.src = this.getAttribute('data-image');
            mainImage.alt = this.getAttribute('data-title');
            
            imageInfo.innerHTML = `
                <h3>${this.getAttribute('data-title')}</h3>
                <p>${this.getAttribute('data-description')}</p>
            `;
        });
    });

    // Activar el primer elemento por defecto
    imageNavItems[0].click();
}
