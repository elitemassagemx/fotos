// Configuración global
const CONFIG = {
    BASE_URL: "https://raw.githubusercontent.com/elitemassagemx/Home/main/IMG/",
    CAROUSEL_IMAGE_BASE_URL: "https://raw.githubusercontent.com/elitemassagemx/prueba/main/carruimg/",
    DEFAULT_ERROR_IMAGE: "https://raw.githubusercontent.com/elitemassagemx/Home/main/IMG/error.webp",
    WHATSAPP_NUMBER: "5215640020305"
};

// Gestor de estado de la aplicación
const AppState = {
    services: {},
    currentPopupIndex: 0,
    eventListeners: new Map(),
    initialized: false,
    currentCategory: 'masajes'
};

// Gestor de eventos
const EventManager = {
    add(element, event, handler, options = false) {
        if (!element) {
            console.error('Cannot add event listener to null element');
            return;
        }

        element.addEventListener(event, handler, options);
        
        const key = `${element.id || 'anonymous'}-${event}`;
        AppState.eventListeners.set(key, { element, event, handler });
    },

    remove(element, event) {
        const key = `${element.id || 'anonymous'}-${event}`;
        const listener = AppState.eventListeners.get(key);
        
        if (listener) {
            listener.element.removeEventListener(listener.event, listener.handler);
            AppState.eventListeners.delete(key);
        }
    },

    removeAll() {
        AppState.eventListeners.forEach(listener => {
            listener.element.removeEventListener(listener.event, listener.handler);
        });
        AppState.eventListeners.clear();
    }
};

// Gestor de imágenes
const ImageManager = {
    async loadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => {
                console.warn(`Failed to load image: ${url}`);
                img.src = CONFIG.DEFAULT_ERROR_IMAGE;
                resolve(img);
            };
            img.src = url;
        });
    },

    handleImageError(img) {
        img.onerror = null;
        img.src = CONFIG.DEFAULT_ERROR_IMAGE;
        console.warn(`Image load failed: ${img.src}`);
    },

    buildImageUrl(iconPath) {
        if (!iconPath) return '';
        return iconPath.startsWith('http') ? iconPath : `${CONFIG.BASE_URL}${iconPath}`;
    }
};

// Gestor de DOM
const DOMManager = {
    getElement(id) {
        const element = document.getElementById(id);
        if (!element) {
            console.error(`Element with id "${id}" not found`);
        }
        return element;
    },

    createElement(tag, attributes = {}, children = []) {
        const element = document.createElement(tag);
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'textContent') {
                element.textContent = value;
            } else {
                element.setAttribute(key, value);
            }
        });
        children.forEach(child => element.appendChild(child));
        return element;
    }
};

