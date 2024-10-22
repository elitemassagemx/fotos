// Configuración global
const CONFIG = {
    BASE_URL: "https://raw.githubusercontent.com/elitemassagemx/Home/main/IMG/",
    CAROUSEL_IMAGE_BASE_URL: "https://raw.githubusercontent.com/elitemassagemx/prueba/main/IMGW/",
    DEFAULT_ERROR_IMAGE: "https://raw.githubusercontent.com/elitemassagemx/Home/main/IMG/error.webp",
    WHATSAPP_NUMBER: "5215640020305"
};

// Gestor de estado de la aplicación
const AppState = {
    services: {},
    currentCategory: 'masajes',
    initialized: false
};

// Gestor de imágenes
const ImageManager = {
    handleImageError(img) {
        img.onerror = null;
        img.src = CONFIG.DEFAULT_ERROR_IMAGE;
    },

    buildImageUrl(iconPath) {
        if (!iconPath) return '';
        return iconPath.startsWith('http') ? iconPath : `${CONFIG.BASE_URL}${iconPath}`;
    }
};

// Gestor de DOM
const DOMManager = {
    getElement(id) {
        return document.getElementById(id);
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
            await this.fetchServiceData();
            this.initializeServiceCategories();
            this.renderInitialServices();
            UIController.setupFilters();
            return true;
        } catch (error) {
            console.error('Error loading services:', error);
            return false;
        }
    },

    async fetchServiceData() {
        const response = await fetch('data.json');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        AppState.services = data.services;
    },

    initializeServiceCategories() {
        const categoryGroups = document.querySelectorAll('.service-category-toggle');
        categoryGroups.forEach(group => {
            const inputs = group.querySelectorAll('input[type="radio"]');
            inputs.forEach(input => {
                input.addEventListener('change', () => {
                    const category = input.value;
                    AppState.currentCategory = category;
                    this.handleCategoryChange(category);
                });
            });
        });
    },

    handleCategoryChange(category) {
        if (category === 'paquetes') {
            this.renderPackages();
        } else {
            this.renderServices(category);
        }
        UIController.updateFilterNavigation(category);
    },

    renderInitialServices() {
        this.renderServices('masajes');
        this.renderPackages();
    },

    renderServices(category) {
        const servicesList = DOMManager.getElement('services-list');
        if (!servicesList) return;

        servicesList.innerHTML = '';
        const services = AppState.services[category] || [];

        services.forEach((service, index) => {
            const serviceElement = this.createServiceElement(service, index);
            servicesList.appendChild(serviceElement);
        });
    },

    createServiceElement(service, index) {
        const template = DOMManager.getElement('service-template');
        if (!template) return null;

        const element = template.content.cloneNode(true);
        this.populateServiceElement(element, service, index);
        return element;
    },

    renderPackages() {
        const packageList = DOMManager.getElement('package-list');
        if (!packageList) return;

        packageList.innerHTML = '';
        const packages = AppState.services.paquetes || [];

        packages.forEach((pkg, index) => {
            const packageElement = this.createPackageElement(pkg, index);
            packageList.appendChild(packageElement);
        });
    },

    createPackageElement(pkg, index) {
        const template = DOMManager.getElement('package-template');
        if (!template) return null;

        const element = template.content.cloneNode(true);
        this.populatePackageElement(element, pkg, index);
        return element;
    },

    populateServiceElement(element, service, index) {
        // Configurar título
        const titleElement = element.querySelector('.service-title');
        if (titleElement) titleElement.textContent = service.title || '';

        // Configurar icono
        const iconElement = element.querySelector('.service-icon');
        if (iconElement && service.icon) {
            iconElement.src = ImageManager.buildImageUrl(service.icon);
            iconElement.onerror = () => ImageManager.handleImageError(iconElement);
        }

        // Configurar descripción
        const descriptionElement = element.querySelector('.service-description');
        if (descriptionElement) descriptionElement.textContent = service.description || '';

        // Configurar duración
        const durationElement = element.querySelector('.service-duration');
        if (durationElement) durationElement.textContent = service.duration || '';

        // Configurar beneficios
        const benefitsContainer = element.querySelector('.benefits-container');
        if (benefitsContainer && Array.isArray(service.benefits)) {
            this.populateBenefits(benefitsContainer, service);
        }

        // Configurar botón de "Saber más"
        const saberMasButton = element.querySelector('.saber-mas-button');
        if (saberMasButton) {
            saberMasButton.addEventListener('click', () => {
                PopupController.showPopup(service, index);
            });
        }
    },

    populatePackageElement(element, pkg, index) {
        // Configurar título
        const titleElement = element.querySelector('.package-title');
        if (titleElement) titleElement.textContent = pkg.title || '';

        // Configurar descripción
        const descriptionElement = element.querySelector('.package-description');
        if (descriptionElement) descriptionElement.textContent = pkg.description || '';

        // Configurar includes
        const includesList = element.querySelector('.package-includes-list');
        if (includesList && Array.isArray(pkg.includes)) {
            pkg.includes.forEach(item => {
                const li = document.createElement('li');
                li.textContent = item;
                includesList.appendChild(li);
            });
        }

        // Configurar duración
        const durationElement = element.querySelector('.package-duration-text');
        if (durationElement) durationElement.textContent = pkg.duration || '';

        // Configurar botón de "Saber más"
        const saberMasButton = element.querySelector('.saber-mas-button');
        if (saberMasButton) {
            saberMasButton.addEventListener('click', () => {
                PopupController.showPopup(pkg, index, true);
            });
        }
    },

    populateBenefits(container, service) {
        if (!Array.isArray(service.benefits) || !Array.isArray(service.benefitsIcons)) return;

        service.benefits.forEach((benefit, index) => {
            const benefitItem = DOMManager.createElement('div', { className: 'benefit-item' });
            
            const img = DOMManager.createElement('img', {
                src: ImageManager.buildImageUrl(service.benefitsIcons[index]),
                alt: benefit,
                className: 'benefit-icon'
            });
            
            const span = DOMManager.createElement('span', {
                textContent: benefit
            });
            
            benefitItem.appendChild(img);
            benefitItem.appendChild(span);
            container.appendChild(benefitItem);
        });
    }
};

