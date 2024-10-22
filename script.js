// ==========================================
// CONFIGURACIÓN BASE Y GESTORES PRINCIPALES
// ==========================================

// Configuración global
const CONFIG = {
    BASE_URL: "https://raw.githubusercontent.com/elitemassagemx/Home/main/IMG/",
    CAROUSEL_IMAGE_BASE_URL: "https://raw.githubusercontent.com/elitemassagemx/prueba/main/carruimg/",
    DEFAULT_ERROR_IMAGE: "https://raw.githubusercontent.com/elitemassagemx/Home/main/IMG/error.webp",
    WHATSAPP_NUMBER: "5215640020305",
    ANIMATION_DURATION: 300,
    CACHE_DURATION: 3600000, // 1 hora
    DEBUG: true
};

// Gestor de estado de la aplicación
const AppState = {
    services: {},
    currentPopupIndex: 0,
    eventListeners: new Map(),
    initialized: false,
    currentCategory: 'masajes',
    isSecondCategory: false,
    activeBenefit: 'all',
    loading: false,
    error: null,
    cache: new Map()
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
    },

    preloadImages(urls) {
        return Promise.all(urls.map(url => this.loadImage(url)));
    }
};

// Gestor de DOM
const DOMManager = {
    getElement(id) {
        const element = document.getElementById(id);
        if (!element && CONFIG.DEBUG) {
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
    },

    removeElement(element) {
        if (element && element.parentNode) {
            element.parentNode.removeChild(element);
        }
    },

    clearContainer(container) {
        if (container) {
            while (container.firstChild) {
                container.removeChild(container.firstChild);
            }
        }
    },

    setVisible(element, visible) {
        if (element) {
            element.style.display = visible ? 'block' : 'none';
        }
    },

    addClass(element, className) {
        element?.classList.add(className);
    },

    removeClass(element, className) {
        element?.classList.remove(className);
    },

    toggleClass(element, className, force) {
        element?.classList.toggle(className, force);
    }
};

// Sistema de Caché
const CacheManager = {
    cache: new Map(),
    
    set(key, value, ttl = CONFIG.CACHE_DURATION) {
        const item = {
            value,
            expiry: Date.now() + ttl
        };
        this.cache.set(key, item);
    },

    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        
        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }
        
        return item.value;
    },

    clear() {
        this.cache.clear();
    },

    remove(key) {
        this.cache.delete(key);
    }
};

// Gestor de Errores
const ErrorHandler = {
    errors: [],
    
    log(error, context = '') {
        const errorInfo = {
            error,
            context,
            timestamp: new Date(),
            stack: error.stack
        };
        
        this.errors.push(errorInfo);
        if (CONFIG.DEBUG) {
            console.error(`Error in ${context}:`, error);
        }
        
        return errorInfo;
    },

    getLastError() {
        return this.errors[this.errors.length - 1];
    },

    clearErrors() {
        this.errors = [];
    },

    showErrorMessage(message, container) {
        const errorDiv = DOMManager.createElement('div', {
            className: 'error-message'
        });
        errorDiv.textContent = message;
        container.appendChild(errorDiv);
        
        setTimeout(() => DOMManager.removeElement(errorDiv), 5000);
    },

    handleApiError(error) {
        this.log(error, 'API Error');
        return {
            success: false,
            error: error.message || 'Se produjo un error desconocido'
        };
    }
};