// Controlador de servicios
const ServicesController = {
    async loadServices() {
        try {
            const response = await fetch('data.json');
            if (!response.ok) throw new Error('Network response was not ok');
            
            let text = await response.text();
            text = text.replace(/\$\{BASE_URL\}/g, CONFIG.BASE_URL)
                      .replace(/,\s*}/g, '}')
                      .replace(/,\s*]/g, ']');
            
            const data = JSON.parse(text);
            AppState.services = data.services;
            
            this.renderInitialServices();
            return true;
        } catch (error) {
            console.error('Error loading services:', error);
            this.handleServiceLoadError();
            return false;
        }
    },

    renderInitialServices() {
        this.renderServices('masajes');
        this.renderPackages();
        UIController.setupFilters();
        this.setupServiceCategories();
        this.setupPackageNav();
    },

    handleServiceLoadError() {
        const servicesList = DOMManager.getElement('services-list');
        const packageList = DOMManager.getElement('package-list');
        
        const errorMessage = '<p>Error al cargar los servicios. Por favor, intente más tarde.</p>';
        if (servicesList) servicesList.innerHTML = errorMessage;
        if (packageList) packageList.innerHTML = errorMessage;
    },

    renderServices(category) {
        console.log(`Rendering services for category: ${category}`);
        const servicesList = DOMManager.getElement('services-list');
        const template = DOMManager.getElement('service-template');
        
        if (!servicesList || !template) {
            console.error('Required elements not found');
            return;
        }

        servicesList.innerHTML = '';

        if (!Array.isArray(AppState.services[category])) {
            console.error(`Invalid services data for category: ${category}`);
            servicesList.innerHTML = '<p>Error al cargar los servicios.</p>';
            return;
        }

        AppState.services[category].forEach((service, index) => {
            const serviceElement = template.content.cloneNode(true);
            
            // Configurar elementos del servicio
            this.configureServiceElement(serviceElement, service, index);
            
            servicesList.appendChild(serviceElement);
        });
    },

    configureServiceElement(element, service, index) {
        const titleElement = element.querySelector('.service-title');
        const serviceIcon = element.querySelector('.service-icon');
        const descriptionElement = element.querySelector('.service-description');
        const benefitsContainer = element.querySelector('.benefits-container');
        const durationIcon = element.querySelector('.duration-icon');
        const durationElement = element.querySelector('.service-duration');
        const saberMasButton = element.querySelector('.saber-mas-button');
        const serviceItem = element.querySelector('.service-item');
        const serviceBackground = element.querySelector('.service-background');

        if (titleElement) titleElement.textContent = service.title || 'Sin título';
        
        if (serviceIcon && service.icon) {
            serviceIcon.src = ImageManager.buildImageUrl(service.icon);
            serviceIcon.onerror = () => ImageManager.handleImageError(serviceIcon);
        }
        
        if (descriptionElement) {
            descriptionElement.textContent = service.description || 'Sin descripción';
        }

        this.configureBenefits(benefitsContainer, service);

        if (durationIcon && service.durationIcon) {
            durationIcon.src = ImageManager.buildImageUrl(service.durationIcon);
            durationIcon.onerror = () => ImageManager.handleImageError(durationIcon);
        }

        if (durationElement) {
            durationElement.textContent = service.duration || 'Duración no especificada';
        }

        if (saberMasButton) {
            saberMasButton.addEventListener('click', (e) => {
                e.stopPropagation();
                PopupController.showPopup(service, index);
            });
        }

        if (serviceItem && Array.isArray(service.benefits)) {
            service.benefits.forEach(benefit => {
                serviceItem.classList.add(benefit.toLowerCase().replace(/\s+/g, '-'));
            });
        }

        if (serviceBackground && service.backgroundImage) {
            serviceBackground.style.backgroundImage = 
                `url(${ImageManager.buildImageUrl(service.backgroundImage)})`;
        }
    },

    configureBenefits(container, service) {
        if (!container || !Array.isArray(service.benefitsIcons)) return;

        service.benefitsIcons.forEach((iconUrl, index) => {
            const benefitItem = DOMManager.createElement('div', { className: 'benefit-item' });
            
            const img = DOMManager.createElement('img', {
                src: ImageManager.buildImageUrl(iconUrl),
                alt: 'Benefit icon',
                className: 'benefit-icon',
                style: 'width: 24px; height: 24px'
            });
            
            img.onerror = () => ImageManager.handleImageError(img);
            
            const span = DOMManager.createElement('span', {
                textContent: service.benefits[index] || ''
            });
            
            benefitItem.appendChild(img);
            benefitItem.appendChild(span);
            container.appendChild(benefitItem);
        });
    },

    renderPackages() {
        console.log('Rendering packages');
        const packageList = DOMManager.getElement('package-list');
        const template = DOMManager.getElement('package-template');
        
        if (!packageList || !template) {
            console.error('Package elements not found');
            return;
        }

        packageList.innerHTML = '';

        if (!Array.isArray(AppState.services.paquetes)) {
            console.error('Invalid package data');
            packageList.innerHTML = '<p>Error al cargar los paquetes.</p>';
            return;
        }

        AppState.services.paquetes.forEach((pkg, index) => {
            const packageElement = template.content.cloneNode(true);
            this.configurePackageElement(packageElement, pkg, index);
            packageList.appendChild(packageElement);
        });
    },

    configurePackageElement(element, pkg, index) {
        element.querySelector('.package-title').textContent = pkg.title || 'Sin título';
        element.querySelector('.package-description').textContent = pkg.description || 'Sin descripción';
        
        const includesList = element.querySelector('.package-includes-list');
        if (includesList && Array.isArray(pkg.includes)) {
            pkg.includes.forEach(item => {
                const li = document.createElement('li');
                li.textContent = item;
                includesList.appendChild(li);
            });
        }

        element.querySelector('.package-duration-text').textContent = 
            pkg.duration || 'Duración no especificada';

        this.configureBenefits(element.querySelector('.package-benefits'), pkg);

        const saberMasButton = element.querySelector('.saber-mas-button');
        if (saberMasButton) {
            saberMasButton.addEventListener('click', (e) => {
                e.stopPropagation();
                PopupController.showPopup(pkg, index, true);
            });
        }

        const packageItem = element.querySelector('.package-item');
        if (packageItem && pkg.type) {
            packageItem.classList.add(pkg.type.toLowerCase().replace(/\s+/g, '-'));
        }

        const packageBackground = element.querySelector('.package-background');
        if (packageBackground && pkg.backgroundImage) {
            packageBackground.style.backgroundImage = 
                `url(${ImageManager.buildImageUrl(pkg.backgroundImage)})`;
        }
    },

    setupServiceCategories() {
        const categoryInputs = document.querySelectorAll('.service-category-toggle input[type="radio"]');
        categoryInputs.forEach(input => {
            EventManager.add(input, 'change', () => {
                const category = input.value;
                AppState.currentCategory = category;
                this.renderServices(category);
                UIController.setupBenefitsNav(category);
                this.setupPackageNav();
            });
        });
        
        UIController.setupBenefitsNav('masajes');
        this.setupPackageNav();
    },

    setupPackageNav() {
        const packageNav = document.querySelector('.package-nav');
        if (!packageNav) return;

        packageNav.innerHTML = '';
        const allPackages = new Set();

        if (AppState.services.paquetes) {
            AppState.services.paquetes.forEach(pkg => {
                allPackages.add(pkg.type || pkg.title);
            });
        }

        UIController.createFilterButtons(packageNav, Array.from(allPackages), 'package');
    }
};

