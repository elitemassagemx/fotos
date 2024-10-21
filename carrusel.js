// carrusel.js
document.addEventListener('DOMContentLoaded', function() {
    loadCarouselContent();
});

function loadCarouselContent() {
    fetch('carrusel.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('carrusel-container').innerHTML = data;
            // Use a small delay to ensure the content is rendered before initializing
            setTimeout(initCarousel, 100);
        })
        .catch(error => console.error('Error loading carousel:', error));
}

function initCarousel() {
    const carousel = document.getElementById('carrusel-container');
    if (!carousel) {
        console.error('Carousel element not found');
        return;
    }

    const items = carousel.querySelectorAll('.carousel-item');
    if (items.length === 0) {
        console.error('No carousel items found');
        return;
    }

    console.log(`Found ${items.length} carousel items`);

    const prevBtn = carousel.querySelector('.carousel-control.prev');
    const nextBtn = carousel.querySelector('.carousel-control.next');
    if (!prevBtn || !nextBtn) {
        console.error('Carousel control buttons not found');
        return;
    }

    const itemWidth = items[0].offsetWidth;
    let currentIndex = 0;

    function showSlide(index) {
        const carouselList = carousel.querySelector('.carousel');
        carouselList.style.transform = `translateX(-${index * itemWidth}px)`;
        currentIndex = index;
        updateIndicators(index);
    }

    function nextSlide() {
        showSlide((currentIndex + 1) % items.length);
    }

    function prevSlide() {
        showSlide((currentIndex - 1 + items.length) % items.length);
    }

    function updateIndicators(index) {
        const indicators = carousel.querySelectorAll('.carousel-indicators button');
        indicators.forEach((indicator, i) => {
            if (i === index) {
                indicator.classList.add('active');
                indicator.setAttribute('aria-current', 'true');
            } else {
                indicator.classList.remove('active');
                indicator.removeAttribute('aria-current');
            }
        });
    }

    nextBtn.addEventListener('click', nextSlide);
    prevBtn.addEventListener('click', prevSlide);

    // Configurar indicadores
    const indicators = carousel.querySelectorAll('.carousel-indicators button');
    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => showSlide(index));
    });

    // Añadir navegación con teclado
    carousel.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowRight') {
            nextSlide();
        } else if (e.key === 'ArrowLeft') {
            prevSlide();
        }
    });

    // Iniciar el carrusel
    showSlide(0);
    console.log('Carousel initialized');
}