// Controlador de UI
const UIController = {
    setupFilters() {
        this.setupServiceFilters();
        this.setupPackageFilters();
    },

    setupServiceFilters() {
        const filterButtons = document.querySelectorAll('.benefits-nav button');
        const services = document.querySelectorAll('.service-item');

        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                const filter = button.getAttribute('data-filter');
                this.filterItems(filterButtons, services, filter);
            });
        });
    },

    setupPackageFilters() {
        const filterButtons = document.querySelectorAll('.package-nav button');
        const packages = document.querySelectorAll('.package-item');

        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                const filter = button.getAttribute('data-filter');
                this.filterItems(filterButtons, packages, filter);
            });
        });
    },

    filterItems(buttons, items, filter) {
        buttons.forEach(btn => btn.classList.remove('active'));
        const activeButton = Array.from(buttons).find(btn => btn.getAttribute('data-filter') === filter);
        if (activeButton) activeButton.classList.add('active');

        items.forEach(item => {
            item.style.display = 
                (filter === 'all' || item.classList.contains(filter)) ? 'block' : 'none';
        });
    },

    updateFilterNavigation(category) {
        const benefitsNav = document.querySelector('.benefits-nav');
        if (!benefitsNav) return;

        benefitsNav.innerHTML = '';
        this.createFilterButtons(benefitsNav, category);
    },

    createFilterButtons(container, category) {
        // Crear botón "Todos"
        const allButton = this.createFilterButton('all', 'Todos', 'todos.webp');
        container.appendChild(allButton);

        // Crear botones específicos de la categoría
        const categoryItems = AppState.services[category] || [];
        const addedFilters = new Set();

        categoryItems.forEach(item => {
            if (Array.isArray(item.benefits)) {
                item.benefits.forEach((benefit, index) => {
                    if (!addedFilters.has(benefit)) {
                        addedFilters.add(benefit);
                        const iconUrl = item.benefitsIcons?.[index] || `${benefit.toLowerCase()}.webp`;
                        const button = this.createFilterButton(
                            benefit.toLowerCase().replace(/\s+/g, '-'),
                            benefit,
                            iconUrl
                        );
                        container.appendChild(button);
                    }
                });
            }
        });
    },

    createFilterButton(filter, text, iconUrl) {
        const button = DOMManager.createElement('button', {
            className: `filter-button ${filter === 'all' ? 'active' : ''}`,
            'data-filter': filter
        });

        const img = DOMManager.createElement('img', {
            src: ImageManager.buildImageUrl(iconUrl),
            alt: text,
            className: 'filter-icon'
        });

        const span = DOMManager.createElement('span', {
            textContent: text
        });

        button.appendChild(img);
        button.appendChild(span);
        return button;
    }
};