// Controlador de UI
const UIController = {
    setupFilters() {
        this.setupFilterButtons('.benefits-nav', '#services-list', '.service-item');
        this.setupFilterButtons('.package-nav', '#package-list', '.package-item');
    },

    setupFilterButtons(navSelector, listSelector, itemSelector) {
        const filterButtons = document.querySelectorAll(`${navSelector} button`);
        const items = document.querySelectorAll(itemSelector);

        filterButtons.forEach(button => {
            EventManager.add(button, 'click', () => {
                const filter = button.querySelector('.hidden-text').textContent
                    .toLowerCase().replace(/\s+/g, '-');
                
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                items.forEach(item => {
                    item.style.display = 
                        (filter === 'all' || item.classList.contains(filter)) 
                            ? 'block' 
                            : 'none';
                });
            });
        });
    },

    setupBenefitsNav(category) {
        const benefitsNav = document.querySelector('.benefits-nav');
        if (!benefitsNav) return;

        benefitsNav.innerHTML = '';
        const allBenefits = new Set();
        const benefitIcons = new Map();
        const benefitAlternativeText = new Map();

        if (AppState.services[category]) {
            AppState.services[category].forEach(service => {
                if (Array.isArray(service.benefits) && Array.isArray(service.benefitsIcons)) {
                    service.benefits.forEach((benefit, index) => {
                        if (!allBenefits.has(benefit)) {
                            allBenefits.add(benefit);
                            benefitIcons.set(benefit, service.benefitsIcons[index]);
                            benefitAlternativeText.set(benefit, this.getAlternativeText(benefit));
                        }
                    });
                }
            });
        }

        this.createFilterButtons(benefitsNav, Array.from(allBenefits), 'benefit', benefitIcons);
    },

    createFilterButtons(container, items, type, iconsMap = new Map()) {
        // Crear botón "Todos"
        const allButton = DOMManager.createElement('button', {
            className: `${type}-btn active`,
            'data-filter': 'all'
        });
        
        allButton.innerHTML = `
            <img src="${CONFIG.BASE_URL}todos.webp" alt="Todos">
            <span class="visible-text">Todos</span>
            <span class="hidden-text visually-hidden">all</span>
        `;
        container.appendChild(allButton);

        // Crear botones para cada item
        items.forEach(item => {
            const button = DOMManager.createElement('button', {
                className: `${type}-btn`,
                'data-filter': item.toLowerCase().replace(/\s+/g, '-')
            });
            
            const iconUrl = iconsMap.get(item) || 
                `${CONFIG.BASE_URL}${item.toLowerCase().replace(/\s+/g, '-')}.webp`;
            const alternativeText = this.getAlternativeText(item);
            
button.innerHTML = `
                <img src="${ImageManager.buildImageUrl(iconUrl)}" alt="${item}">
                <span class="visible-text">${alternativeText}</span>
                <span class="hidden-text visually-hidden">${item}</span>
            `;
            container.appendChild(button);
        });
    },

    getAlternativeText(text) {
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
        return alternativeTexts[text] || text;
    }
};

