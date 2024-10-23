// carrusel.js
document.addEventListener('DOMContentLoaded', function() {
    initializeCarousels();
});

async function initializeCarousels() {
    try {
        // Cargar primer carrusel
        if (document.getElementById('carrusel-container')) {
            await loadCarouselContent();
        }
        
        // Cargar segundo carrusel
        if (document.getElementById('paqcarr-container')) {
            await loadPaqcarrContent();
        }
    } catch (error) {
        console.error('Error initializing carousels:', error);
    }
}

async function loadCarouselContent() {
    try {
        const response = await fetch('carrusel.html');
        const data = await response.text();
        const container = document.getElementById('carrusel-container');
        if (container) {
            container.innerHTML = data;
            initCarousel('carrusel-container');
        }
    } catch (error) {
        console.error('Error loading carousel:', error);
    }
}

async function loadPaqcarrContent() {
    try {
        const response = await fetch('paqcarr.html');
        const data = await response.text();
        const container = document.getElementById('paqcarr-container');
        if (container) {
            container.innerHTML = data;
            initCarousel('paqcarr-container');
        }
    } catch (error) {
        console.error('Error loading paqcarr:', error);
    }
}

function initCarousel(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const navItems = container.querySelectorAll('.image-nav-item');
    if (!navItems.length) return;

    // Crear el contenedor de imagen principal si no existe
    let mainImageContainer = container.querySelector('.main-image-container');
    if (!mainImageContainer) {
        mainImageContainer = document.createElement('div');
        mainImageContainer.className = 'main-image-container';
        mainImageContainer.innerHTML = `
            <img class="main-image" alt="">
            <div class="image-info">
                <h3 class="image-title"></h3>
                <p class="image-description"></p>
            </div>
        `;
        container.insertBefore(mainImageContainer, container.firstChild);
    }

    // Elementos principales
    const mainImage = mainImageContainer.querySelector('.main-image');
    const imageTitle = mainImageContainer.querySelector('.image-title');
    const imageDescription = mainImageContainer.querySelector('.image-description');

    function updateMainImage(item) {
        if (!item) return;

        const imageSrc = item.getAttribute('data-image');
        const title = item.getAttribute('data-title');
        const description = item.getAttribute('data-description');

        mainImage.src = imageSrc;
        mainImage.alt = title;
        imageTitle.textContent = title;
        imageDescription.textContent = description;

        // Actualizar estado activo
        navItems.forEach(navItem => navItem.classList.remove('active'));
        item.classList.add('active');
    }

    // Eventos de clic
    navItems.forEach(item => {
        item.addEventListener('click', () => updateMainImage(item));
    });

    // Navegación con teclado
    container.addEventListener('keydown', (e) => {
        const activeItem = container.querySelector('.image-nav-item.active');
        if (!activeItem) return;

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

    // Inicializar con el primer elemento
    updateMainImage(navItems[0]);
}