// ==========================================
// CONTROLADORES PRINCIPALES
// ==========================================

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
            ErrorHandler.log(error, 'Loading services');
            this.handleServiceLoadError();
            return false;
        }
    },

    handleServiceLoadError() {
        const servicesList = DOMManager.getElement('services-list');
        const packageList = DOMManager.getElement('package-list');
        
        const errorMessage = '<p>Error al cargar los servicios. Por favor, intente más tarde.</p>';
        if (servicesList) servicesList.innerHTML = errorMessage;
        if (packageList) packageList.innerHTML = errorMessage;
    },

    renderInitialServices() {
        this.renderServices(AppState.currentCategory);
        UIController.setupFilters();
        this.setupServiceCategories();
    },

    renderServices(category) {
        const servicesList = DOMManager.getElement('services-grid');
        if (!servicesList) return;

        servicesList.innerHTML = '';
        const services = AppState.services[category];

        if (!Array.isArray(services)) {
            console.error(`Invalid services data for category: ${category}`);
            servicesList.innerHTML = '<p>Error al cargar los servicios.</p>';
            return;
        }

        services.forEach((service, index) => {
            const serviceElement = this.createServiceElement(service, index);
            servicesList.appendChild(serviceElement);
        });

        if (AppState.activeBenefit !== 'all') {
            this.filterServicesByBenefit(AppState.activeBenefit);
        }
    },

    createServiceElement(service, index) {
        const element = DOMManager.createElement('div');
        const benefitClasses = service.benefits ? 
            service.benefits.map(b => b.toLowerCase().replace(/\s+/g, '-')).join(' ') : '';
        
        element.className = `service-item ${benefitClasses}`;
        
        element.innerHTML = `
            <div class="service-background" style="background-image: url(${ImageManager.buildImageUrl(service.backgroundImage)})"></div>
            <div class="service-content">
                <div class="service-header">
                    <img src="${ImageManager.buildImageUrl(service.icon)}" alt="" class="service-icon">
                    <h3 class="service-title">${service.title}</h3>
                </div>
                <p class="service-description">${service.description}</p>
                ${this.renderBenefits(service)}
                <div class="duration-container">
                    <img src="${ImageManager.buildImageUrl('duration-icon.webp')}" alt="" class="duration-icon">
                    <span class="service-duration">${service.duration}</span>
                </div>
                <button class="saber-mas-button">Saber más</button>
            </div>
        `;

        const saberMasButton = element.querySelector('.saber-mas-button');
        if (saberMasButton) {
            EventManager.add(saberMasButton, 'click', () => {
                PopupController.showPopup(service, index);
            });
        }

        return element;
    },

    renderBenefits(service) {
        if (!Array.isArray(service.benefits) || !Array.isArray(service.benefitsIcons)) {
            return '';
        }

        return `
            <div class="benefits-container">
                ${service.benefits.map((benefit, index) => `
                    <div class="benefit-item">
                        <img src="${ImageManager.buildImageUrl(service.benefitsIcons[index])}" 
                             alt="${benefit}" 
                             class="benefit-icon">
                        <span>${benefit}</span>
                    </div>
                `).join('')}
            </div>
        `;
    },

    filterServicesByBenefit(benefit) {
        const services = document.querySelectorAll('.service-item');
        services.forEach(service => {
            if (benefit === 'all') {
                service.style.display = 'block';
            } else {
                const hasFilter = service.classList.contains(benefit);
                service.style.display = hasFilter ? 'block' : 'none';
            }
        });
    },

    setupServiceCategories() {
        const categoryGroups = document.querySelectorAll('.service-category-toggle');
        
        categoryGroups.forEach((group, groupIndex) => {
            const inputs = group.querySelectorAll('input[type="radio"]');
            inputs.forEach(input => {
                EventManager.add(input, 'change', () => {
                    const category = input.value;
                    AppState.currentCategory = category;
                    AppState.isSecondCategory = groupIndex === 1;
                    
                    this.renderServices(category);
                    UIController.setupBenefitsNav(category);

                    // Sincronizar los radio buttons entre grupos
                    const otherGroup = groupIndex === 0 ? categoryGroups[1] : categoryGroups[0];
                    const correspondingInput = otherGroup.querySelector(`input[value="${category}"]`);
                    if (correspondingInput) {
                        correspondingInput.checked = true;
                    }
                });
            });
        });

        // Configuración inicial
        UIController.setupBenefitsNav('masajes');
    },

    setupPackageNav() {
        const packageNav = document.querySelector('.package-nav');
        if (!packageNav) return;

        packageNav.innerHTML = '';
        const allPackages = new Set();
        const packageIcons = new Map();

        if (AppState.services.paquetes) {
            AppState.services.paquetes.forEach(pkg => {
                if (pkg.type) {
                    allPackages.add(pkg.type);
                    if (pkg.icon) {
                        packageIcons.set(pkg.type, pkg.icon);
                    }
                }
            });
        }

        UIController.createFilterButtons(packageNav, Array.from(allPackages), 'package', packageIcons);
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

    configureBenefits(container, service) {
        if (!container || !Array.isArray(service.benefitsIcons)) return;

        service.benefitsIcons.forEach((iconUrl, index) => {
            const benefitItem = DOMManager.createElement('div', { 
                className: 'benefit-item'
            });
            
            const img = DOMManager.createElement('img', {
                src: ImageManager.buildImageUrl(iconUrl),
                alt: service.benefits[index] || 'Benefit icon',
                className: 'benefit-icon'
            });
            
            const span = DOMManager.createElement('span', {
                textContent: service.benefits[index] || ''
            });
            
            benefitItem.appendChild(img);
            benefitItem.appendChild(span);
            container.appendChild(benefitItem);
        });
    }
};