// Controlador de Popup
const PopupController = {
    init() {
        const popup = DOMManager.getElement('popup');
        const closeButton = popup.querySelector('.close');
        
        if (!popup || !closeButton) return;

        EventManager.add(closeButton, 'click', () => {
            console.log('Closing popup');
            popup.style.display = 'none';
        });

        EventManager.add(window, 'click', (event) => {
            if (event.target === popup) {
                console.log('Closing popup (clicked outside)');
                popup.style.display = 'none';
            }
        });

        this.setupPopupCarousel();
    },

    showPopup(data, index, isPackage = false) {
        console.log('Showing popup for:', data.title);
        const popup = DOMManager.getElement('popup');
        const elements = {
            content: popup.querySelector('.popup-content'),
            title: DOMManager.getElement('popup-title'),
            image: DOMManager.getElement('popup-image'),
            description: DOMManager.getElement('popup-description'),
            benefits: popup.querySelector('.popup-benefits'),
            includes: popup.querySelector('.popup-includes'),
            duration: DOMManager.getElement('popup-duration'),
            whatsappButton: DOMManager.getElement('whatsapp-button')
        };

        if (!this.validatePopupElements(elements)) return;

        AppState.currentPopupIndex = index;
        this.populatePopupContent(elements, data, isPackage);
        popup.style.display = 'block';
    },

    validatePopupElements(elements) {
        for (const [key, element] of Object.entries(elements)) {
            if (!element) {
                console.error(`Popup element missing: ${key}`);
                return false;
            }
        }
        return true;
    },

    populatePopupContent(elements, data, isPackage) {
        elements.title.textContent = data.title || '';
        elements.image.src = ImageManager.buildImageUrl(data.popupImage || data.image);
        elements.image.alt = data.title || '';
        elements.image.onerror = () => ImageManager.handleImageError(elements.image);
        elements.description.textContent = data.popupDescription || data.description || '';
        
        elements.benefits.innerHTML = '';
        elements.includes.innerHTML = '';

        this.populateBenefits(elements.benefits, data);
        if (isPackage) {
            this.populateIncludes(elements.includes, data);
        }

        elements.duration.textContent = data.duration || '';
        elements.whatsappButton.onclick = () => 
            this.sendWhatsAppMessage('Reservar', data.title);
    },

    populateBenefits(container, data) {
        if (Array.isArray(data.benefits) && Array.isArray(data.benefitsIcons)) {
            data.benefits.forEach((benefit, index) => {
                const benefitItem = DOMManager.createElement('div', {
                    className: 'popup-benefits-item'
                });
                
                const img = DOMManager.createElement('img', {
                    src: ImageManager.buildImageUrl(data.benefitsIcons[index]),
                    alt: benefit
                });
                
                const span = DOMManager.createElement('span', {
                    textContent: benefit
                });
                
                benefitItem.appendChild(img);
                benefitItem.appendChild(span);
                container.appendChild(benefitItem);
            });
        }
    },

    populateIncludes(container, data) {
        if (Array.isArray(data.includes)) {
            data.includes.forEach(item => {
                const includeItem = DOMManager.createElement('div', {
                    className: 'popup-includes-item'
                });
                
                const img = DOMManager.createElement('img', {
                    src: ImageManager.buildImageUrl('check-icon.webp'),
                    alt: 'Incluido'
                });
                
                const span = DOMManager.createElement('span', {
                    textContent: item
                });
                
                includeItem.appendChild(img);
                includeItem.appendChild(span);
                container.appendChild(includeItem);
            });
        }
    },

    setupPopupCarousel() {
        const popupContent = document.querySelector('.popup-content');
        let startX, currentX;

        EventManager.add(popupContent, 'touchstart', (e) => {
            startX = e.touches[0].clientX;
        });

        EventManager.add(popupContent, 'touchmove', (e) => {
            if (!startX) return;
            currentX = e.touches[0].clientX;
            const diff = startX - currentX;
            if (Math.abs(diff) > 50) {
                this.navigatePopup(diff > 0 ? 1 : -1);
                startX = null;
            }
        });

        EventManager.add(popupContent, 'touchend', () => {
            startX = null;
        });
    },

    navigatePopup(direction, isPackage = false) {
        const items = isPackage ? AppState.services.paquetes : AppState.services[AppState.currentCategory];
        AppState.currentPopupIndex = 
            (AppState.currentPopupIndex + direction + items.length) % items.length;
        this.showPopup(items[AppState.currentPopupIndex], AppState.currentPopupIndex, isPackage);
    },

    sendWhatsAppMessage(action, serviceTitle) {
        console.log(`Sending WhatsApp message for: ${action} - ${serviceTitle}`);
        const message = encodeURIComponent(`Hola! Quiero ${action} un ${serviceTitle}`);
        const url = `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${message}`;
        window.open(url, '_blank');
    }
};

