const BASE_URL = "https://raw.githubusercontent.com/elitemassagemx/Home/main/IMG/";
const CAROUSEL_IMAGE_BASE_URL = "https://raw.githubusercontent.com/elitemassagemx/prueba/main/carruimg/";
let services = {};
let currentPopupIndex = 0;

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded');

    // Elementos del DOM
    const verMasBtn = document.getElementById('ver-mas-galeria');
    const galleryGrid = document.querySelector('.gallery-grid');
    const body = document.body;
    const header = document.getElementById('main-header');
    let isExpanded = false;

    // Inicializaciones
    init();

    function init() {
        loadJSONData();
        setupPopup();
        setupGalleryAnimations();
        setupGalleryModal();
        setupGallery();
    }

    function handleImageError(img) {
        console.warn(`Failed to load image: ${img.src}`);
        img.style.display = 'none';
    }

    function buildImageUrl(iconPath) {
        if (!iconPath) return '';
        return iconPath.startsWith('http') ? iconPath : `${BASE_URL}${iconPath}`;
    }

    function getElement(id) {
        const element = document.getElementById(id);
        if (!element) {
            console.error(`Element with id "${id}" not found`);
        }
        return element;
    }
    
    function loadCarouselContent() {
        fetch('carrusel.html')
            .then(response => response.text())
            .then(data => {
                document.getElementById('carrusel-container').innerHTML = data;
                initCarousel();
            })
            .catch(error => console.error('Error loading carousel:', error));
    }

    function initCarousel() {
        console.log('Initializing carousel');
        const carousel = document.getElementById('carrusel-container');
        if (!carousel) {
            console.error('Carousel element not found');
            return;
        }
        console.log('Carousel element found:', carousel);

        const items = carousel.querySelectorAll('.carousel-item');
        if (items.length === 0) {
            console.error('No carousel items found');
            return;
        }
        console.log('Number of carousel items:', items.length);

        const prevBtn = carousel.querySelector('.carousel-control.prev');
        const nextBtn = carousel.querySelector('.carousel-control.next');
        if (!prevBtn || !nextBtn) {
            console.error('Carousel control buttons not found');
            return;
        }

        const itemWidth = items[0].offsetWidth;
        console.log('Item width:', itemWidth);
        let currentIndex = 0;

        function showSlide(index) {
            const carouselList = carousel.querySelector('.carousel');
            carouselList.style.transform = `translateX(-${index * itemWidth}px)`;
            currentIndex = index;
            console.log('Current index:', currentIndex);
            updateIndicators(index);
        }

        function nextSlide() {
            console.log('Next slide clicked');
            if (currentIndex < items.length - 1) {
                showSlide(currentIndex + 1);
            } else {
                showSlide(0);
            }
        }

        function prevSlide() {
            console.log('Previous slide clicked');
            if (currentIndex > 0) {
                showSlide(currentIndex - 1);
            } else {
                showSlide(items.length - 1);
            }
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

        // Actualiza las rutas de las imágenes solo para los elementos del carrusel
        items.forEach(item => {
            const img = item.querySelector('img');
            if (img) {
                const originalSrc = img.getAttribute('src');
                img.src = `${CAROUSEL_IMAGE_BASE_URL}${originalSrc}`;
            }
        });

        // Iniciar el carrusel
        showSlide(0);
        console.log('Carousel initialization complete');
    }

    function loadJSONData() {
        fetch('data.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.text();
            })
            .then(text => {
                try {
                    text = text.replace(/\$\{BASE_URL\}/g, BASE_URL);
                    const cleanedText = text.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
                    const data = JSON.parse(cleanedText);
                    console.log('JSON data loaded successfully:', data);
                    services = data.services;
                    renderServices('masajes');
                    renderPackages();
                    setupFilters();
                    setupServiceCategories();
                    setupPackageNav();
                    setupGallery();
                } catch (error) {
                    console.error('Error parsing JSON:', error);
                    console.error('Problematic JSON:', text);
                    throw error;
                }
            })
            .catch(error => {
                console.error('Error loading or parsing the JSON file:', error);
                const servicesList = getElement('services-list');
                const packageList = getElement('package-list');
                if (servicesList) servicesList.innerHTML = '<p>Error al cargar los servicios. Por favor, intente más tarde.</p>';
                if (packageList) packageList.innerHTML = '<p>Error al cargar los paquetes. Por favor, intente más tarde.</p>';
            });
    }

    function renderServices(category) {
        console.log(`Rendering services for category: ${category}`);
        const servicesList = document.getElementById('services-list');
        const template = document.getElementById('service-template');
        if (!servicesList || !template) {
            console.error('services-list or service-template not found');
            return;
        }

        servicesList.innerHTML = '';

        if (!Array.isArray(services[category])) {
            console.error(`services[${category}] is not an array:`, services[category]);
            servicesList.innerHTML = '<p>Error al cargar los servicios. Por favor, intente más tarde.</p>';
            return;
        }

        services[category].forEach((service, index) => {
            console.log(`Rendering service ${index + 1}:`, service);
            const serviceElement = template.content.cloneNode(true);
            
            const titleElement = serviceElement.querySelector('.service-title');
            if (titleElement) titleElement.textContent = service.title || 'Sin título';
            
            const serviceIcon = serviceElement.querySelector('.service-icon');
            if (serviceIcon && service.icon) {
                serviceIcon.src = buildImageUrl(service.icon);
                serviceIcon.onerror = () => handleImageError(serviceIcon);
            }
            
            const descriptionElement = serviceElement.querySelector('.service-description');
            if (descriptionElement) descriptionElement.textContent = service.description || 'Sin descripción';
            
            const benefitsContainer = serviceElement.querySelector('.benefits-container');
            if (benefitsContainer && Array.isArray(service.benefitsIcons)) {
                service.benefitsIcons.forEach((iconUrl, index) => {
                    const benefitItem = document.createElement('div');
                    benefitItem.classList.add('benefit-item');
                    const img = document.createElement('img');
                    img.src = buildImageUrl(iconUrl);
                    img.alt = 'Benefit icon';
                    img.classList.add('benefit-icon');
                    img.style.width = '48px';
                    img.style.height = '48px';
                    img.onerror = () => handleImageError(img);
                    const span = document.createElement('span');
                    span.textContent = service.benefits[index] || '';
                    benefitItem.appendChild(img);
                    benefitItem.appendChild(span);
                    benefitsContainer.appendChild(benefitItem);
                });
            }
            
            const durationIcon = serviceElement.querySelector('.duration-icon');
            if (durationIcon && service.durationIcon) {
                durationIcon.src = buildImageUrl(service.durationIcon);
                durationIcon.onerror = () => handleImageError(durationIcon);
            }
            
            const durationElement = serviceElement.querySelector('.service-duration');
            if (durationElement) durationElement.textContent = service.duration || 'Duración no especificada';

            const saberMasButton = serviceElement.querySelector('.saber-mas-button');
            if (saberMasButton) {
                saberMasButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    showPopup(service, index);
                });
            }

            const serviceItem = serviceElement.querySelector('.service-item');
            if (serviceItem) {
                if (Array.isArray(service.benefits)) {
                    service.benefits.forEach(benefit => {
                        serviceItem.classList.add(benefit.toLowerCase().replace(/\s+/g, '-'));
                    });
                }
            }

            const serviceBackground = serviceElement.querySelector('.service-background');
            if (serviceBackground && service.backgroundImage) {
                serviceBackground.style.backgroundImage = `url(${buildImageUrl(service.backgroundImage)})`;
            }

            servicesList.appendChild(serviceElement);
        });
        console.log(`Rendered ${services[category].length} services`);
    }

    function renderPackages() {
        console.log('Rendering packages');
        const packageList = getElement('package-list');
        const template = getElement('package-template');
        if (!packageList || !template) {
            console.error('Package list or template not found');
            return;
        }

        packageList.innerHTML = '';
        if (!Array.isArray(services.paquetes)) {
            console.error('services.paquetes is not an array:', services.paquetes);
            packageList.innerHTML = '<p>Error al cargar los paquetes. Por favor, intente más tarde.</p>';
            return;
        }
        
        services.paquetes.forEach((pkg, index) => {
            console.log(`Rendering package ${index + 1}:`, pkg);
            const packageElement = template.content.cloneNode(true);
            
            packageElement.querySelector('.package-title').textContent = pkg.title || 'Sin título';
            packageElement.querySelector('.package-description').textContent = pkg.description || 'Sin descripción';
            
            const includesList = packageElement.querySelector('.package-includes-list');
            if (includesList && Array.isArray(pkg.includes)) {
                pkg.includes.forEach(item => {
                    const li = document.createElement('li');
                    li.textContent = item;
                    includesList.appendChild(li);
                });
            }
            
            packageElement.querySelector('.package-duration-text').textContent = pkg.duration || 'Duración no especificada';
            
            const benefitsContainer = packageElement.querySelector('.package-benefits');
            if (benefitsContainer && Array.isArray(pkg.benefitsIcons)) {
                pkg.benefitsIcons.forEach((iconUrl, index) => {
                    const benefitItem = document.createElement('div');
                    benefitItem.classList.add('benefit-item');
                    const img = document.createElement('img');
                    img.src = buildImageUrl(iconUrl);
                    img.alt = 'Benefit icon';
                    img.classList.add('benefit-icon');
                    img.style.width = '48px';
                    img.style.height = '48px';
                    img.onerror = () => handleImageError(img);
                    const span = document.createElement('span');
                    span.textContent = pkg.benefits[index] || '';
                    benefitItem.appendChild(img);
                    benefitItem.appendChild(span);
                    benefitsContainer.appendChild(benefitItem);
                });
            }

            const saberMasButton = packageElement.querySelector('.saber-mas-button');
            if (saberMasButton) {
                saberMasButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    showPopup(pkg, index, true);
                });
            }

            const packageItem = packageElement.querySelector('.package-item');
            if (packageItem && pkg.type) {
                packageItem.classList.add(pkg.type.toLowerCase().replace(/\s+/g, '-'));
            }

            const packageBackground = packageElement.querySelector('.package-background');
            if (packageBackground && pkg.backgroundImage) {
                packageBackground.style.backgroundImage = `url(${buildImageUrl(pkg.backgroundImage)})`;
            }

            packageList.appendChild(packageElement);
        });
        console.log(`Rendered ${services.paquetes.length} packages`);
    }

    function showPopup(data, index, isPackage = false) {
        console.log('Showing popup for:', data.title);
        const popup = getElement('popup');
        const popupContent = popup.querySelector('.popup-content');
        const popupTitle = getElement('popup-title');
        const popupImage = getElement('popup-image');
        const popupDescription = getElement('popup-description');
        const popupBenefits = popup.querySelector('.popup-benefits');
        const popupIncludes = popup.querySelector('.popup-includes');
        const popupDuration = getElement('popup-duration');
        const whatsappButton = getElement('whatsapp-button');
        if (!popup || !popupContent || !popupTitle || !popupImage || !popupDescription || !popupBenefits || !popupIncludes || !popupDuration || !whatsappButton) {
            console.error('One or more popup elements not found');
            return;
        }

        currentPopupIndex = index;

        popupTitle.textContent = data.title || '';
        popupImage.src = buildImageUrl(data.popupImage || data.image);
        popupImage.alt = data.title || '';
        popupImage.onerror = () => handleImageError(popupImage);
        popupDescription.textContent = data.popupDescription || data.description || '';
        
        popupBenefits.innerHTML = '';
        popupIncludes.innerHTML = '';

        if (Array.isArray(data.benefits) && Array.isArray(data.benefitsIcons)) {
            data.benefits.forEach((benefit, index) => {
                const benefitItem = document.createElement('div');
                benefitItem.classList.add('popup-benefits-item');
                const img = document.createElement('img');
                img.src = buildImageUrl(data.benefitsIcons[index]);
                img.alt = benefit;
                const span = document.createElement('span');
                span.textContent = benefit;
                benefitItem.appendChild(img);
                benefitItem.appendChild(span);
                popupBenefits.appendChild(benefitItem);
            });
        }

        if (isPackage && Array.isArray(data.includes)) {
            data.includes.forEach(item => {
                const includeItem = document.createElement('div');
                includeItem.classList.add('popup-includes-item');
                const img = document.createElement('img');
                img.src = buildImageUrl('check-icon.webp');
                img.alt = 'Incluido';
                const span = document.createElement('span');
                span.textContent = item;
                includeItem.appendChild(img);
                includeItem.appendChild(span);
                popupIncludes.appendChild(includeItem);
            });
        }

        popupDuration.textContent = data.duration || '';

        whatsappButton.onclick = () => sendWhatsAppMessage('Reservar', data.title);

        setupPopupCarousel(isPackage);

        popup.style.display = 'block';
    }

    function setupPopupCarousel(isPackage) {
        const popupContent = document.querySelector('.popup-content');
        let startX, currentX;

        popupContent.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
        });

        popupContent.addEventListener('touchmove', (e) => {
            if (!startX) return;
            currentX = e.touches[0].clientX;
            const diff = startX - currentX;
            if (Math.abs(diff) > 50) {
                navigatePopup(diff > 0 ? 1 : -1, isPackage);
                startX = null;
            }
        });

        popupContent.addEventListener('touchend', () => {
            startX = null;
        });
    }

    function navigatePopup(direction, isPackage) {
        const items = isPackage ? services.paquetes : services[getCurrentCategory()];
        currentPopupIndex = (currentPopupIndex + direction + items.length) % items.length;
        showPopup(items[currentPopupIndex], currentPopupIndex, isPackage);
    }

    function getCurrentCategory() {
        const checkedRadio = document.querySelector('.service-category-toggle input[type="radio"]:checked');
        return checkedRadio ? checkedRadio.value : 'masajes';
    }

    function sendWhatsAppMessage(action, serviceTitle) {
        console.log(`Sending WhatsApp message for: ${action} - ${serviceTitle}`);
        const message = encodeURIComponent(`Hola! Quiero ${action} un ${serviceTitle}`);
        const url = `https://wa.me/5215640020305?text=${message}`;
        window.open(url, '_blank');
    }

    function setupServiceCategories() {
        const categoryInputs = document.querySelectorAll('.service-category-toggle input[type="radio"]');
        categoryInputs.forEach(input => {
            input.addEventListener('change', () => {
                const category = input.value;
                renderServices(category);
                setupBenefitsNav(category);
                setupPackageNav();
            });
        });
        setupBenefitsNav('masajes');
        setupPackageNav();
    }

    function setupBenefitsNav(category) {
        const benefitsNav = document.querySelector('.benefits-nav');
        if (!benefitsNav) return;

        benefitsNav.innerHTML = '';
        const allBenefits = new Set();
        const benefitIcons = new Map();
        const benefitAlternativeText = new Map();

        if (services[category]) {
            services[category].forEach(service => {
                if (Array.isArray(service.benefits) && Array.isArray(service.benefitsIcons)) {                        
                    service.benefits.forEach((benefit, index) => {
                        if (!allBenefits.has(benefit)) {
                            allBenefits.add(benefit);
                            benefitIcons.set(benefit, service.benefitsIcons[index]);
                            benefitAlternativeText.set(benefit, getAlternativeText(benefit));
                        }
                    });
                }
            });
        }

        const allButton = document.createElement('button');
        allButton.classList.add('benefit-btn', 'active');
        allButton.dataset.filter = 'all';
        allButton.innerHTML = `
            <img src="${BASE_URL}todos.webp" alt="Todos">
            <span class="visible-text">Todos</span>
            <span class="hidden-text visually-hidden">all</span>
        `;
        benefitsNav.appendChild(allButton);

        allBenefits.forEach(benefit => {
            const button = document.createElement('button');
            button.classList.add('benefit-btn');
            button.dataset.filter = benefit.toLowerCase().replace(/\s+/g, '-');
            
            const iconUrl = benefitIcons.get(benefit) || `${BASE_URL}${benefit.toLowerCase().replace(/\s+/g, '-')}.webp`;
            const alternativeText = benefitAlternativeText.get(benefit);
            
            button.innerHTML = `
                <img src="${buildImageUrl(iconUrl)}" alt="${benefit}">
                <span class="visible-text">${alternativeText}</span>
                <span class="hidden-text visually-hidden">${benefit}</span>
            `;
            benefitsNav.appendChild(button);
        });

        setupFilterButtons('.benefits-nav', '#services-list', '.service-item');
    }

    function getAlternativeText(benefit) {
        const alternativeTexts = {
            "Bajará tu Estrés": "Relax",
            "Cambiará tu Ánimo": "Ánimo",
            "Aliviarás Tensiones": "Alivio",
            "Aliviarás Dolores Musculares": "Músculos",
            "Mejorarás tu Circulación": "Circula",
            "Relajación Profunda": "Profundo",
            "Relajación": "Relax",
            "Alivio de Dolores en Espalda y Cuello": "Espalda",
            "Relajación Total": "Total",
            "Mejora Circulación Sanguínea": "Sangre",
            "Hidratará tu Piel": "Hidrata",
            "Multisensorial": "Sentidos",
            "Mejorarás tu Equilibrio": "Balance",
            "Reducirás el Estrés": "Anti-estrés",
            "Aumento de Energía": "Energía",
            "Alivio Dolor Muscular": "No dolor",
            "Reduce Ansiedad": "Calma",
            "Calma Profunda": "Sereno"
        };
        return alternativeTexts[benefit] || benefit;
    }

    function setupPackageNav() {
        const packageNav = document.querySelector('.package-nav');
        if (!packageNav) return;

        packageNav.innerHTML = '';
        const allPackages = new Set();

        if (services.paquetes) {
            services.paquetes.forEach(pkg => {
                allPackages.add(pkg.type || pkg.title);
            });
        }

        const allButton = document.createElement('button');
        allButton.classList.add('package-btn', 'active');
        allButton.dataset.filter = 'all';
        allButton.innerHTML = `
            <img src="${BASE_URL}todos.webp" alt="Todos">
            <span class="visible-text">Todos</span>
            <span class="hidden-text visually-hidden">all</span>
        `;
        packageNav.appendChild(allButton);

        allPackages.forEach(packageType => {
            const button = document.createElement('button');
            button.classList.add('package-btn');
            button.dataset.filter = packageType.toLowerCase().replace(/\s+/g, '-');
            const iconUrl = `${BASE_URL}${packageType.toLowerCase().replace(/\s+/g, '-')}-icon.webp`;
            const alternativeText = getAlternativeText(packageType);
            button.innerHTML = `
                <img src="${iconUrl}" alt="${packageType}">
                <span class="visible-text">${alternativeText}</span>
                <span class="hidden-text visually-hidden">${packageType}</span>
            `;
            packageNav.appendChild(button);
        });

        setupFilterButtons('.package-nav', '#package-list', '.package-item');
    }

    function setupPopup() {
        const popup = getElement('popup');
        const closeButton = popup.querySelector('.close');
        if (!popup || !closeButton) return;

        closeButton.innerHTML = `
            <span class="visually-hidden">Cerrar ventana emergente</span>
            X
        `;

        closeButton.addEventListener('click', () => {
            console.log('Closing popup');
            popup.style.display = 'none';
        });

        window.addEventListener('click', (event) => {
            if (event.target === popup) {
                console.log('Closing popup (clicked outside)');
                popup.style.display = 'none';
            }
        });
    }

    function setupGallery() {
        const galleryGrid = document.querySelector('.gallery-grid');
        const verMasButton = getElement('ver-mas-galeria');

        if (!galleryGrid || !verMasButton) {
            console.error('Gallery elements not found');
            return;
        }

        const galleryImages = [
            { src: 'QUESOSAHM.webp', title: 'Tabla Gourmet', description: 'Después de tu masaje en pareja saborea una exquisita selección de jamón curado, quesos gourmet, fresas cubiertas de chocolate y copas de vino. Un toque de lujo y placer compartido para complementar tu visita' },
            { src: 'quesoshm.webp', title: 'Chocolate Deluxe', description: 'Sumérgete en una experiencia de dulzura y relajación con nuestro tratamiento de chocolate' },
            { src: 'SILLAS.webp', title: 'Área de Relajación', description: 'Disfruta de nuestro acogedor espacio de relajación antes o después de tu masaje' },
            { src: 'paq41.webp', title: 'Chocolate Deluxe', description: 'Sumérgete en una experiencia de dulzura y relajación con nuestro tratamiento de chocolate' },
            { src: 'lujo2.webp', title: 'Chocolate Deluxe', description: 'Sumérgete en una experiencia de dulzura y relajación con nuestro tratamiento de chocolate' },
            { src: 'lujo.webp', title: 'Chocolate Deluxe', description: 'Sumérgete en una experiencia de dulzura y relajación con nuestro tratamiento de chocolate' },
            { src: 'ach.webp', title: 'Chocolate Deluxe', description: 'Sumérgete en una experiencia de dulzura y relajación con nuestro tratamiento de chocolate' },
            { src: 'paq2.webp', title: 'Chocolate Deluxe', description: 'Sumérgete en una experiencia de dulzura y relajación con nuestro tratamiento de chocolate' },
            { src: 'lujo2.webp', title: 'Chocolate Deluxe', description: 'Sumérgete en una experiencia de dulzura y relajación con nuestro tratamiento de chocolate' },
            { src: 'semillas.webp', title: 'Chocolate Deluxe', description: 'Sumérgete en una experiencia de dulzura y relajación con nuestro tratamiento de chocolate' },
            { src: 'rosa.webp', title: 'Chocolate Deluxe', description: 'Sumérgete en una experiencia de dulzura y relajación con nuestro tratamiento de chocolate' },
        ];

        galleryImages.forEach((image, index) => {
            const galleryItem = document.createElement('div');
            galleryItem.classList.add('gallery-item');
            galleryItem.innerHTML = `
                <img src="${buildImageUrl(image.src)}" alt="${image.title}">
                <div class="image-overlay">
                    <h3 class="image-title">${image.title}</h3>
                    <p class="image-description">${image.description}</p>
                </div>
                <a href="#" class="gallery-item-link" aria-label="Ver detalles de ${image.title}">
                    <span class="visually-hidden">Ver detalles de ${image.title}</span>
                </a>
            `;
            const link = galleryItem.querySelector('.gallery-item-link');
            link.addEventListener('click', (e) => {
                e.preventDefault();
                showImageDetails(image, index);
            });
            galleryGrid.appendChild(galleryItem);
        });

        verMasButton.addEventListener('click', () => {
            window.location.href = 'galeria.html';
        });
    }

    function showImageDetails(image, index) {
        const modal = getElement('imageModal');
        const modalImg = getElement('modalImage');
        const modalDescription = getElement('modalDescription');
        const closeButton = modal.querySelector('.close');

        if (!modal || !modalImg || !modalDescription || !closeButton) {
            console.error('Modal elements not found');
            return;
        }

        modalImg.src = buildImageUrl(image.src);
        modalImg.alt = image.title;
        modalDescription.innerHTML = `<h3>${image.title}</h3><p>${image.description}</p>`;
        
        closeButton.innerHTML = `
            <span class="visually-hidden">Cerrar imagen de ${image.title}</span>
            X
        `;

        const prevButton = document.createElement('button');
        prevButton.classList.add('nav-button', 'prev-button');
        prevButton.innerHTML = `
            <span class="visually-hidden">Imagen anterior</span>
            &lt;
        `;
        prevButton.addEventListener('click', () => navigateGallery(index - 1));

        const nextButton = document.createElement('button');
        nextButton.classList.add('nav-button', 'next-button');
        nextButton.innerHTML = `
            <span class="visually-hidden">Imagen siguiente</span>
            &gt;
        `;
        nextButton.addEventListener('click', () => navigateGallery(index + 1));

        modal.appendChild(prevButton);
        modal.appendChild(nextButton);

        modal.style.display = 'block';
    }

    function navigateGallery(newIndex) {
        const galleryImages = [
            { src: 'QUESOSAHM.webp', title: 'Tabla Gourmet', description: 'Después de tu masaje en pareja saborea una exquisita selección de jamón curado, quesos gourmet, fresas cubiertas de chocolate y copas de vino. Un toque de lujo y placer compartido para complementar tu visita' },
            { src: 'quesoshm.webp', title: 'Chocolate Deluxe', description: 'Sumérgete en una experiencia de dulzura y relajación con nuestro tratamiento de chocolate' },
            { src: 'SILLAS.webp', title: 'Área de Relajación', description: 'Disfruta de nuestro acogedor espacio de relajación antes o después de tu masaje' },
            { src: 'paq41.webp', title: 'Chocolate Deluxe', description: 'Sumérgete en una experiencia de dulzura y relajación con nuestro tratamiento de chocolate' },
            { src: 'lujo2.webp', title: 'Chocolate Deluxe', description: 'Sumérgete en una experiencia de dulzura y relajación con nuestro tratamiento de chocolate' },
            { src: 'lujo.webp', title: 'Chocolate Deluxe', description: 'Sumérgete en una experiencia de dulzura y relajación con nuestro tratamiento de chocolate' },
            { src: 'ach.webp', title: 'Chocolate Deluxe', description: 'Sumérgete en una experiencia de dulzura y relajación con nuestro tratamiento de chocolate' },
            { src: 'paq2.webp', title: 'Chocolate Deluxe', description: 'Sumérgete en una experiencia de dulzura y relajación con nuestro tratamiento de chocolate' },
            { src: 'lujo2.webp', title: 'Chocolate Deluxe', description: 'Sumérgete en una experiencia de dulzura y relajación con nuestro tratamiento de chocolate' },
            { src: 'semillas.webp', title: 'Chocolate Deluxe', description: 'Sumérgete en una experiencia de dulzura y relajación con nuestro tratamiento de chocolate' },
            { src: 'rosa.webp', title: 'Chocolate Deluxe', description: 'Sumérgete en una experiencia de dulzura y relajación con nuestro tratamiento de chocolate' },
        ];
        const wrappedIndex = (newIndex + galleryImages.length) % galleryImages.length;
        showImageDetails(galleryImages[wrappedIndex], wrappedIndex);
    }

    function setupGalleryAnimations() {
        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
            console.warn('GSAP or ScrollTrigger not loaded. Gallery animations will not work.');
            return;
        }

        console.log('GSAP and ScrollTrigger are loaded');
        gsap.registerPlugin(ScrollTrigger);

        const gallery = document.querySelector('.gallery-container');
        if (!gallery) {
            console.error('Gallery container not found');
            return;
        }

        console.log('Gallery container found');
        const images = gsap.utils.toArray('.gallery-container img');
        
        ScrollTrigger.create({
            trigger: gallery,
            start: "top 80%",
            end: "bottom 20%",
            onEnter: () => {
                console.log('Gallery entered viewport');
                gallery.classList.add('is-visible');
                animateImages();
            },
            onLeave: () => {
                console.log('Gallery left viewport');
                gallery.classList.remove('is-visible');
            },
            onEnterBack: () => {
                console.log('Gallery entered viewport (scrolling up)');
                gallery.classList.add('is-visible');
                animateImages();
            },
            onLeaveBack: () => {
                console.log('Gallery left viewport (scrolling up)');
                gallery.classList.remove('is-visible');
            }
        });

        function animateImages() {
            images.forEach((img, index) => {
                gsap.fromTo(img, 
                    { scale: 0.8, opacity: 0 },
                    { 
                        scale: 1, 
                        opacity: 1, 
                        duration: 0.5, 
                        ease: "power2.out",
                        delay: index * 0.1,
                        onStart: () => console.log(`Image ${index + 1} animation started`)
                    }
                );
            });
        }

        console.log(`Found ${images.length} images in the gallery`);
    }

    function setupGalleryModal() {
        const modal = getElement('imageModal');
        const closeBtn = modal.querySelector('.close');

        closeBtn.innerHTML = `
            <span class="visually-hidden">Cerrar imagen</span>
            X
        `;

        closeBtn.onclick = function() {
            modal.style.display = "none";
        }

        window.onclick = function(event) {
            if (event.target == modal) {
                modal.style.display = "none";
            }
        }
    }

    function setupFilters() {
        setupFilterButtons('.benefits-nav', '#services-list', '.service-item');
        setupFilterButtons('.package-nav', '#package-list', '.package-item');
    }

    function setupFilterButtons(navSelector, listSelector, itemSelector) {
        const filterButtons = document.querySelectorAll(`${navSelector} button`);
        const items = document.querySelectorAll(itemSelector);

        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                const filter = button.querySelector('.hidden-text').textContent.toLowerCase().replace(/\s+/g, '-');
                
                // Actualizar botones activos
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Filtrar elementos
                items.forEach(item => {
                    if (filter === 'all' || item.classList.contains(filter)) {
                        item.style.display = 'block';
                    } else {
                        item.style.display = 'none';
                    }
                });
            });
        });
    }

    // Manejo de errores de carga de imágenes
    document.querySelectorAll('img').forEach(img => {
        img.addEventListener('error', function() {
            this.src = 'https://raw.githubusercontent.com/elitemassagemx/Home/main/IMG/error.webp';
        });
    });
});