// Controlador de Popup
const PopupController = {
    init() {
        const popup = DOMManager.getElement('popup');
        if (!popup) return;

        const closeButton = popup.querySelector('.close');
        if (closeButton) {
            closeButton.addEventListener('click', () => this.hidePopup());
        }

        window.addEventListener('click', (event) => {
            if (event.target === popup) {
                this.hidePopup();
            }
        });
    },

    showPopup(data, index, isPackage = false) {
        const popup = DOMManager.getElement('popup');
        if (!popup) return;

        this.populatePopupContent(data, isPackage);
        popup.style.display = 'block';
    },

    hidePopup() {
        const popup = DOMManager.getElement('popup');
        if (popup) popup.style.display = 'none';
    },

    populatePopupContent(data, isPackage) {
        // Actualizar título
        const titleElement = DOMManager.getElement('popup-title');
        if (titleElement) titleElement.textContent = data.title || '';

        // Actualizar imagen
        const imageElement = DOMManager.getElement('popup-image');
        if (imageElement) {
            imageElement.src = ImageManager.buildImageUrl(data.popupImage || data.image);
            imageElement.alt = data.title || '';
        }

        // Actualizar descripción
        const descriptionElement = DOMManager.getElement('popup-description');
        if (descriptionElement) {
            descriptionElement.textContent = data.popupDescription || data.description || '';
        }

        // Actualizar beneficios
        const benefitsContainer = document.querySelector('.popup-benefits');
        if (benefitsContainer) {
            benefitsContainer.innerHTML = '';
            if (Array.isArray(data.benefits)) {
                this.populatePopupBenefits(benefitsContainer, data);
            }
        }

        // Actualizar includes (solo para paquetes)
        const includesContainer = document.querySelector('.popup-includes');
        if (includesContainer && isPackage) {
            includesContainer.innerHTML = '';
            if (Array.isArray(data.includes)) {
                this.populatePopupIncludes(includesContainer, data);
            }
        }

        // Actualizar duración
        const durationElement = DOMManager.getElement('popup-duration');
        if (durationElement) durationElement.textContent = data.duration || '';

        // Configurar botón de WhatsApp
        const whatsappButton = DOMManager.getElement('whatsapp-button');
        if (whatsappButton) {
            whatsappButton.onclick = () => this.sendWhatsAppMessage('Reservar', data.title);
        }
    },

    populatePopupBenefits(container, data) {
        data.benefits.forEach((benefit, index) => {
            const benefitItem = DOMManager.createElement('div', {
                className: 'popup-benefit-item'
            });
            
            const img = DOMManager.createElement('img', {
                src: ImageManager.buildImageUrl(data.benefitsIcons?.[index] || ''),
                alt: benefit
            });
            
            const span = DOMManager.createElement('span', {
                textContent: benefit
            });
            
            benefitItem.appendChild(img);
            benefitItem.appendChild(span);
            container.appendChild(benefitItem);
        });
    },

    populatePopupIncludes(container, data) {
        data.includes.forEach(item => {
            const includeItem = DOMManager.createElement('div', {
                className: 'popup-include-item'
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
    },

    sendWhatsAppMessage(action, serviceTitle) {
        const message = encodeURIComponent(`Hola! Quiero ${action} un ${serviceTitle}`);
        const url = `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${message}`;
        window.open(url, '_blank');
    }
};

// Controlador de Responsive
const ResponsiveController = {
    init() {
        this.setupResponsiveNavigation();
        this.setupScrollHandling();
        this.setupResizeHandling();
        this.setupSmoothScrolling();
    },

    setupResponsiveNavigation() {
        const navLinks = document.querySelectorAll('nav a');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href')?.substring(1);
                if (targetId) {
                    const targetSection = DOMManager.getElement(targetId);
                    if (targetSection) {
                        targetSection.scrollIntoView({ 
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                }
            });
        });
    },

    setupScrollHandling() {
        let lastScroll = 0;
        const header = DOMManager.getElement('main-header');
        const fixedBar = document.querySelector('.fixed-bar');

        window.addEventListener('scroll', () => {
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

        window.addEventListener('resize', handleResize);
        handleResize(); // Llamada inicial
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

    setupSmoothScrolling() {
        const navLinks = document.querySelectorAll('nav a, .fixed-bar a, .service-category-toggle a');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                
                if (href?.startsWith('#')) {
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
            img.addEventListener('error', () => ImageManager.handleImageError(img));
        });

        // Manejar cierre de popups con Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const popup = DOMManager.getElement('popup');
                const imageModal = DOMManager.getElement('imageModal');
                if (popup) popup.style.display = 'none';
                if (imageModal) imageModal.style.display = 'none';
            }
        });
    },

    setupLazyLoading() {
        if ('IntersectionObserver' in window) {
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
        }
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
    }
};

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', () => App.init());
// Controlador de Galería
const GalleryController = {
    init() {
        this.setupGallery();
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

        verMasButton.addEventListener('click', () => {
            window.location.href = 'galeria.html';
        });
    },

    createGalleryItem(image) {
        const galleryItem = DOMManager.createElement('div', {
            className: 'gallery-item'
        });

        galleryItem.innerHTML = `
            <img src="${ImageManager.buildImageUrl(image.src)}" 
                 alt="${image.title}"
                 loading="lazy">
            <div class="image-overlay">
                <h3 class="image-title">${image.title}</h3>
                <p class="image-description">${image.description}</p>
            </div>
        `;

        galleryItem.addEventListener('click', () => {
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
        const closeBtn = modal?.querySelector('.close');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                if (modal) modal.style.display = "none";
            });
        }

        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.style.display = "none";
            }
        });
    }
};