// Controlador de Galería
const GalleryController = {
    init() {
        this.setupGallery();
        this.setupGalleryAnimations();
        this.setupGalleryModal();
    },

    setupGallery() {
        const galleryGrid = document.querySelector('.gallery-grid');
        const verMasButton = DOMManager.getElement('ver-mas-galeria');

        if (!galleryGrid || !verMasButton) {
            console.error('Gallery elements not found');
            return;
        }

        const galleryImages = [
            {
                src: 'QUESOSAHM.webp',
                title: 'Tabla Gourmet',
                description: 'Después de tu masaje en pareja saborea una exquisita selección de jamón curado, quesos gourmet, fresas cubiertas de chocolate y copas de vino. Un toque de lujo y placer compartido para complementar tu visita'
            },
            {
                src: 'choco2.webp',
                title: 'Chocolate Deluxe',
                description: 'Sumérgete en una experiencia de dulzura y relajación con nuestro tratamiento de chocolate'
            },
            {
                src: 'SILLAS.webp',
                title: 'Área de Relajación',
                description: 'Disfruta de nuestro acogedor espacio de relajación antes o después de tu masaje'
            }
        ];

        galleryImages.forEach(image => {
            const galleryItem = this.createGalleryItem(image);
            galleryGrid.appendChild(galleryItem);
        });

        EventManager.add(verMasButton, 'click', () => {
            window.location.href = 'galeria.html';
        });
    },

    createGalleryItem(image) {
        const galleryItem = DOMManager.createElement('div', {
            className: 'gallery-item'
        });

        galleryItem.innerHTML = `
            <img src="${ImageManager.buildImageUrl(image.src)}" alt="${image.title}">
            <div class="image-overlay">
                <h3 class="image-title">${image.title}</h3>
                <p class="image-description">${image.description}</p>
            </div>
        `;

        EventManager.add(galleryItem, 'click', () => {
            this.showImageDetails(image);
        });

        return galleryItem;
    },

    showImageDetails(image) {
        const modal = DOMManager.getElement('imageModal');
        const modalImg = DOMManager.getElement('modalImage');
        const modalDescription = DOMManager.getElement('modalDescription');

        if (!modal || !modalImg || !modalDescription) {
            console.error('Modal elements not found');
            return;
        }

        modalImg.src = ImageManager.buildImageUrl(image.src);
        modalImg.alt = image.title;
        modalDescription.innerHTML = `<h3>${image.title}</h3><p>${image.description}</p>`;
        modal.style.display = 'block';
    },

    setupGalleryAnimations() {
        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
            console.warn('GSAP or ScrollTrigger not loaded');
            return;
        }

        gsap.registerPlugin(ScrollTrigger);

        const gallery = document.querySelector('.gallery-container');
        if (!gallery) return;

        const images = gsap.utils.toArray('.gallery-container img');
        
        ScrollTrigger.create({
            trigger: gallery,
            start: "top 80%",
            end: "bottom 20%",
            onEnter: () => {
                gallery.classList.add('is-visible');
                this.animateImages(images);
            },
            onLeave: () => gallery.classList.remove('is-visible'),
            onEnterBack: () => {
                gallery.classList.add('is-visible');
                this.animateImages(images);
            },
            onLeaveBack: () => gallery.classList.remove('is-visible')
        });
    },

    animateImages(images) {
        images.forEach((img, index) => {
            gsap.fromTo(img, 
                { scale: 0.8, opacity: 0 },
                { 
                    scale: 1, 
                    opacity: 1, 
                    duration: 0.5, 
                    ease: "power2.out",
                    delay: index * 0.1
                }
            );
        });
    },

    setupGalleryModal() {
        const modal = DOMManager.getElement('imageModal');
        const closeBtn = modal.querySelector('.close');

        EventManager.add(closeBtn, 'click', () => {
            modal.style.display = "none";
        });

        EventManager.add(window, 'click', (event) => {
            if (event.target === modal) {
                modal.style.display = "none";
            }
        });
    }
};