// ==========================================
// CONTROLADORES DE UI Y POPUP
// ==========================================

// Controlador de UI
const UIController = {
    setupFilters() {
        this.setupBenefitsNav(AppState.currentCategory);
        this.setupFilterButtons('.benefits-nav', '#services-list', '.service-item');
        this.setupFilterButtons('.package-nav', '#package-list', '.package-item');
    },

    setupBenefitsNav(category) {
        const benefitsNav = document.querySelector('.benefits-nav');
        if (!benefitsNav) return;

        benefitsNav.innerHTML = '';
        const allBenefits = new Set();
        const benefitIcons = new Map();

        if (AppState.services[category]) {
            AppState.services[category].forEach(service => {
                if (Array.isArray(service.benefits) && Array.isArray(service.benefitsIcons)) {
                    service.benefits.forEach((benefit, index) => {
                        if (!allBenefits.has(benefit)) {
                            allBenefits.add(benefit);
                            benefitIcons.set(benefit, service.benefitsIcons[index]);
                        }
                    });
                }
            });
        }

        // Crear botón "Todos"
        const allButton = this.createBenefitButton('Todos', 'todos.webp', 'all');
        benefitsNav.appendChild(allButton);

        // Crear botones para cada beneficio
        Array.from(allBenefits).forEach(benefit => {
            const button = this.createBenefitButton(
                this.getShortBenefitText(benefit),
                benefitIcons.get(benefit),
                benefit.toLowerCase().replace(/\s+/g, '-')
            );
            benefitsNav.appendChild(button);
        });
    },

    createBenefitButton(text, iconUrl, filter) {
        const button = DOMManager.createElement('button', {
            className: `benefit-btn ${filter === 'all' ? 'active' : ''}`,
            'data-filter': filter
        });

        button.innerHTML = `
            <img src="${ImageManager.buildImageUrl(iconUrl)}" alt="${text}">
            <span class="visible-text">${text}</span>
            <span class="hidden-text">${filter}</span>
        `;

        EventManager.add(button, 'click', () => {
            document.querySelectorAll('.benefit-btn').forEach(btn => 
                btn.classList.remove('active'));
            button.classList.add('active');
            AppState.activeBenefit = filter;
            ServicesController.filterServicesByBenefit(filter);
        });

        return button;
    },

    getShortBenefitText(text) {
        const shortTexts = {
            "Relajación Profunda": "Relax",
            "Alivio de Tensiones": "Alivio",
            "Mejora Circulación": "Circula",
            "Hidratará tu Piel": "Hidrata",
            "Multisensorial": "Sentidos",
            "Mejorarás tu Equilibrio": "Balance",
            "Reducirás el Estrés": "Anti-estrés",
            "Aumento de Energía": "Energía",
            "Alivio Dolor Muscular": "No dolor",
            "Reduce Ansiedad": "Calma",
            "Calma Profunda": "Sereno"
        };
        return shortTexts[text] || text;
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

    createFilterButtons(container, items, type, iconsMap = new Map()) {
        // Crear botón "Todos"
        const allButton = DOMManager.createElement('button', {
            className: `${type}-btn active`,
            'data-filter': 'all'
        });

        allButton.innerHTML = `
            <img src="${CONFIG.BASE_URL}todos.webp" alt="Todos" class="filter-icon">
            <span class="visible-text">Todos</span>
            <span class="hidden-text">all</span>
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
            const alternativeText = this.getShortBenefitText(item);
            
            button.innerHTML = `
                <img src="${ImageManager.buildImageUrl(iconUrl)}" alt="${item}" class="filter-icon">
                <span class="visible-text">${alternativeText}</span>
                <span class="hidden-text">${item}</span>
            `;
            container.appendChild(button);
        });
    }
};

// PopupController
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

        // Navegación con teclado
        EventManager.add(window, 'keydown', (e) => {
            if (popup.style.display === 'block') {
                if (e.key === 'Escape') {
                    popup.style.display = 'none';
                } else if (e.key === 'ArrowRight') {
                    this.navigatePopup(1);
                } else if (e.key === 'ArrowLeft') {
                    this.navigatePopup(-1);
                }
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

    navigatePopup(direction) {
        const category = AppState.currentCategory;
        const items = AppState.services[category];
        if (!items) return;

        AppState.currentPopupIndex = 
            (AppState.currentPopupIndex + direction + items.length) % items.length;
        
        this.showPopup(
            items[AppState.currentPopupIndex], 
            AppState.currentPopupIndex, 
            category === 'paquetes'
        );
    },

    sendWhatsAppMessage(action, serviceTitle) {
        const message = encodeURIComponent(`Hola! Quiero ${action} un ${serviceTitle}`);
        const url = `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${message}`;
        window.open(url, '_blank');
    }
};

// ==========================================
// CONTROLADORES DE CARRUSEL Y GALERÍA
// ==========================================

// CarouselController
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

        const indicators = carousel.querySelectorAll('.carousel-indicators button');
        indicators.forEach((indicator, index) => {
            EventManager.add(indicator, 'click', () => showSlide(index));
        });

        items.forEach(item => {
            const img = item.querySelector('img');
            if (img) {
                const originalSrc = img.getAttribute('src');
                img.src = `${CONFIG.CAROUSEL_IMAGE_BASE_URL}${originalSrc}`;
            }
        });

        showSlide(0);

        EventManager.add(carousel, 'keydown', (e) => {
            if (e.key === 'ArrowRight') {
                showSlide((currentIndex + 1) % items.length);
            } else if (e.key === 'ArrowLeft') {
                showSlide((currentIndex - 1 + items.length) % items.length);
            }
        });

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

    initPaqcarr() {
        const carousel = DOMManager.getElement('paqcarr-container');
        if (!carousel) return;

        const items = carousel.querySelectorAll('.image-nav-item');
        if (items.length === 0) return;

        items.forEach(item => {
            EventManager.add(item, 'click', () => {
                const image = item.getAttribute('data-image');
                const title = item.getAttribute('data-title');
                const description = item.getAttribute('data-description');

                const mainImageContainer = carousel.querySelector('.main-image-container');
                if (mainImageContainer) {
                    const mainImage = mainImageContainer.querySelector('.main-image');
                    if (mainImage) {
                        mainImage.src = image;
                        mainImage.alt = title;
                    }

                    const imageInfo = mainImageContainer.querySelector('.image-info');
                    if (imageInfo) {
                        imageInfo.innerHTML = `
                            <h3>${title}</h3>
                            <p>${description}</p>
                        `;
                    }
                }

                items.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
            });
        });

        if (items[0]) {
            items[0].click();
        }
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

// GalleryController
const GalleryController = {
    init() {
        this.setupGallery();
        this.setupGalleryModal();
        this.setupGalleryAnimations();
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
                description: 'Después de tu masaje en pareja saborea una exquisita selección de jamón curado, quesos gourmet, fresas cubiertas de chocolate y copas de vino.'
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
    }
};

// ==========================================
// CONTROLADORES RESPONSIVE Y ANIMACIÓN
// ==========================================

// ResponsiveController
const ResponsiveController = {
    init() {
        this.setupResponsiveNavigation();
        this.setupScrollHandling();
        this.setupResizeHandling();
        this.initializeMediaQueries();
        this.setupSmoothScrolling();
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
            
            if (header) {
                header.classList.toggle('scrolled', currentScroll > 100);
                header.classList.toggle('header-hidden', currentScroll > lastScroll && currentScroll > 200);
            }

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
        handleResize();
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
        document.documentElement.style.setProperty('--base-font-size', '14px');
        document.documentElement.style.setProperty('--heading-font-size', '1.5rem');
        document.documentElement.style.setProperty('--container-padding', '10px');
        document.documentElement.style.setProperty('--section-spacing', '30px');
    },

    optimizeForTablet() {
        document.documentElement.style.setProperty('--base-font-size', '15px');
        document.documentElement.style.setProperty('--heading-font-size', '1.75rem');
        document.documentElement.style.setProperty('--container-padding', '20px');
        document.documentElement.style.setProperty('--section-spacing', '40px');
    },

    optimizeForDesktop() {
        document.documentElement.style.setProperty('--base-font-size', '16px');
        document.documentElement.style.setProperty('--heading-font-size', '2rem');
        document.documentElement.style.setProperty('--container-padding', '30px');
        document.documentElement.style.setProperty('--section-spacing', '60px');
    },

    initializeMediaQueries() {
        const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const reducedMotionMediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        
        darkModeMediaQuery.addListener(e => this.handleDarkModeChange(e));
        reducedMotionMediaQuery.addListener(e => this.handleReducedMotionChange(e));
    },

    handleDarkModeChange(e) {
        document.body.classList.toggle('dark-mode', e.matches);
    },

    handleReducedMotionChange(e) {
        document.body.classList.toggle('reduced-motion', e.matches);
    },

    setupSmoothScrolling() {
        const navLinks = document.querySelectorAll('nav a, .fixed-bar a, .service-category-toggle a');
        
        navLinks.forEach(link => {
            EventManager.add(link, 'click', (e) => {
                const href = link.getAttribute('href');
                
                if (href && href.startsWith('#')) {
                    e.preventDefault();
                    const targetId = href.substring(1);
                    const targetSection = document.getElementById(targetId);
                    
                    if (targetSection) {
                        targetSection.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                }
            });
        });
    }
};

// AnimationController
const AnimationController = {
    init() {
// Continuación de AnimationController
    setupScrollAnimations() {
        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
            console.warn('GSAP or ScrollTrigger not loaded');
            return;
        }

        gsap.registerPlugin(ScrollTrigger);

        // Animaciones para los servicios
        gsap.utils.toArray('.service-item').forEach(service => {
            gsap.from(service, {
                scrollTrigger: {
                    trigger: service,
                    start: "top bottom-=100",
                    toggleActions: "play none none reverse"
                },
                y: 50,
                opacity: 0,
                duration: 0.6,
                ease: "power2.out"
            });
        });

        // Animaciones para los beneficios
        gsap.utils.toArray('.benefit-btn').forEach((btn, i) => {
            gsap.from(btn, {
                scrollTrigger: {
                    trigger: btn,
                    start: "top bottom"
                },
                opacity: 0,
                y: 20,
                duration: 0.4,
                delay: i * 0.1,
                ease: "power2.out"
            });
        });

        // Animaciones para la galería
        gsap.utils.toArray('.gallery-item').forEach((item, i) => {
            gsap.from(item, {
                scrollTrigger: {
                    trigger: item,
                    start: "top bottom-=50",
                    toggleActions: "play none none reverse"
                },
                scale: 0.8,
                opacity: 0,
                duration: 0.5,
                delay: i * 0.1,
                ease: "back.out(1.7)"
            });
        });
    },

    setupHoverEffects() {
        const buttons = document.querySelectorAll('.benefit-btn, .package-btn');
        
        buttons.forEach(button => {
            button.addEventListener('mouseenter', () => {
                gsap.to(button, {
                    y: -2,
                    duration: 0.2,
                    ease: "power2.out"
                });
            });

            button.addEventListener('mouseleave', () => {
                gsap.to(button, {
                    y: 0,
                    duration: 0.2,
                    ease: "power2.out"
                });
            });
        });
    }
};

// FilterController
const FilterController = {
    init() {
        this.setupCategoryFilters();
        this.setupBenefitFilters();
        this.setupPackageFilters();
    },

    setupCategoryFilters() {
        const categoryToggles = document.querySelectorAll('.service-category-toggle');
        categoryToggles.forEach(toggle => {
            const inputs = toggle.querySelectorAll('input[type="radio"]');
            inputs.forEach(input => {
                EventManager.add(input, 'change', () => {
                    const category = input.value;
                    this.changeCategory(category);
                });
            });
        });
    },

    setupBenefitFilters() {
        const benefitButtons = document.querySelectorAll('.benefit-btn');
        benefitButtons.forEach(button => {
            EventManager.add(button, 'click', () => {
                const filter = button.getAttribute('data-filter');
                this.filterByBenefit(filter);
            });
        });
    },

    setupPackageFilters() {
        const packageButtons = document.querySelectorAll('.package-btn');
        packageButtons.forEach(button => {
            EventManager.add(button, 'click', () => {
                const filter = button.getAttribute('data-filter');
                this.filterByPackageType(filter);
            });
        });
    },

    changeCategory(category) {
        AppState.currentCategory = category;
        ServicesController.renderServices(category);
        UIController.setupBenefitsNav(category);
    },

    filterByBenefit(benefit) {
        const items = document.querySelectorAll('.service-item');
        this.applyFilter(items, benefit);
    },

    filterByPackageType(type) {
        const items = document.querySelectorAll('.package-item');
        this.applyFilter(items, type);
    },

    applyFilter(items, filter) {
        items.forEach(item => {
            const display = filter === 'all' || item.classList.contains(filter) ? 
                'block' : 'none';
            item.style.display = display;
        });
    }
};

// App Initialization and Exports
const App = {
    async init() {
        if (AppState.initialized) {
            console.warn('App already initialized');
            return;
        }

        try {
            console.log('Initializing application...');
            
            // Initialize core functionality
            ResponsiveController.init();
            await ServicesController.loadServices();
            PopupController.init();
            GalleryController.init();
            await CarouselController.loadCarouselContent();
            await CarouselController.loadPaqcarrContent();
            
            // Initialize additional features
            FilterController.init();
            AnimationController.init();
            
            // Setup global listeners
            this.setupGlobalEventListeners();
            this.setupLazyLoading();
            
            AppState.initialized = true;
            console.log('Application initialized successfully');
        } catch (error) {
            console.error('Error during initialization:', error);
            this.handleInitializationError(error);
        }
    },

    setupGlobalEventListeners() {
        document.querySelectorAll('img').forEach(img => {
            EventManager.add(img, 'error', () => ImageManager.handleImageError(img));
        });

        EventManager.add(document, 'keydown', (e) => {
            if (e.key === 'Escape') {
                const popup = DOMManager.getElement('popup');
                const imageModal = DOMManager.getElement('imageModal');
                if (popup) popup.style.display = 'none';
                if (imageModal) imageModal.style.display = 'none';
            }
        });

        window.addEventListener('load', () => {
            document.body.classList.add('loaded');
            if (location.hash) {
                const targetElement = document.querySelector(location.hash);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });

        window.addEventListener('resize', Utils.debounce(() => {
            ResponsiveController.handleResize();
        }, 250));
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
        ErrorHandler.log(error, 'App initialization');
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

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => App.init());

// Cleanup on page unload
window.addEventListener('unload', () => App.cleanup());

// Export to window object
Object.assign(window, {
    App,
    ServicesController,
    UIController,
    PopupController,
    CarouselController,
    GalleryController,
    FilterController,
    AnimationController,
    ResponsiveController,
    CacheManager,
    Utils,
    ErrorHandler,
    TemplateManager,
    AnalyticsManager,
    PerformanceMonitor,
    ServiceWorkerManager,
    CONFIG,
    AppState,
    EventManager,
    ImageManager,
    DOMManager
});