// Funciones de utilidad
const Utils = {
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    formatCurrency(amount) {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(amount);
    },

    isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    },

    getScrollPercentage() {
        const h = document.documentElement;
        const b = document.body;
        const st = 'scrollTop';
        const sh = 'scrollHeight';
        return (h[st]||b[st]) / ((h[sh]||b[sh]) - h.clientHeight) * 100;
    }
};

// Extensión de funcionalidad del App
Object.assign(App, {
    cleanup() {
        // Limpiar event listeners
        const elements = document.querySelectorAll('[data-has-listeners]');
        elements.forEach(element => {
            const listeners = element.getAttribute('data-listeners')?.split(',') || [];
            listeners.forEach(listener => {
                const [event, handler] = listener.split(':');
                if (event && handler) {
                    element.removeEventListener(event, window[handler]);
                }
            });
        });

        // Limpiar estado
        AppState.initialized = false;
        AppState.services = {};
        AppState.currentCategory = 'masajes';

        console.log('Application cleanup completed');
    },

    reinit() {
        this.cleanup();
        this.init();
    }
});

// Exportar para uso externo si es necesario
if (typeof window !== 'undefined') {
    window.App = App;
    window.ServicesController = ServicesController;
    window.UIController = UIController;
    window.PopupController = PopupController;
    window.GalleryController = GalleryController;
    window.ResponsiveController = ResponsiveController;
}

// Inicio automático cuando el DOM está listo
document.addEventListener('DOMContentLoaded', () => {
    App.init().catch(error => {
        console.error('Error initializing application:', error);
    });
});

// Limpieza cuando la página se descarga
window.addEventListener('unload', () => {
    App.cleanup();
});