// Controlador de Carousel
const CarouselController = {
    async loadCarouselContent() {
        try {
            const response = await fetch('carrusel.html');
            const data = await response.text();
            const container = DOMManager.getElement('carrusel-container');
            if (container) {
                container.innerHTML = data;
                setTimeout(() => this.initCarousel(), 500);
            }
        } catch (error) {
            console.error('Error loading carousel:', error);
        }
    },

    async loadPaqcarrContent() {
        try {
            const response = await fetch('paqcarr.html');
            const data = await response.text();
            const container = DOMManager.getElement('paqcarr-container');
            if (container) {
                container.innerHTML = data;
                this.initPaqcarr();
            }
        } catch (error) {
            console.error('Error loading paqcarr:', error);
        }
    },

    initCarousel() {
        const carousel = DOMManager.getElement('carrusel-container');
        if (!carousel) return;

        const items = carousel.querySelectorAll('.carousel-item');
        if (items.length === 0) return;

        const prevBtn = carousel.querySelector('.carousel-control.prev');
        const nextBtn = carousel.querySelector('.carousel-control.next');
        if (!prevBtn || !nextBtn) return;

        const itemWidth = items[0].offsetWidth;
        let currentIndex = 0;

        const showSlide = (index) => {
            const carouselList = carousel.querySelector('.carousel');
            carouselList.style.transform = `translateX(-${index * itemWidth}px)`;
            currentIndex = index;
            this.updateIndicators(carousel, index);
        };

        EventManager.add(nextBtn, 'click', () => {
            showSlide((currentIndex + 1) % items.length);
        });

        EventManager.add(prevBtn, 'click', () => {
            showSlide((currentIndex - 1 + items.length) % items.length);
        });

        // Setup indicators
        const indicators = carousel.querySelectorAll('.carousel-indicators button');
        indicators.forEach((indicator, index) => {
            EventManager.add(indicator, 'click', () => showSlide(index));
        });

        // Update image sources
        items.forEach(item => {
            const img = item.querySelector('img');
            if (img) {
                const originalSrc = img.getAttribute('src');
                img.src = `${CONFIG.CAROUSEL_IMAGE_BASE_URL}${originalSrc}`;
            }
        });

        // Initialize carousel
        showSlide(0);

        // Keyboard navigation
        EventManager.add(carousel, 'keydown', (e) => {
            if (e.key === 'ArrowRight') {
                showSlide((currentIndex + 1) % items.length);
            } else if (e.key === 'ArrowLeft') {
                showSlide((currentIndex - 1 + items.length) % items.length);
            }
        });

// Touch navigation (continuación)
        let touchstartX = 0;
        let touchendX = 0;

        EventManager.add(carousel, 'touchstart', (e) => {
            touchstartX = e.changedTouches[0].screenX;
        });

        EventManager.add(carousel, 'touchend', (e) => {
            touchendX = e.changedTouches[0].screenX;
            if (touchendX < touchstartX) {
                showSlide((currentIndex + 1) % items.length);
            }
            if (touchendX > touchstartX) {
                showSlide((currentIndex - 1 + items.length) % items.length);
            }
        });
    },

    updateIndicators(carousel, index) {
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
};

// Controlador de navegación responsive
const ResponsiveController = {
    init() {
        this.setupResponsiveNavigation();
        this.setupScrollHandling();
        this.setupResizeHandling();
        this.initializeMediaQueries();
    },

    setupResponsiveNavigation() {
        const navLinks = document.querySelectorAll('nav a');
        navLinks.forEach(link => {
            EventManager.add(link, 'click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const targetSection = DOMManager.getElement(targetId);
                if (targetSection) {
                    targetSection.scrollIntoView({ 
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    },

    setupScrollHandling() {
        let lastScroll = 0;
        const header = DOMManager.getElement('main-header');
        const fixedBar = document.querySelector('.fixed-bar');

        EventManager.add(window, 'scroll', () => {
            const currentScroll = window.pageYOffset;
            
            // Header visibility
            if (header) {
                header.classList.toggle('scrolled', currentScroll > 100);
                header.classList.toggle('header-hidden', currentScroll > lastScroll && currentScroll > 200);
            }

            // Fixed bar visibility
            if (fixedBar) {
                fixedBar.classList.toggle('bar-hidden', currentScroll < lastScroll);
            }

            lastScroll = currentScroll;
        });
    },

    setupResizeHandling() {
        const handleResize = () => {
            const width = window.innerWidth;
            document.body.classList.toggle('is-mobile', width < 768);
            document.body.classList.toggle('is-tablet', width >= 768 && width < 1024);
            document.body.classList.toggle('is-desktop', width >= 1024);
            
            this.adjustLayoutForScreenSize(width);
        };

        EventManager.add(window, 'resize', handleResize);
        handleResize(); // Initial call
    },

    adjustLayoutForScreenSize(width) {
        if (width < 768) {
            this.optimizeForMobile();
        } else if (width < 1024) {
            this.optimizeForTablet();
        } else {
            this.optimizeForDesktop();
        }
    },

    optimizeForMobile() {
        // Ajustar tamaños de fuente para móvil
        document.documentElement.style.setProperty('--base-font-size', '14px');
        document.documentElement.style.setProperty('--heading-font-size', '1.5rem');
        
        // Optimizar espaciado
        document.documentElement.style.setProperty('--container-padding', '10px');
        document.documentElement.style.setProperty('--section-spacing', '30px');
        
        // Ajustar grid layouts
        const grids = document.querySelectorAll('.services-grid, .gallery-grid, .package-grid');
        grids.forEach(grid => {
            grid.style.gridTemplateColumns = '1fr';
            grid.style.gap = '15px';
        });
    },

    optimizeForTablet() {
        // Configuraciones para tablet
        document.documentElement.style.setProperty('--base-font-size', '15px');
        document.documentElement.style.setProperty('--heading-font-size', '1.75rem');
        document.documentElement.style.setProperty('--container-padding', '20px');
        document.documentElement.style.setProperty('--section-spacing', '40px');
    },

    optimizeForDesktop() {
        // Restaurar configuraciones desktop
        document.documentElement.style.setProperty('--base-font-size', '16px');
        document.documentElement.style.setProperty('--heading-font-size', '2rem');
        document.documentElement.style.setProperty('--container-padding', '30px');
        document.documentElement.style.setProperty('--section-spacing', '60px');
    },

    initializeMediaQueries() {
        // Observar cambios en el modo oscuro
        const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        darkModeMediaQuery.addListener(e => this.handleDarkModeChange(e));
        
        // Observar cambios en la preferencia de movimiento reducido
        const reducedMotionMediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        reducedMotionMediaQuery.addListener(e => this.handleReducedMotionChange(e));
    },

    handleDarkModeChange(e) {
        document.body.classList.toggle('dark-mode', e.matches);
    },

    handleReducedMotionChange(e) {
        document.body.classList.toggle('reduced-motion', e.matches);
    }
};

// Inicialización de la aplicación
const App = {
    async init() {
        if (AppState.initialized) {
            console.warn('App already initialized');
            return;
        }

        try {
            console.log('Initializing application...');
            
            // Inicializar controladores principales
            ResponsiveController.init();
            await ServicesController.loadServices();
            PopupController.init();
            GalleryController.init();
            await CarouselController.loadCarouselContent();
            await CarouselController.loadPaqcarrContent();
            
            // Configurar event listeners globales
            this.setupGlobalEventListeners();
            
            // Optimizar imágenes
            this.setupLazyLoading();
            
            AppState.initialized = true;
            console.log('Application initialized successfully');
        } catch (error) {
            console.error('Error during initialization:', error);
            this.handleInitializationError(error);
        }
    },

    setupGlobalEventListeners() {
        // Manejar errores de imagen globalmente
        document.querySelectorAll('img').forEach(img => {
            EventManager.add(img, 'error', () => ImageManager.handleImageError(img));
        });

        // Manejar cierre de popups con Escape
        EventManager.add(document, 'keydown', (e) => {
            if (e.key === 'Escape') {
                const popup = DOMManager.getElement('popup');
                const imageModal = DOMManager.getElement('imageModal');
                if (popup) popup.style.display = 'none';
                if (imageModal) imageModal.style.display = 'none';
            }
        });
    },

    setupLazyLoading() {
        const imageObserver = new IntersectionObserver(
            (entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                        }
                        observer.unobserve(img);
                    }
                });
            },
            { rootMargin: '50px' }
        );

        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    },

    handleInitializationError(error) {
        const mainContainer = DOMManager.getElement('main');
        if (mainContainer) {
            mainContainer.innerHTML = `
                <div class="error-container">
                    <h2>Lo sentimos, ha ocurrido un error</h2>
                    <p>Por favor, intente recargar la página</p>
                    <button onclick="location.reload()">Recargar página</button>
                </div>
            `;
        }
    },

    cleanup() {
        EventManager.removeAll();
        AppState.initialized = false;
        console.log('Application cleanup completed');
    }
};

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', () => App.init());

// Limpieza cuando la página se descarga
window.addEventListener('unload', () => App.cleanup());

// Exportar para uso externo
window.App = App;
