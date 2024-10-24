
// SISTEMA DE DEPENDENCIAS Y CONFIGURACIÓN


const DEPENDENCIES = {
    GSAP: typeof gsap !== 'undefined',
    ScrollTrigger: typeof ScrollTrigger !== 'undefined',
    ResizeObserver: typeof ResizeObserver !== 'undefined',
    IntersectionObserver: typeof IntersectionObserver !== 'undefined',
    PointerEvents: typeof PointerEvent !== 'undefined',
    TouchEvents: 'ontouchstart' in window
};

// Configuración global
const CONFIG = {
    BASE_URL: "https://raw.githubusercontent.com/elitemassagemx/Home/main/IMG/",
    CAROUSEL_IMAGE_BASE_URL: "https://raw.githubusercontent.com/elitemassagemx/prueba/main/carruimg/",
    DEFAULT_ERROR_IMAGE: "https://raw.githubusercontent.com/elitemassagemx/Home/main/IMG/error.webp",
    WHATSAPP_NUMBER: "5215640020305",
    ANIMATION_DURATION: 300,
    CACHE_DURATION: 3600000, // 1 hora
    DEBUG: true,
    BREAKPOINTS: {
        mobile: 480,
        tablet: 768,
        desktop: 1024
    },
    PERFORMANCE: {
        DEBOUNCE_DELAY: 250,
        THROTTLE_DELAY: 100,
        INTERSECTION_MARGIN: '50px',
        MIN_SWIPE_DISTANCE: 50
    }
};
// Sistema de Analytics
const AnalyticsManager = {
    trackEvent(category, action, label = '') {
        if (CONFIG.DEBUG) {
            console.log(`[Analytics] ${category}: ${action} - ${label}`);
        }
        // Aquí iría la implementación real de analytics
    },

    trackPageView(path) {
        if (CONFIG.DEBUG) {
            console.log(`[Analytics] Pageview: ${path}`);
        }
        // Aquí iría la implementación real de pageview
    }
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
    cache: new Map(),
    dependencies: DEPENDENCIES,
    deviceType: null, // 'mobile', 'tablet', 'desktop'
    orientation: null, // 'portrait', 'landscape'
    networkStatus: navigator.onLine,
    performanceMetrics: new Map()
};

// Sistema de Logging Mejorado
const Logger = {
    levels: {
        DEBUG: 0,
        INFO: 1,
        WARN: 2,
        ERROR: 3
    },

    currentLevel: 0, // DEBUG por defecto

    log(level, message, data = null) {
        if (level >= this.currentLevel) {
            const timestamp = new Date().toISOString();
            const logEntry = {
                timestamp,
                level: this.getLevelName(level),
                message,
                data
            };

            if (CONFIG.DEBUG) {
                console.log(JSON.stringify(logEntry, null, 2));
            }

            // Almacenar logs importantes
            if (level >= this.levels.WARN) {
                this.storelog(logEntry);
            }
        }
    },

    getLevelName(level) {
        return Object.keys(this.levels).find(key => this.levels[key] === level) || 'UNKNOWN';
    },

    storelog(logEntry) {
        const logs = JSON.parse(localStorage.getItem('appLogs') || '[]');
        logs.push(logEntry);
        // Mantener solo los últimos 100 logs
        if (logs.length > 100) logs.shift();
        localStorage.setItem('appLogs', JSON.stringify(logs));
    },

    debug(message, data = null) {
        this.log(this.levels.DEBUG, message, data);
    },

    info(message, data = null) {
        this.log(this.levels.INFO, message, data);
    },

    warn(message, data = null) {
        this.log(this.levels.WARN, message, data);
    },

    error(message, data = null) {
        this.log(this.levels.ERROR, message, data);
    }
};

// Gestor de Errores Mejorado
const ErrorHandler = {
    errors: [],
    
    log(error, context = '', options = {}) {
        const errorInfo = {
            error: error instanceof Error ? error : new Error(error),
            context,
            timestamp: new Date(),
            stack: error.stack || new Error().stack,
            severity: options.severity || 'medium',
            userImpact: options.userImpact || false,
            metadata: {
                url: window.location.href,
                userAgent: navigator.userAgent,
                deviceType: AppState.deviceType,
                networkStatus: AppState.networkStatus
            }
        };
        
        this.errors.push(errorInfo);
        
        // Log del error
        Logger.error(`Error in ${context}:`, {
            message: error.message,
            severity: errorInfo.severity,
            userImpact: errorInfo.userImpact
        });

        // Notificar al usuario si es necesario
        if (errorInfo.userImpact) {
            this.notifyUser(errorInfo);
        }

        // Enviar a sistema de analytics si es error crítico
        if (errorInfo.severity === 'high') {
            AnalyticsManager.trackEvent('Error', context, error.message);
        }
        
        return errorInfo;
    },

    notifyUser(errorInfo) {
        // Solo mostrar mensajes de error amigables al usuario
        const userMessages = {
            'high': 'Ha ocurrido un error crítico. Por favor, recarga la página.',
            'medium': 'Ha ocurrido un problema. Estamos trabajando para solucionarlo.',
            'low': 'Ha ocurrido un error menor. Puedes continuar usando la aplicación.'
        };

        const message = userMessages[errorInfo.severity] || userMessages.medium;
        this.showErrorMessage(message, document.body);
    },

    getLastError() {
        return this.errors[this.errors.length - 1];
    },

    clearErrors() {
        this.errors = [];
    },

    showErrorMessage(message, container, duration = 5000) {
        const errorDiv = DOMManager.createElement('div', {
            className: 'error-message',
            textContent: message
        });
        
        container.appendChild(errorDiv);
        
        // Animación de entrada
        errorDiv.style.opacity = '0';
        requestAnimationFrame(() => {
            errorDiv.style.opacity = '1';
            errorDiv.style.transition = 'opacity 0.3s ease';
        });
        
        // Auto-eliminar después de la duración especificada
        setTimeout(() => {
            errorDiv.style.opacity = '0';
            setTimeout(() => DOMManager.removeElement(errorDiv), 300);
        }, duration);
    },

    handleApiError(error) {
        this.log(error, 'API Error', { 
            severity: 'high', 
            userImpact: true 
        });
        
        return {
            success: false,
            error: error.message || 'Se produjo un error desconocido'
        };
    }
};

// ==========================================
// GESTORES PRINCIPALES
// ==========================================

// Gestor de eventos mejorado
const EventManager = {
    add(element, event, handler, options = false) {
        if (!element) {
            Logger.error('Cannot add event listener to null element');
            return;
        }

        try {
            element.addEventListener(event, handler, options);
            const key = `${element.id || 'anonymous'}-${event}`;
            AppState.eventListeners.set(key, { element, event, handler });
            
            Logger.debug(`Event listener added: ${key}`);
        } catch (error) {
            ErrorHandler.log(error, 'Adding event listener', {
                severity: 'medium',
                userImpact: false
            });
        }
    },

    remove(element, event) {
        try {
            const key = `${element.id || 'anonymous'}-${event}`;
            const listener = AppState.eventListeners.get(key);
            if (listener) {
                listener.element.removeEventListener(listener.event, listener.handler);
                AppState.eventListeners.delete(key);
                Logger.debug(`Event listener removed: ${key}`);
            }
        } catch (error) {
            ErrorHandler.log(error, 'Removing event listener');
        }
    },

    removeAll() {
        try {
            AppState.eventListeners.forEach(listener => {
                listener.element.removeEventListener(listener.event, listener.handler);
            });
            AppState.eventListeners.clear();
            Logger.info('All event listeners removed');
        } catch (error) {
            ErrorHandler.log(error, 'Removing all event listeners');
        }
    },

    // Nuevo: Delegación de eventos
    delegate(parentElement, childSelector, eventType, handler) {
        this.add(parentElement, eventType, (event) => {
            const targetElement = event.target.closest(childSelector);
            if (targetElement && parentElement.contains(targetElement)) {
                handler(event, targetElement);
            }
        });
    }
};

// Gestor de imágenes mejorado
const ImageManager = {
    loadingImages: new Map(),
    failedImages: new Set(),

    async loadImage(url, retryCount = 2) {
        // Verificar si la imagen ya está cargando
        if (this.loadingImages.has(url)) {
            return this.loadingImages.get(url);
        }

        // Crear nueva promesa de carga
        const loadPromise = new Promise(async (resolve, reject) => {
            let attempts = 0;
            
            const attemptLoad = () => {
                const img = new Image();
                
                img.onload = () => {
                    this.loadingImages.delete(url);
                    this.failedImages.delete(url);
                    resolve(img);
                };

                img.onerror = async () => {
                    attempts++;
                    if (attempts < retryCount) {
                        Logger.warn(`Retrying image load: ${url}, attempt ${attempts + 1}`);
                        setTimeout(attemptLoad, 1000 * attempts); // Retraso exponencial
                    } else {
                        Logger.error(`Failed to load image after ${retryCount} attempts: ${url}`);
                        this.failedImages.add(url);
                        this.loadingImages.delete(url);
                        img.src = CONFIG.DEFAULT_ERROR_IMAGE;
                        resolve(img); // Resolvemos con la imagen de error en lugar de rechazar
                    }
                };

                img.src = url;
            };

            attemptLoad();
        });

        this.loadingImages.set(url, loadPromise);
        return loadPromise;
    },

    handleImageError(img) {
        img.onerror = null;
        img.src = CONFIG.DEFAULT_ERROR_IMAGE;
        Logger.warn(`Image load failed: ${img.src}`);
    },

    buildImageUrl(iconPath) {
        if (!iconPath) return CONFIG.DEFAULT_ERROR_IMAGE;
        return iconPath.startsWith('http') ? iconPath : `${CONFIG.BASE_URL}${iconPath}`;
    },

    async preloadImages(urls) {
        const results = await Promise.allSettled(urls.map(url => this.loadImage(url)));
        
        // Analizar resultados
        results.forEach((result, index) => {
            if (result.status === 'rejected') {
                Logger.warn(`Failed to preload image: ${urls[index]}`);
            }
        });

        return results
            .filter(result => result.status === 'fulfilled')
            .map(result => result.value);
    },

    // Nuevo: Sistema de caché de imágenes
    imageCache: new Map(),

    async getCachedImage(url) {
        if (this.imageCache.has(url)) {
            return this.imageCache.get(url);
        }

        const img = await this.loadImage(url);
        this.imageCache.set(url, img);
        return img;
    },

    clearImageCache() {
        this.imageCache.clear();
        Logger.debug('Image cache cleared');
    }
};

// Gestor de DOM mejorado
const DOMManager = {
    getElement(id) {
        const element = document.getElementById(id);
        if (!element && CONFIG.DEBUG) {
            Logger.warn(`Element with id "${id}" not found`);
        }
        return element;
    },

    createElement(tag, attributes = {}, children = []) {
        try {
            const element = document.createElement(tag);
            
            // Aplicar atributos
            Object.entries(attributes).forEach(([key, value]) => {
                if (key === 'className') {
                    element.className = value;
                } else if (key === 'textContent') {
                    element.textContent = value;
                } else if (key === 'style' && typeof value === 'object') {
                    Object.assign(element.style, value);
                } else if (key.startsWith('data-')) {
                    element.setAttribute(key, value);
                } else {
                    element.setAttribute(key, value);
                }
            });

            // Agregar hijos
            children.forEach(child => {
                if (child instanceof Node) {
                    element.appendChild(child);
                } else if (typeof child === 'string') {
                    element.appendChild(document.createTextNode(child));
                }
            });

            return element;
        } catch (error) {
            ErrorHandler.log(error, 'Creating DOM element', {
                severity: 'medium',
                userImpact: false
            });
            return null;
        }
    },

    removeElement(element) {
        if (element && element.parentNode) {
            try {
                element.parentNode.removeChild(element);
                return true;
            } catch (error) {
                ErrorHandler.log(error, 'Removing DOM element');
                return false;
            }
        }
        return false;
    },

    clearContainer(container) {
        if (!container) return false;
        
        try {
            while (container.firstChild) {
                container.removeChild(container.firstChild);
            }
            return true;
        } catch (error) {
            ErrorHandler.log(error, 'Clearing container');
            return false;
        }
    },

    setVisible(element, visible, displayType = 'block') {
        if (!element) return;
        
        try {
            if (visible) {
                element.style.display = displayType;
            } else {
                element.style.display = 'none';
            }
        } catch (error) {
            ErrorHandler.log(error, 'Setting element visibility');
        }
    },

    addClass(element, ...classNames) {
        try {
            element?.classList.add(...classNames);
            return true;
        } catch (error) {
            ErrorHandler.log(error, 'Adding class');
            return false;
        }
    },

    removeClass(element, ...classNames) {
        try {
            element?.classList.remove(...classNames);
            return true;
        } catch (error) {
            ErrorHandler.log(error, 'Removing class');
            return false;
        }
    },

    toggleClass(element, className, force) {
        try {
            return element?.classList.toggle(className, force);
        } catch (error) {
            ErrorHandler.log(error, 'Toggling class');
            return false;
        }
    },

    // Nuevo: Manipulación de atributos de datos
    setData(element, key, value) {
        try {
            element.dataset[key] = value;
            return true;
        } catch (error) {
            ErrorHandler.log(error, 'Setting data attribute');
            return false;
        }
    },

    getData(element, key) {
        try {
            return element.dataset[key];
        } catch (error) {
            ErrorHandler.log(error, 'Getting data attribute');
            return null;
        }
    },

    // Nuevo: Sistema de templates
    renderTemplate(templateId, data) {
        const template = document.getElementById(templateId);
        if (!template) {
            Logger.error(`Template not found: ${templateId}`);
            return null;
        }

        try {
            const clone = template.content.cloneNode(true);
            this.populateTemplate(clone, data);
            return clone;
        } catch (error) {
            ErrorHandler.log(error, 'Rendering template');
            return null;
        }
    },

    populateTemplate(element, data) {
        const textNodes = element.querySelectorAll('[data-bind]');
        textNodes.forEach(node => {
            const key = node.getAttribute('data-bind');
            if (data.hasOwnProperty(key)) {
                node.textContent = data[key];
            }
        });

        const attributes = element.querySelectorAll('[data-attr]');
        attributes.forEach(node => {
            const attr = node.getAttribute('data-attr');
            const key = node.getAttribute('data-key');
            if (data.hasOwnProperty(key)) {
                node.setAttribute(attr, data[key]);
            }
        });
    }
};

// Sistema de Utilidades Mejorado
const Utils = {
    debounce(func, wait = CONFIG.PERFORMANCE.DEBOUNCE_DELAY) {
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

    throttle(func, limit = CONFIG.PERFORMANCE.THROTTLE_DELAY) {
        let inThrottle;
        let lastFunc;
        let lastRan;
        
        return function executedFunction(...args) {
            if (!inThrottle) {
                func(...args);
                lastRan = Date.now();
                inThrottle = true;
            } else {
                clearTimeout(lastFunc);
                
                lastFunc = setTimeout(() => {
                    if ((Date.now() - lastRan) >= limit) {
                        func(...args);
                        lastRan = Date.now();
                    }
                }, limit - (Date.now() - lastRan));
            }
        };
    },

    formatPrice(price, locale = 'es-MX', currency = 'MXN') {
        try {
            return new Intl.NumberFormat(locale, {
                style: 'currency',
                currency: currency
            }).format(price);
        } catch (error) {
            ErrorHandler.log(error, 'Formatting price');
            return `${currency} ${price}`;
        }
    },

    sanitizeHTML(str) {
        try {
            const temp = document.createElement('div');
            temp.textContent = str;
            return temp.innerHTML;
        } catch (error) {
            ErrorHandler.log(error, 'Sanitizing HTML');
            return '';
        }
    },

    generateUniqueId(prefix = 'id') {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    },

    isElementInViewport(el) {
        try {
            const rect = el.getBoundingClientRect();
            return (
                rect.top >= 0 &&
                rect.left >= 0 &&
                rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                rect.right <= (window.innerWidth || document.documentElement.clientWidth)
            );
        } catch (error) {
            ErrorHandler.log(error, 'Checking element in viewport');
            return false;
        }
    },

    // Nuevo: Funciones de validación
    validate: {
        isEmail(email) {
            const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return re.test(email);
        },

        isPhone(phone) {
            const re = /^\+?[\d\s-]{10,}$/;
            return re.test(phone);
        },

        isUrl(url) {
            try {
                new URL(url);
                return true;
            } catch {
                return false;
            }
        }
    },

    // Nuevo: Funciones de formato
    format: {
        date(date, locale = 'es-MX') {
            try {
                return new Date(date).toLocaleDateString(locale);
            } catch (error) {
                ErrorHandler.log(error, 'Formatting date');
                return date;
            }
        },

        time(date, locale = 'es-MX') {
            try {
                return new Date(date).toLocaleTimeString(locale);
            } catch (error) {
                ErrorHandler.log(error, 'Formatting time');
                return date;
            }
        },

        number(number, locale = 'es-MX') {
            try {
                return new Intl.NumberFormat(locale).format(number);
            } catch (error) {
                ErrorHandler.log(error, 'Formatting number');
                return number.toString();
            }
        }
    }
};
// ==========================================
// SISTEMAS DE CACHÉ Y RENDIMIENTO
// ==========================================

// Sistema de Caché Mejorado
const CacheManager = {
    cache: new Map(),
    
    set(key, value, ttl = CONFIG.CACHE_DURATION) {
        const item = {
            value,
            expiry: Date.now() + ttl,
            accessed: 0,
            created: Date.now()
        };
        this.cache.set(key, item);
        this.maintainCacheSize();
    },

    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        
        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }
        
        item.accessed++;
        return item.value;
    },

    maintainCacheSize(maxSize = 100) {
        if (this.cache.size > maxSize) {
            // Eliminar los elementos menos accedidos
            const entries = Array.from(this.cache.entries());
            entries.sort((a, b) => a[1].accessed - b[1].accessed);
            
            for (let i = 0; i < entries.length - maxSize; i++) {
                this.cache.delete(entries[i][0]);
            }
        }
    },

    clear() {
        this.cache.clear();
        Logger.info('Cache cleared');
    },

    remove(key) {
        return this.cache.delete(key);
    },

    getStats() {
        return {
            size: this.cache.size,
            items: Array.from(this.cache.entries()).map(([key, item]) => ({
                key,
                accessed: item.accessed,
                age: Date.now() - item.created
            }))
        };
    }
};

// Monitor de Rendimiento Mejorado
const PerformanceMonitor = {
    metrics: new Map(),
    marks: new Map(),
    
    startMeasure(name) {
        this.marks.set(name, performance.now());
        if (window.performance && performance.mark) {
            performance.mark(`${name}-start`);
        }
    },

    endMeasure(name) {
        const startTime = this.marks.get(name);
        if (!startTime) return null;

        const duration = performance.now() - startTime;
        this.marks.delete(name);

        if (window.performance && performance.mark) {
            performance.mark(`${name}-end`);
            performance.measure(name, `${name}-start`, `${name}-end`);
        }

        this.recordMetric(name, duration);
        return duration;
    },

    recordMetric(name, value) {
        if (!this.metrics.has(name)) {
            this.metrics.set(name, {
                count: 0,
                total: 0,
                min: value,
                max: value,
                avg: value
            });
        }

        const metric = this.metrics.get(name);
        metric.count++;
        metric.total += value;
        metric.min = Math.min(metric.min, value);
        metric.max = Math.max(metric.max, value);
        metric.avg = metric.total / metric.count;
    },

    getMetrics() {
        return Array.from(this.metrics.entries()).map(([name, metric]) => ({
            name,
            ...metric
        }));
    },

    logPerformance(name, duration) {
        Logger.info(`Performance ${name}: ${duration.toFixed(2)}ms`);
        AnalyticsManager.trackEvent('Performance', name, duration.toFixed(2));
    },

    clearMetrics() {
        this.metrics.clear();
        this.marks.clear();
        if (window.performance && performance.clearMarks) {
            performance.clearMarks();
            performance.clearMeasures();
        }
    }
};

// ==========================================
// CONTROLADORES PRINCIPALES
// ==========================================

// ServicesController Mejorado
const ServicesController = {
    async initialize() {
        try {
            await this.loadServices();
            this.setupServiceCategories();
            this.setupEventListeners();
            return true;
        } catch (error) {
            ErrorHandler.log(error, 'ServicesController initialization', {
                severity: 'high',
                userImpact: true
            });
            return false;
        }
    },

    async loadServices() {
        PerformanceMonitor.startMeasure('loadServices');
        
        try {
            const cached = CacheManager.get('services');
            if (cached) {
                AppState.services = cached;
                Logger.info('Services loaded from cache');
                return true;
            }

            const response = await fetch('data.json');
            if (!response.ok) throw new Error('Network response was not ok');
            
            let text = await response.text();
            text = text.replace(/\$\{BASE_URL\}/g, CONFIG.BASE_URL)
                      .replace(/,\s*}/g, '}')
                      .replace(/,\s*]/g, ']');
            
            const data = JSON.parse(text);
            AppState.services = data.services;
            
            // Cachear los servicios
            CacheManager.set('services', data.services);
            
            // Precargar imágenes
            this.preloadServiceImages();
            
            const duration = PerformanceMonitor.endMeasure('loadServices');
            PerformanceMonitor.logPerformance('Services Load Time', duration);
            
            return true;
        } catch (error) {
            ErrorHandler.log(error, 'Loading services', {
                severity: 'high',
                userImpact: true
            });
            this.handleServiceLoadError();
            return false;
        }
    },

    async preloadServiceImages() {
        const imagesToPreload = new Set();
        
        Object.values(AppState.services).forEach(categoryServices => {
            categoryServices.forEach(service => {
                if (service.backgroundImage) {
                    imagesToPreload.add(ImageManager.buildImageUrl(service.backgroundImage));
                }
                if (service.icon) {
                    imagesToPreload.add(ImageManager.buildImageUrl(service.icon));
                }
                if (Array.isArray(service.benefitsIcons)) {
                    service.benefitsIcons.forEach(icon => {
                        imagesToPreload.add(ImageManager.buildImageUrl(icon));
                    });
                }
            });
        });

        return ImageManager.preloadImages(Array.from(imagesToPreload));
    },

    handleServiceLoadError() {
        const errorMessage = '<p>Error al cargar los servicios. Por favor, intente más tarde.</p>';
        
        ['services-list', 'package-list'].forEach(id => {
            const element = DOMManager.getElement(id);
            if (element) {
                element.innerHTML = errorMessage;
            }
        });

        ErrorHandler.showErrorMessage(
            'No se pudieron cargar los servicios. Por favor, recarga la página.',
            document.body,
            {
                severity: 'high',
                userImpact: true
            }
        );
    },

    setupEventListeners() {
        // Delegación de eventos para los botones "Saber más"
        EventManager.delegate(
            document.body,
            '.saber-mas-button',
            'click',
            (event, button) => {
                const serviceElement = button.closest('.service-item, .package-item');
                if (!serviceElement) return;

                const index = Array.from(serviceElement.parentNode.children)
                    .indexOf(serviceElement);
                const isPackage = serviceElement.classList.contains('package-item');
                
                if (isPackage) {
                    const packageData = AppState.services.paquetes[index];
                    PopupController.showPopup(packageData, index, true);
                } else {
                    const service = AppState.services[AppState.currentCategory][index];
                    PopupController.showPopup(service, index);
                }
            }
        );
    },

    renderInitialServices() {
        PerformanceMonitor.startMeasure('renderServices');
        
        this.renderServices(AppState.currentCategory);
        UIController.setupFilters();
        this.setupServiceCategories();
        
        const duration = PerformanceMonitor.endMeasure('renderServices');
        PerformanceMonitor.logPerformance('Initial Services Render', duration);
    },

    renderServices(category) {
        const servicesList = DOMManager.getElement('services-grid');
        if (!servicesList) return;

        PerformanceMonitor.startMeasure('renderServicesList');

        DOMManager.clearContainer(servicesList);
        const services = AppState.services[category];

        if (!Array.isArray(services)) {
            ErrorHandler.log(`Invalid services data for category: ${category}`, {
                severity: 'medium',
                userImpact: true
            });
            servicesList.innerHTML = '<p>Error al cargar los servicios.</p>';
            return;
        }

        // Crear fragmento para mejor rendimiento
        const fragment = document.createDocumentFragment();
        
        services.forEach((service, index) => {
            const serviceElement = this.createServiceElement(service, index);
            fragment.appendChild(serviceElement);
        });

        servicesList.appendChild(fragment);

        if (AppState.activeBenefit !== 'all') {
            this.filterServicesByBenefit(AppState.activeBenefit);
        }

        const duration = PerformanceMonitor.endMeasure('renderServicesList');
        PerformanceMonitor.logPerformance('Services List Render', duration);
    },

    createServiceElement(service, index) {
        const element = DOMManager.createElement('div');
        const benefitClasses = service.benefits ? 
            service.benefits.map(b => b.toLowerCase().replace(/\s+/g, '-')).join(' ') : '';
        
        element.className = `service-item ${benefitClasses}`;
        
        // Usar el sistema de templates para el contenido
        element.innerHTML = DOMManager.renderTemplate('service-template', {
            backgroundImage: ImageManager.buildImageUrl(service.backgroundImage),
            icon: ImageManager.buildImageUrl(service.icon),
            title: service.title,
            description: service.description,
            benefits: this.renderBenefits(service),
            duration: service.duration
        });

        // Activar lazy loading para las imágenes
        const images = element.querySelectorAll('img');
        images.forEach(img => {
            img.loading = 'lazy';
            img.onerror = () => ImageManager.handleImageError(img);
        });

        return element;
    },

    renderBenefits(service) {
        if (!Array.isArray(service.benefits) || !Array.isArray(service.benefitsIcons)) {
            return '';
        }

        return service.benefits.map((benefit, index) => `
            <div class="benefit-item">
                <img src="${ImageManager.buildImageUrl(service.benefitsIcons[index])}" 
                     alt="${benefit}" 
                     class="benefit-icon"
                     loading="lazy">
                <span>${benefit}</span>
            </div>
        `).join('');
    },

    filterServicesByBenefit(benefit) {
        const services = document.querySelectorAll('.service-item');
        services.forEach(service => {
            if (benefit === 'all') {
                DOMManager.setVisible(service, true);
            } else {
                const hasFilter = service.classList.contains(benefit);
                DOMManager.setVisible(service, hasFilter);
            }
        });
    }
};

// UIController Mejorado
const UIController = {
    initialize() {
        try {
            this.setupFilters();
            this.setupResponsiveUI();
            this.setupAnimations();
            return true;
        } catch (error) {
            ErrorHandler.log(error, 'UIController initialization', {
                severity: 'high',
                userImpact: true
            });
            return false;
        }
    },

    setupFilters() {
        PerformanceMonitor.startMeasure('setupFilters');
        
        this.setupBenefitsNav(AppState.currentCategory);
        this.setupFilterButtons('.benefits-nav', '#services-list', '.service-item');
        this.setupFilterButtons('.package-nav', '#package-list', '.package-item');
        
        const duration = PerformanceMonitor.endMeasure('setupFilters');
        PerformanceMonitor.logPerformance('Filters Setup', duration);
    },

    setupBenefitsNav(category) {
        const benefitsNav = document.querySelector('.benefits-nav');
        if (!benefitsNav) return;

        DOMManager.clearContainer(benefitsNav);

        // Obtener beneficios únicos y sus iconos
        const {benefits, icons} = this.collectBenefitsAndIcons(category);
        
        // Crear fragmento para mejor rendimiento
        const fragment = document.createDocumentFragment();
        
        // Agregar botón "Todos"
        fragment.appendChild(this.createBenefitButton('Todos', 'todos.webp', 'all'));
        
        // Agregar botones para cada beneficio
        benefits.forEach(benefit => {
            fragment.appendChild(this.createBenefitButton(
                this.getShortBenefitText(benefit),
                icons.get(benefit),
                benefit.toLowerCase().replace(/\s+/g, '-')
            ));
        });

        benefitsNav.appendChild(fragment);
    },

    collectBenefitsAndIcons(category) {
        const benefits = new Set();
        const icons = new Map();

        if (AppState.services[category]) {
            AppState.services[category].forEach(service => {
                if (Array.isArray(service.benefits) && Array.isArray(service.benefitsIcons)) {
                    service.benefits.forEach((benefit, index) => {
                        if (!benefits.has(benefit)) {
                            benefits.add(benefit);
                            icons.set(benefit, service.benefitsIcons[index]);
                        }
                    });
                }
            });
        }

        return { benefits, icons };
    },

    createBenefitButton(text, iconUrl, filter) {
        const button = DOMManager.createElement('button', {
            className: `benefit-btn ${filter === 'all' ? 'active' : ''}`,
            'data-filter': filter
        });

        button.innerHTML = `
            <img src="${ImageManager.buildImageUrl(iconUrl)}" 
                 alt="${text}" 
                 loading="lazy">
            <span class="visible-text">${text}</span>
            <span class="hidden-text">${filter}</span>
        `;

        // Usar delegación de eventos en lugar de eventos individuales
        return button;
    },

    setupFilterButtons(navSelector, listSelector, itemSelector) {
        const filterContainer = document.querySelector(navSelector);
        if (!filterContainer) return;

        // Usar delegación de eventos para mejor rendimiento
        EventManager.delegate(filterContainer, 'button', 'click', (event, button) => {
            const filter = button.getAttribute('data-filter')?.toLowerCase().replace(/\s+/g, '-');
            if (!filter) return;

            // Actualizar estados activos
            filterContainer.querySelectorAll('button').forEach(btn => 
                btn.classList.remove('active'));
            button.classList.add('active');

            // Filtrar elementos
            const items = document.querySelectorAll(itemSelector);
            items.forEach(item => {
                DOMManager.setVisible(item, 
                    filter === 'all' || item.classList.contains(filter)
                );
            });

            if (navSelector === '.benefits-nav') {
                AppState.activeBenefit = filter;
            }
        });
    },

    createFilterButtons(container, items, type, iconsMap = new Map()) {
        if (!container) return;

        const fragment = document.createDocumentFragment();

        // Botón "Todos"
        fragment.appendChild(this.createFilterButton('Todos', 'todos.webp', 'all', type));

        // Botones para cada item
        items.forEach(item => {
            const iconUrl = iconsMap.get(item) || 
                `${CONFIG.BASE_URL}${item.toLowerCase().replace(/\s+/g, '-')}.webp`;
            
            fragment.appendChild(
                this.createFilterButton(
                    this.getShortBenefitText(item),
                    iconUrl,
                    item,
                    type
                )
            );
        });

        container.appendChild(fragment);
    },

    createFilterButton(text, iconUrl, filter, type) {
        return DOMManager.createElement('button', {
            className: `${type}-btn ${filter === 'all' ? 'active' : ''}`,
            'data-filter': filter.toLowerCase().replace(/\s+/g, '-')
        }, [
            DOMManager.createElement('img', {
                src: ImageManager.buildImageUrl(iconUrl),
                alt: text,
                className: 'filter-icon',
                loading: 'lazy'
            }),
            DOMManager.createElement('span', {
                className: 'visible-text',
                textContent: text
            }),
            DOMManager.createElement('span', {
                className: 'hidden-text',
                textContent: filter
            })
        ]);
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

    setupResponsiveUI() {
        const resizeObserver = new ResizeObserver(
            Utils.throttle(() => {
                this.updateUIForScreenSize();
            }, 250)
        );

        resizeObserver.observe(document.body);
        this.updateUIForScreenSize();
    },

    updateUIForScreenSize() {
        const width = window.innerWidth;
        
        // Actualizar clases en el body
        document.body.classList.remove('mobile', 'tablet', 'desktop');
        
        if (width <= CONFIG.BREAKPOINTS.mobile) {
            document.body.classList.add('mobile');
            this.adjustMobileLayout();
        } else if (width <= CONFIG.BREAKPOINTS.tablet) {
            document.body.classList.add('tablet');
            this.adjustTabletLayout();
        } else {
            document.body.classList.add('desktop');
            this.adjustDesktopLayout();
        }
    },

    adjustMobileLayout() {
        // Ajustes específicos para móvil
        document.querySelectorAll('.service-grid').forEach(grid => {
            grid.style.gridTemplateColumns = '1fr';
        });
    },

    adjustTabletLayout() {
        // Ajustes específicos para tablet
        document.querySelectorAll('.service-grid').forEach(grid => {
            grid.style.gridTemplateColumns = 'repeat(2, 1fr)';
        });
    },

    adjustDesktopLayout() {
        // Ajustes específicos para desktop
        document.querySelectorAll('.service-grid').forEach(grid => {
            grid.style.gridTemplateColumns = 'repeat(3, 1fr)';
        });
    },

    setupAnimations() {
        if (!DEPENDENCIES.GSAP) {
            Logger.warn('GSAP not available, animations disabled');
            return;
        }

        // Configurar animaciones básicas
        this.setupScrollAnimations();
        this.setupHoverAnimations();
    },

    setupScrollAnimations() {
        if (!DEPENDENCIES.GSAP || !DEPENDENCIES.ScrollTrigger) return;

        gsap.registerPlugin(ScrollTrigger);

        // Animar elementos al hacer scroll
        gsap.utils.toArray('.animate-on-scroll').forEach(element => {
            gsap.from(element, {
                scrollTrigger: {
                    trigger: element,
                    start: "top bottom-=100",
                    toggleActions: "play none none reverse"
                },
                y: 50,
                opacity: 0,
                duration: 0.6,
                ease: "power2.out"
            });
        });
    },

    setupHoverAnimations() {
        if (!DEPENDENCIES.GSAP) return;

        // Animar botones al hover
        document.querySelectorAll('.benefit-btn, .package-btn').forEach(button => {
            button.addEventListener('mouseenter', () => {
                gsap.to(button, {
                    y: -2,
                    scale: 1.05,
                    duration: 0.2,
                    ease: "power2.out"
                });
            });

            button.addEventListener('mouseleave', () => {
                gsap.to(button, {
                    y: 0,
                    scale: 1,
                    duration: 0.2,
                    ease: "power2.out"
                });
            });
        });
    }
};


// PopupController Mejorado
const PopupController = {
    initialize() {
        try {
            this.popup = DOMManager.getElement('popup');
            this.setupEventListeners();
            this.setupKeyboardNavigation();
            this.setupTouchNavigation();
            return true;
        } catch (error) {
            ErrorHandler.log(error, 'PopupController initialization', {
                severity: 'medium',
                userImpact: true
            });
            return false;
        }
    },

    setupEventListeners() {
        if (!this.popup) return;

        const closeButton = this.popup.querySelector('.close');
        if (closeButton) {
            EventManager.add(closeButton, 'click', () => this.hidePopup());
        }

        // Cerrar al hacer clic fuera del popup
        EventManager.add(this.popup, 'click', (event) => {
            if (event.target === this.popup) {
                this.hidePopup();
            }
        });

        // Prevenir cierre al hacer clic dentro del contenido
        const popupContent = this.popup.querySelector('.popup-content');
        if (popupContent) {
            EventManager.add(popupContent, 'click', (e) => e.stopPropagation());
        }
    },

    setupKeyboardNavigation() {
        EventManager.add(window, 'keydown', (e) => {
            if (!this.isVisible()) return;

            switch(e.key) {
                case 'Escape':
                    this.hidePopup();
                    break;
                case 'ArrowRight':
                    this.navigatePopup(1);
                    break;
                case 'ArrowLeft':
                    this.navigatePopup(-1);
                    break;
            }
        });
    },

    setupTouchNavigation() {
        if (!DEPENDENCIES.TouchEvents) return;

        const content = this.popup.querySelector('.popup-content');
        if (!content) return;

        let touchStartX = 0;
        let touchEndX = 0;

        EventManager.add(content, 'touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
        }, { passive: true });

        EventManager.add(content, 'touchend', (e) => {
            touchEndX = e.changedTouches[0].clientX;
            const swipeDistance = touchEndX - touchStartX;

            if (Math.abs(swipeDistance) >= CONFIG.PERFORMANCE.MIN_SWIPE_DISTANCE) {
                this.navigatePopup(swipeDistance < 0 ? 1 : -1);
            }
        }, { passive: true });
    },

    showPopup(data, index, isPackage = false) {
        PerformanceMonitor.startMeasure('showPopup');

        const elements = this.getPopupElements();
        if (!this.validatePopupElements(elements)) return;

        try {
            AppState.currentPopupIndex = index;
            this.populatePopupContent(elements, data, isPackage);
            this.animatePopupOpen();
            
            AnalyticsManager.trackEvent('Popup', 'open', data.title);
        } catch (error) {
            ErrorHandler.log(error, 'Showing popup', {
                severity: 'medium',
                userImpact: true
            });
        }

        PerformanceMonitor.endMeasure('showPopup');
    },

    hidePopup() {
        if (!this.isVisible()) return;

        this.animatePopupClose().then(() => {
            DOMManager.setVisible(this.popup, false);
            AnalyticsManager.trackEvent('Popup', 'close');
        });
    },

    getPopupElements() {
        return {
            content: this.popup.querySelector('.popup-content'),
            title: DOMManager.getElement('popup-title'),
            image: DOMManager.getElement('popup-image'),
            description: DOMManager.getElement('popup-description'),
            benefits: this.popup.querySelector('.popup-benefits'),
            includes: this.popup.querySelector('.popup-includes'),
            duration: DOMManager.getElement('popup-duration'),
            whatsappButton: DOMManager.getElement('whatsapp-button')
        };
    },

    validatePopupElements(elements) {
        for (const [key, element] of Object.entries(elements)) {
            if (!element) {
                ErrorHandler.log(`Popup element missing: ${key}`, {
                    severity: 'high',
                    userImpact: true
                });
                return false;
            }
        }
        return true;
    },

    populatePopupContent(elements, data, isPackage) {
        // Título y descripción
        elements.title.textContent = data.title || '';
        elements.description.textContent = data.popupDescription || data.description || '';

        // Imagen
        this.loadPopupImage(elements.image, data);

        // Limpiar contenedores
        DOMManager.clearContainer(elements.benefits);
        DOMManager.clearContainer(elements.includes);

        // Poblar beneficios y extras
        this.populateBenefits(elements.benefits, data);
        if (isPackage) {
            this.populateIncludes(elements.includes, data);
        }

        // Duración y botón de WhatsApp
        elements.duration.textContent = data.duration || '';
        elements.whatsappButton.onclick = () => 
            this.sendWhatsAppMessage('Reservar', data.title);
    },

    async loadPopupImage(imageElement, data) {
        const imageUrl = ImageManager.buildImageUrl(data.popupImage || data.image);
        
        // Mostrar loading mientras carga la imagen
        imageElement.classList.add('loading');
        
        try {
            await ImageManager.loadImage(imageUrl);
            imageElement.src = imageUrl;
            imageElement.alt = data.title || '';
        } catch (error) {
            ImageManager.handleImageError(imageElement);
        } finally {
            imageElement.classList.remove('loading');
        }
    },

    populateBenefits(container, data) {
        if (!Array.isArray(data.benefits) || !Array.isArray(data.benefitsIcons)) return;

        const fragment = document.createDocumentFragment();

        data.benefits.forEach((benefit, index) => {
            const benefitItem = DOMManager.createElement('div', {
                className: 'popup-benefits-item'
            }, [
                DOMManager.createElement('img', {
                    src: ImageManager.buildImageUrl(data.benefitsIcons[index]),
                    alt: benefit,
                    loading: 'lazy'
                }),
                DOMManager.createElement('span', {
                    textContent: benefit
                })
            ]);

            fragment.appendChild(benefitItem);
        });

        container.appendChild(fragment);
    },

    populateIncludes(container, data) {
        if (!Array.isArray(data.includes)) return;

        const fragment = document.createDocumentFragment();

        data.includes.forEach(item => {
            const includeItem = DOMManager.createElement('div', {
                className: 'popup-includes-item'
            }, [
                DOMManager.createElement('img', {
                    src: ImageManager.buildImageUrl('check-icon.webp'),
                    alt: 'Incluido',
                    loading: 'lazy'
                }),
                DOMManager.createElement('span', {
                    textContent: item
                })
            ]);

            fragment.appendChild(includeItem);
        });

        container.appendChild(fragment);
    },

    navigatePopup(direction) {
        const category = AppState.currentCategory;
        const items = AppState.services[category];
        
        if (!items || !Array.isArray(items)) return;

        const newIndex = (AppState.currentPopupIndex + direction + items.length) % items.length;
        this.showPopup(
            items[newIndex], 
            newIndex, 
            category === 'paquetes'
        );

        AnalyticsManager.trackEvent('Popup', 'navigate', direction > 0 ? 'next' : 'prev');
    },

    animatePopupOpen() {
        if (!DEPENDENCIES.GSAP) {
            DOMManager.setVisible(this.popup, true);
            return Promise.resolve();
        }

        return new Promise(resolve => {
            const content = this.popup.querySelector('.popup-content');
            
            // Mostrar el popup inmediatamente
            DOMManager.setVisible(this.popup, true);
            
            // Animar el contenido
            gsap.fromTo(content,
                { 
                    opacity: 0,
                    y: 20,
                    scale: 0.95
                },
                {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    duration: 0.3,
                    ease: "power2.out",
                    onComplete: resolve
                }
            );
        });
    },

    animatePopupClose() {
        if (!DEPENDENCIES.GSAP) {
            DOMManager.setVisible(this.popup, false);
            return Promise.resolve();
        }

        return new Promise(resolve => {
            const content = this.popup.querySelector('.popup-content');
            
            gsap.to(content, {
                opacity: 0,
                y: 20,
                scale: 0.95,
                duration: 0.2,
                ease: "power2.in",
                onComplete: resolve
            });
        });
    },

    isVisible() {
        return this.popup && this.popup.style.display !== 'none';
    },

    sendWhatsAppMessage(action, serviceTitle) {
        const message = encodeURIComponent(`Hola! Quiero ${action} un ${serviceTitle}`);
        const url = `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${message}`;
        
        window.open(url, '_blank');
        AnalyticsManager.trackEvent('WhatsApp', 'click', serviceTitle);
    }
};
// CarouselController Mejorado
const CarouselController = {
    state: {
        currentIndex: 0,
        isAnimating: false,
        autoplayInterval: null,
        touchStartX: 0,
        touchStartY: 0,
        itemWidth: 0,
        itemsCount: 0
    },

    async initialize() {
        try {
            await Promise.all([
                this.loadCarouselContent(),
                this.loadPaqcarrContent()
            ]);

            this.initCarousel();
            this.initPaqcarr();
            return true;
        } catch (error) {
            ErrorHandler.log(error, 'CarouselController initialization', {
                severity: 'medium',
                userImpact: true
            });
            return false;
        }
    },

    async loadCarouselContent() {
        PerformanceMonitor.startMeasure('loadCarousel');
        
        try {
            const cached = CacheManager.get('carouselContent');
            if (cached) {
                this.insertCarouselContent(cached);
                return;
            }

            const response = await fetch('carrusel.html');
            const data = await response.text();
            
            CacheManager.set('carouselContent', data);
            this.insertCarouselContent(data);
        } catch (error) {
            ErrorHandler.log(error, 'Loading carousel content');
            this.handleCarouselError();
        } finally {
            PerformanceMonitor.endMeasure('loadCarousel');
        }
    },

    async loadPaqcarrContent() {
        PerformanceMonitor.startMeasure('loadPaqcarr');
        
        try {
            const cached = CacheManager.get('paqcarrContent');
            if (cached) {
                this.insertPaqcarrContent(cached);
                return;
            }

            const response = await fetch('paqcarr.html');
            const data = await response.text();
            
            CacheManager.set('paqcarrContent', data);
            this.insertPaqcarrContent(data);
        } catch (error) {
            ErrorHandler.log(error, 'Loading paqcarr content');
            this.handlePaqcarrError();
        } finally {
            PerformanceMonitor.endMeasure('loadPaqcarr');
        }
    },

    insertCarouselContent(content) {
        const container = DOMManager.getElement('carrusel-container');
        if (container) {
            container.innerHTML = content;
            this.preloadCarouselImages(container);
        }
    },

    insertPaqcarrContent(content) {
        const container = DOMManager.getElement('paqcarr-container');
        if (container) {
            container.innerHTML = content;
            this.preloadPaqcarrImages(container);
        }
    },

    preloadCarouselImages(container) {
        const images = container.querySelectorAll('img');
        images.forEach(img => {
            const originalSrc = img.getAttribute('src');
            if (originalSrc) {
                img.src = `${CONFIG.CAROUSEL_IMAGE_BASE_URL}${originalSrc}`;
                ImageManager.loadImage(img.src);
            }
        });
    },

    preloadPaqcarrImages(container) {
        const images = container.querySelectorAll('img[data-image]');
        images.forEach(img => {
            const imageUrl = img.getAttribute('data-image');
            if (imageUrl) {
                ImageManager.loadImage(imageUrl);
            }
        });
    },

    initCarousel() {
        const carousel = DOMManager.getElement('carrusel-container');
        if (!carousel) return;

        const items = carousel.querySelectorAll('.carousel-item');
        if (items.length === 0) return;

        this.state.itemsCount = items.length;
        this.state.itemWidth = items[0].offsetWidth;

        this.setupCarouselControls(carousel);
        this.setupCarouselIndicators(carousel, items);
        this.setupCarouselNavigation(carousel);
        this.setupAutoplay();

        // Mostrar primer slide
        this.showSlide(0);
    },

    setupCarouselControls(carousel) {
        const prevBtn = carousel.querySelector('.carousel-control.prev');
        const nextBtn = carousel.querySelector('.carousel-control.next');

        if (prevBtn) {
            EventManager.add(prevBtn, 'click', () => this.navigate(-1));
        }
        if (nextBtn) {
            EventManager.add(nextBtn, 'click', () => this.navigate(1));
        }
    },

    setupCarouselIndicators(carousel, items) {
        const indicators = carousel.querySelectorAll('.carousel-indicators button');
        indicators.forEach((indicator, index) => {
            EventManager.add(indicator, 'click', () => this.showSlide(index));
        });
    },

    setupCarouselNavigation(carousel) {
        if (DEPENDENCIES.TouchEvents) {
            this.setupTouchNavigation(carousel);
        }
        if (DEPENDENCIES.PointerEvents) {
            this.setupDragNavigation(carousel);
        }

        // Keyboard navigation
        EventManager.add(carousel, 'keydown', (e) => {
            if (e.key === 'ArrowRight') {
                this.navigate(1);
            } else if (e.key === 'ArrowLeft') {
                this.navigate(-1);
            }
        });
    },

    setupTouchNavigation(carousel) {
        let touchStartX = 0;
        let touchStartY = 0;

        EventManager.add(carousel, 'touchstart', (e) => {
            touchStartX = e.touches[0].screenX;
            touchStartY = e.touches[0].screenY;
            this.pauseAutoplay();
        }, { passive: true });

        EventManager.add(carousel, 'touchend', (e) => {
            const touchEndX = e.changedTouches[0].screenX;
            const touchEndY = e.changedTouches[0].screenY;
            
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;

            // Asegurarse de que el swipe es más horizontal que vertical
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                if (Math.abs(deltaX) >= CONFIG.PERFORMANCE.MIN_SWIPE_DISTANCE) {
                    this.navigate(deltaX < 0 ? 1 : -1);
                }
            }

            this.resumeAutoplay();
        }, { passive: true });
    },

    setupDragNavigation(carousel) {
        let isDragging = false;
        let startX = 0;
        let scrollLeft = 0;

        EventManager.add(carousel, 'pointerdown', (e) => {
            isDragging = true;
            carousel.style.cursor = 'grabbing';
            startX = e.pageX - carousel.offsetLeft;
            scrollLeft = carousel.scrollLeft;
            this.pauseAutoplay();
        });

        EventManager.add(carousel, 'pointermove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            const x = e.pageX - carousel.offsetLeft;
            const walk = (x - startX) * 2;
            carousel.scrollLeft = scrollLeft - walk;
        });

        const endDragging = () => {
            isDragging = false;
            carousel.style.cursor = 'grab';
            this.resumeAutoplay();
        };

        EventManager.add(carousel, 'pointerup', endDragging);
        EventManager.add(carousel, 'pointerleave', endDragging);
    },

    setupAutoplay(interval = 5000) {
        this.state.autoplayInterval = setInterval(() => {
            this.navigate(1);
        }, interval);
    },

    pauseAutoplay() {
        if (this.state.autoplayInterval) {
            clearInterval(this.state.autoplayInterval);
            this.state.autoplayInterval = null;
        }
    },

    resumeAutoplay() {
        this.setupAutoplay();
    },

    showSlide(index) {
        if (this.state.isAnimating) return;
        
        const carousel = DOMManager.getElement('carrusel-container');
        if (!carousel) return;

        this.state.isAnimating = true;
        this.state.currentIndex = index;

        const carouselList = carousel.querySelector('.carousel');
        if (!carouselList) return;

        // Usar GSAP si está disponible, sino fallback a CSS transition
        if (DEPENDENCIES.GSAP) {
            gsap.to(carouselList, {
                x: -index * this.state.itemWidth,
                duration: 0.5,
                ease: "power2.inOut",
                onComplete: () => {
                    this.state.isAnimating = false;
                    this.updateIndicators(carousel, index);
                }
            });
        } else {
            carouselList.style.transition = 'transform 0.5s ease-in-out';
            carouselList.style.transform = `translateX(-${index * this.state.itemWidth}px)`;
            
            setTimeout(() => {
                this.state.isAnimating = false;
                this.updateIndicators(carousel, index);
            }, 500);
        }

        AnalyticsManager.trackEvent('Carousel', 'slide-change', index.toString());
    },

    navigate(direction) {
        if (this.state.isAnimating) return;

        const newIndex = (this.state.currentIndex + direction + this.state.itemsCount) % this.state.itemsCount;
        this.showSlide(newIndex);
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
    },

    handleCarouselError() {
        const container = DOMManager.getElement('carrusel-container');
        if (container) {
            container.innerHTML = '<p class="error-message">Error al cargar el carrusel</p>';
        }
    },

    handlePaqcarrError() {
        const container = DOMManager.getElement('paqcarr-container');
        if (container) {
            container.innerHTML = '<p class="error-message">Error al cargar el contenido</p>';
        }
    },

    initPaqcarr() {
        const carousel = DOMManager.getElement('paqcarr-container');
        if (!carousel) return;

        const items = carousel.querySelectorAll('.image-nav-item');
        if (items.length === 0) return;

        items.forEach(item => {
            EventManager.add(item, 'click', () => {
                this.handlePaqcarrItemClick(item, items, carousel);
            });
        });

        // Activar el primer item por defecto
        if (items[0]) {
            items[0].click();
        }
    },

    handlePaqcarrItemClick(item, allItems, carousel) {
        const image = item.getAttribute('data-image');
        const title = item.getAttribute('data-title');
        const description = item.getAttribute('data-description');

        const mainImageContainer = carousel.querySelector('.main-image-container');
        if (!mainImageContainer) return;

        this.updatePaqcarrMainImage(mainImageContainer, image, title);
        this.updatePaqcarrInfo(mainImageContainer, title, description);
        this.updatePaqcarrActiveState(item, allItems);

        AnalyticsManager.trackEvent('Paqcarr', 'item-click', title);
    },

    updatePaqcarrMainImage(container, image, title) {
        const mainImage = container.querySelector('.main-image');
        if (mainImage) {
            if (DEPENDENCIES.GSAP) {
                gsap.to(mainImage, {
                    opacity: 0,
                    duration: 0.3,
                    onComplete: () => {
                        mainImage.src = image;
                        mainImage.alt = title;
                        gsap.to(mainImage, {
                            opacity: 1,
                            duration: 0.3
                        });
                    }
                });
            } else {
                mainImage.style.opacity = '0';
                setTimeout(() => {
                    mainImage.src = image;
                    mainImage.alt = title;
                    mainImage.style.opacity = '1';
                }, 300);
            }
        }
    },

    updatePaqcarrInfo(container, title, description) {
        const imageInfo = container.querySelector('.image-info');
        if (imageInfo) {
            if (DEPENDENCIES.GSAP) {
                gsap.to(imageInfo, {
                    opacity: 0,
                    y: 20,
                    duration: 0.3,
                    onComplete: () => {
                        imageInfo.innerHTML = `
                            <h3>${title}</h3>
                            <p>${description}</p>
                        `;
                        gsap.to(imageInfo, {
                            opacity: 1,
                            y: 0,
                            duration: 0.3
                        });
                    }
                });
            } else {
                imageInfo.style.opacity = '0';
                imageInfo.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    imageInfo.innerHTML = `
                        <h3>${title}</h3>
                        <p>${description}</p>
                    `;
                    imageInfo.style.opacity = '1';
                    imageInfo.style.transform = 'translateY(0)';
                }, 300);
            }
        }
    },

    updatePaqcarrActiveState(activeItem, allItems) {
        allItems.forEach(item => item.classList.remove('active'));
        activeItem.classList.add('active');
    }
};

// GalleryController Mejorado
const GalleryController = {
    state: {
        images: [],
        currentIndex: 0,
        isModalOpen: false
    },

    initialize() {
        try {
            this.loadGalleryImages();
            this.setupGallery();
            this.setupGalleryModal();
            this.setupGalleryAnimations();
            return true;
        } catch (error) {
            ErrorHandler.log(error, 'GalleryController initialization', {
                severity: 'medium',
                userImpact: true
            });
            return false;
        }
    },

    loadGalleryImages() {
        this.state.images = [
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

        // Precargar imágenes
        this.state.images.forEach(image => {
            ImageManager.preloadImages([ImageManager.buildImageUrl(image.src)]);
        });
    },

    setupGallery() {
        const galleryGrid = document.querySelector('.gallery-grid');
        const verMasButton = DOMManager.getElement('ver-mas-galeria');

        if (!galleryGrid || !verMasButton) {
            Logger.error('Gallery elements not found');
            return;
        }

        // Crear fragmento para mejor rendimiento
        const fragment = document.createDocumentFragment();

        this.state.images.forEach(image => {
            const galleryItem = this.createGalleryItem(image);
            fragment.appendChild(galleryItem);
        });

        galleryGrid.appendChild(fragment);

        EventManager.add(verMasButton, 'click', () => {
            window.location.href = 'galeria.html';
            AnalyticsManager.trackEvent('Gallery', 'ver-mas-click');
        });
    },

    createGalleryItem(image) {
        const galleryItem = DOMManager.createElement('div', {
            className: 'gallery-item animate-entry'
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

        // Manejar errores de carga de imagen
        const img = galleryItem.querySelector('img');
        img.onerror = () => ImageManager.handleImageError(img);

        // Agregar evento click
        EventManager.add(galleryItem, 'click', () => {
            this.showImageDetails(image);
            AnalyticsManager.trackEvent('Gallery', 'image-click', image.title);
        });

        // Agregar animaciones de hover si GSAP está disponible
        if (DEPENDENCIES.GSAP) {
            this.setupItemHoverAnimation(galleryItem);
        }

        return galleryItem;
    },

    setupItemHoverAnimation(item) {
        const overlay = item.querySelector('.image-overlay');
        
        item.addEventListener('mouseenter', () => {
            gsap.to(overlay, {
                opacity: 1,
                y: 0,
                duration: 0.3,
                ease: "power2.out"
            });
        });

        item.addEventListener('mouseleave', () => {
            gsap.to(overlay, {
                opacity: 0,
                y: 20,
                duration: 0.3,
                ease: "power2.in"
            });
        });
    },

    showImageDetails(image) {
        const modal = DOMManager.getElement('imageModal');
        const modalImg = DOMManager.getElement('modalImage');
        const modalDescription = DOMManager.getElement('modalDescription');

        if (!modal || !modalImg || !modalDescription) {
            Logger.error('Modal elements not found');
            return;
        }

        // Actualizar índice actual
        this.state.currentIndex = this.state.images.findIndex(img => img.src === image.src);

        // Cargar imagen con loading spinner
        modalImg.classList.add('loading');
        modalImg.src = ImageManager.buildImageUrl(image.src);
        modalImg.alt = image.title;

        modalDescription.innerHTML = `
            <h3>${image.title}</h3>
            <p>${image.description}</p>
        `;

        // Mostrar modal con animación
        this.showModal(modal);

        // Quitar loading cuando la imagen cargue
        modalImg.onload = () => modalImg.classList.remove('loading');
        modalImg.onerror = () => {
            modalImg.classList.remove('loading');
            ImageManager.handleImageError(modalImg);
        };
    },

    setupGalleryModal() {
        const modal = DOMManager.getElement('imageModal');
        if (!modal) return;

        const closeBtn = modal.querySelector('.close');
        if (closeBtn) {
            EventManager.add(closeBtn, 'click', () => this.hideModal(modal));
        }

        // Cerrar al hacer clic fuera de la imagen
        EventManager.add(modal, 'click', (event) => {
            if (event.target === modal) {
                this.hideModal(modal);
            }
        });

        // Navegación con teclado
        EventManager.add(window, 'keydown', (e) => {
            if (!this.state.isModalOpen) return;

            switch(e.key) {
                case 'Escape':
                    this.hideModal(modal);
                    break;
                case 'ArrowRight':
                    this.navigateGallery(1);
                    break;
                case 'ArrowLeft':
                    this.navigateGallery(-1);
                    break;
            }
        });

        // Navegación táctil
        if (DEPENDENCIES.TouchEvents) {
            this.setupModalTouchNavigation(modal);
        }
    },

    setupModalTouchNavigation(modal) {
        let touchStartX = 0;
        let touchStartY = 0;

        EventManager.add(modal, 'touchstart', (e) => {
            touchStartX = e.touches[0].screenX;
            touchStartY = e.touches[0].screenY;
        }, { passive: true });

        EventManager.add(modal, 'touchend', (e) => {
            const touchEndX = e.changedTouches[0].screenX;
            const touchEndY = e.changedTouches[0].screenY;
            
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;

            // Asegurarse de que el swipe es más horizontal que vertical
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                if (Math.abs(deltaX) >= CONFIG.PERFORMANCE.MIN_SWIPE_DISTANCE) {
                    this.navigateGallery(deltaX < 0 ? 1 : -1);
                }
            }
        }, { passive: true });
    },

    navigateGallery(direction) {
        const newIndex = (this.state.currentIndex + direction + this.state.images.length) % this.state.images.length;
        const newImage = this.state.images[newIndex];
        this.showImageDetails(newImage);
    },

    showModal(modal) {
        this.state.isModalOpen = true;

        if (DEPENDENCIES.GSAP) {
            gsap.set(modal, { display: 'block' });
            gsap.from(modal, {
                opacity: 0,
                duration: 0.3,
                ease: "power2.out"
            });
        } else {
            modal.style.display = 'block';
        }
    },

    hideModal(modal) {
        if (DEPENDENCIES.GSAP) {
            gsap.to(modal, {
                opacity: 0,
                duration: 0.3,
                ease: "power2.in",
                onComplete: () => {
                    modal.style.display = 'none';
                    this.state.isModalOpen = false;
                }
            });
        } else {
            modal.style.display = 'none';
            this.state.isModalOpen = false;
        }
    },

    setupGalleryAnimations() {
        if (!DEPENDENCIES.GSAP || !DEPENDENCIES.ScrollTrigger) {
            Logger.warn('GSAP or ScrollTrigger not available, animations disabled');
            return;
        }

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
                { 
                    scale: 0.8, 
                    opacity: 0 
                },
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

// AnimationController Mejorado
const AnimationController = {
    initialize() {
        if (!DEPENDENCIES.GSAP) {
            Logger.warn('GSAP not available, animations will be disabled');
            return false;
        }

        try {
            this.setupGlobalAnimations();
            this.setupScrollAnimations();
            this.setupHoverEffects();
            this.setupEntryAnimations();
            return true;
        } catch (error) {
            ErrorHandler.log(error, 'AnimationController initialization', {
                severity: 'low',
                userImpact: false
            });
            return false;
        }
    },

    setupGlobalAnimations() {
        // Configuración global de GSAP
        gsap.config({
            nullTargetWarn: false,
            trialWarn: false
        });

        // Registrar plugins si están disponibles
        if (DEPENDENCIES.ScrollTrigger) {
            gsap.registerPlugin(ScrollTrigger);
            ScrollTrigger.config({
                limitCallbacks: true,
                ignoreMobileResize: true
            });
        }
    },

    setupScrollAnimations() {
        if (!DEPENDENCIES.ScrollTrigger) return;

        const animateElements = (elements, animation) => {
            elements.forEach((element, index) => {
                gsap.from(element, {
                    scrollTrigger: {
                        trigger: element,
                        start: "top bottom-=100",
                        toggleActions: "play none none reverse"
                    },
                    ...animation,
                    delay: index * 0.1
                });
            });
        };

        // Animar servicios
        animateElements(gsap.utils.toArray('.service-item'), {
            y: 50,
            opacity: 0,
            duration: 0.6,
            ease: "power2.out"
        });

        // Animar beneficios
        animateElements(gsap.utils.toArray('.benefit-btn'), {
            opacity: 0,
            y: 20,
            duration: 0.4,
            ease: "power2.out"
        });

        // Animar secciones
        animateElements(gsap.utils.toArray('section'), {
            opacity: 0,
            y: 30,
            duration: 0.8,
            ease: "power2.out"
        });
    },

    setupHoverEffects() {
        const setupHover = (element, animation) => {
            element.addEventListener('mouseenter', () => {
                gsap.to(element, {
                    ...animation.enter,
                    duration: 0.2,
                    ease: "power2.out"
                });
            });

            element.addEventListener('mouseleave', () => {
                gsap.to(element, {
                    ...animation.leave,
                    duration: 0.2,
                    ease: "power2.in"
                });
            });
        };

        // Botones de beneficios y paquetes
        document.querySelectorAll('.benefit-btn, .package-btn').forEach(button => {
            setupHover(button, {
                enter: { y: -2, scale: 1.05 },
                leave: { y: 0, scale: 1 }
            });
        });

        // Items de servicios
        document.querySelectorAll('.service-item').forEach(item => {
            setupHover(item, {
                enter: { y: -5, boxShadow: "0 10px 20px rgba(0,0,0,0.2)" },
                leave: { y: 0, boxShadow: "0 5px 10px rgba(0,0,0,0.1)" }
            });
        });
    },

    setupEntryAnimations() {
        gsap.utils.toArray('.animate-entry').forEach((element, index) => {
            gsap.from(element, {
                scrollTrigger: {
                    trigger: element,
                    start: "top bottom-=50",
                    toggleActions: "play none none reverse"
                },
                opacity: 0,
                y: 30,
                duration: 0.6,
                delay: index * 0.1,
                ease: "power2.out"
            });
        });
    },

    // Utilidades de animación
    fadeIn(element, duration = 0.3) {
        return gsap.fromTo(element,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration, ease: "power2.out" }
        );
    },

    fadeOut(element, duration = 0.3) {
        return gsap.to(element, {
            opacity: 0,
            y: -20,
            duration,
            ease: "power2.in"
        });
    },

    shake(element, intensity = 5) {
        return gsap.to(element, {
            x: intensity,
            duration: 0.1,
            repeat: 3,
            yoyo: true,
            ease: "power2.inOut"
        });
    }
};

// FilterController Mejorado
const FilterController = {
    state: {
        currentFilters: new Set(),
        activeCategory: null
    },

    initialize() {
        try {
            this.setupCategoryFilters();
            this.setupBenefitFilters();
            this.setupPackageFilters();
            this.setupURLHandling();
            return true;
        } catch (error) {
            ErrorHandler.log(error, 'FilterController initialization', {
                severity: 'medium',
                userImpact: true
            });
            return false;
        }
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
        EventManager.delegate(
            document.body,
            '.benefit-btn',
            'click',
            (event, button) => {
                const filter = button.getAttribute('data-filter');
                this.filterByBenefit(filter);
            }
        );
    },

    setupPackageFilters() {
        EventManager.delegate(
            document.body,
            '.package-btn',
            'click',
            (event, button) => {
                const filter = button.getAttribute('data-filter');
                this.filterByPackageType(filter);
            }
        );
    },

    setupURLHandling() {
        // Manejar filtros desde URL al cargar
        const params = new URLSearchParams(window.location.search);
        const category = params.get('category');
        const filter = params.get('filter');

        if (category) {
            this.changeCategory(category, false);
        }
        if (filter) {
            this.applyFilter(filter, false);
        }

        // Actualizar URL cuando cambian los filtros
        window.addEventListener('popstate', (event) => {
            if (event.state) {
                const { category, filter } = event.state;
                if (category) this.changeCategory(category, false);
                if (filter) this.applyFilter(filter, false);
            }
        });
    },

    changeCategory(category, updateURL = true) {
        PerformanceMonitor.startMeasure('changeCategory');

        try {
            this.state.activeCategory = category;
            AppState.currentCategory = category;
            
            // Actualizar UI
            ServicesController.renderServices(category);
            UIController.setupBenefitsNav(category);
            
            // Actualizar URL si es necesario
            if (updateURL) {
                const url = new URL(window.location);
                url.searchParams.set('category', category);
                window.history.pushState({ category }, '', url);
            }

            // Trackear cambio
            AnalyticsManager.trackEvent('Filter', 'category-change', category);
        } catch (error) {
            ErrorHandler.log(error, 'Changing category', {
                severity: 'medium',
                userImpact: true
            });
        }

        PerformanceMonitor.endMeasure('changeCategory');
    },

    filterByBenefit(benefit) {
        this.applyFilter(benefit, '.service-item');
    },

    filterByPackageType(type) {
        this.applyFilter(type, '.package-item');
    },

    applyFilter(filter, selector, updateURL = true) {
        PerformanceMonitor.startMeasure('applyFilter');

        try {
            const items = document.querySelectorAll(selector);
            const showAll = filter === 'all';

            items.forEach(item => {
                const display = showAll || item.classList.contains(filter) ? 
                    'block' : 'none';
                
                if (DEPENDENCIES.GSAP) {
                    if (display === 'block') {
                        gsap.fromTo(item,
                            { opacity: 0, y: 20 },
                            { opacity: 1, y: 0, duration: 0.3, display: 'block' }
                        );
                    } else {
                        gsap.to(item, {
                            opacity: 0,
                            y: -20,
                            duration: 0.3,
                            onComplete: () => item.style.display = 'none'
                        });
                    }
                } else {
                    item.style.display = display;
                }
            });

            // Actualizar estado
            if (showAll) {
                this.state.currentFilters.clear();
            } else {
                this.state.currentFilters.add(filter);
            }

            // Actualizar URL si es necesario
            if (updateURL) {
                const url = new URL(window.location);
                url.searchParams.set('filter', filter);
                window.history.pushState({ filter }, '', url);
            }

            // Trackear filtro
            AnalyticsManager.trackEvent('Filter', 'apply-filter', filter);
        } catch (error) {
            ErrorHandler.log(error, 'Applying filter', {
                severity: 'medium',
                userImpact: true
            });
        }

        PerformanceMonitor.endMeasure('applyFilter');
    },

    getCurrentFilters() {
        return Array.from(this.state.currentFilters);
    },

    clearFilters() {
        this.state.currentFilters.clear();
        this.applyFilter('all', '.service-item, .package-item');
    }
};

// App Initialization System
const App = {
    async init() {
        if (AppState.initialized) {
            Logger.warn('App already initialized');
            return;
        }

        try {
            PerformanceMonitor.startMeasure('app-init');
            Logger.info('Initializing application...');
            
            // Verificar dependencias críticas
            this.checkCriticalDependencies();
            
            // Inicializar controladores core
            await this.initializeCoreControllers();
            
            // Inicializar controladores adicionales
            await this.initializeAdditionalControllers();
            
            // Configurar características globales
            this.setupGlobalFeatures();
            
            AppState.initialized = true;
            
            const initDuration = PerformanceMonitor.endMeasure('app-init');
            PerformanceMonitor.logPerformance('App Initialization', initDuration);
            
            Logger.info('Application initialized successfully');
            AnalyticsManager.trackEvent('App', 'initialization', 'success');
        } catch (error) {
            this.handleInitializationError(error);
        }
    },

    checkCriticalDependencies() {
        const critical = ['IntersectionObserver', 'ResizeObserver'];
        const missing = critical.filter(dep => !DEPENDENCIES[dep]);
        
        if (missing.length > 0) {
            Logger.warn(`Missing critical dependencies: ${missing.join(', ')}`);
        }
    },

    async initializeCoreControllers() {
        // Inicializar controladores core en orden
        await Promise.all([
            ResponsiveController.init(),
            await ServicesController.initialize(),
            PopupController.initialize(),
            GalleryController.initialize()
        ]);

        // Cargar contenido del carrusel
        await Promise.all([
            CarouselController.loadCarouselContent(),
            CarouselController.loadPaqcarrContent()
        ]);
    },

    async initializeAdditionalControllers() {
        // Inicializar controladores adicionales
        FilterController.initialize();
        AnimationController.initialize();
        await ServiceWorkerManager.register();
    },

    setupGlobalFeatures() {
        this.setupGlobalEventListeners();
        this.setupLazyLoading();
        this.setupErrorHandling();
    },

    setupGlobalEventListeners() {
        // Manejo de errores de imágenes
        document.querySelectorAll('img').forEach(img => {
            EventManager.add(img, 'error', () => ImageManager.handleImageError(img));
        });

        // Navegación por teclado
        EventManager.add(document, 'keydown', this.handleKeyboardNavigation);

        // Carga de página
        window.addEventListener('load', this.handlePageLoad);

        // Redimensionamiento
        window.addEventListener('resize', Utils.debounce(() => {
            ResponsiveController.handleResize();
        }, CONFIG.PERFORMANCE.DEBOUNCE_DELAY));
    },

    setupLazyLoading() {
        if (!DEPENDENCIES.IntersectionObserver) {
            Logger.warn('IntersectionObserver not available, lazy loading disabled');
            return;
        }

        const imageObserver = new IntersectionObserver(
            (entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                            AnalyticsManager.trackEvent('Image', 'lazy-load', img.src);
                        }
                        observer.unobserve(img);
                    }
                });
            },
            { 
                rootMargin: CONFIG.PERFORMANCE.INTERSECTION_MARGIN,
                threshold: 0.1
            }
        );

        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    },

    setupErrorHandling() {
        window.addEventListener('error', (event) => {
            ErrorHandler.log(event.error, 'Global error');
        });

        window.addEventListener('unhandledrejection', (event) => {
            ErrorHandler.log(event.reason, 'Unhandled Promise rejection');
        });
    },

    handleKeyboardNavigation(e) {
        if (e.key === 'Escape') {
            const popup = DOMManager.getElement('popup');
            const imageModal = DOMManager.getElement('imageModal');
            if (popup) popup.style.display = 'none';
            if (imageModal) imageModal.style.display = 'none';
        }
    },


handlePageLoad() {
        document.body.classList.add('loaded');
        
        // Manejar navegación por hash
        if (location.hash) {
            const targetElement = document.querySelector(location.hash);
            if (targetElement) {
                setTimeout(() => {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }, 100);
            }
        }

        AnalyticsManager.trackPageView(window.location.pathname);
    },

    handleInitializationError(error) {
        ErrorHandler.log(error, 'App initialization', {
            severity: 'high',
            userImpact: true
        });

        const mainContainer = DOMManager.getElement('main');
        if (mainContainer) {
            mainContainer.innerHTML = `
                <div class="error-container">
                    <h2>Lo sentimos, ha ocurrido un error</h2>
                    <p>Por favor, intente recargar la página</p>
                    <button onclick="location.reload()" class="retry-button">
                        Recargar página
                    </button>
                </div>
            `;
        }

        AnalyticsManager.trackEvent('App', 'initialization', 'error');
    },

    cleanup() {
        try {
            // Limpiar todos los event listeners
            EventManager.removeAll();
            
            // Limpiar caché
            CacheManager.clear();
            
            // Limpiar errores registrados
            ErrorHandler.clearErrors();
            
            // Limpiar métricas de rendimiento
            PerformanceMonitor.clearMetrics();
            
            // Desregistrar Service Worker en modo debug
            if (CONFIG.DEBUG) {
                ServiceWorkerManager.unregister();
            }
            
            // Limpiar estado de la aplicación
            AppState.initialized = false;
            
            Logger.info('Application cleanup completed');
        } catch (error) {
            ErrorHandler.log(error, 'App cleanup', {
                severity: 'medium',
                userImpact: false
            });
        }
    }
};

// Service Worker Manager Mejorado
const ServiceWorkerManager = {
    async register() {
        if (!('serviceWorker' in navigator)) {
            Logger.warn('Service Worker not supported');
            return null;
        }

        try {
            const registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/'
            });
            
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        this.notifyUpdate();
                    }
                });
            });

            Logger.info('ServiceWorker registration successful');
            return registration;
        } catch (error) {
            ErrorHandler.log(error, 'ServiceWorker registration', {
                severity: 'low',
                userImpact: false
            });
            return null;
        }
    },

    async unregister() {
        if (!('serviceWorker' in navigator)) return;

        try {
            const registration = await navigator.serviceWorker.ready;
            await registration.unregister();
            Logger.info('ServiceWorker unregistered');
        } catch (error) {
            ErrorHandler.log(error, 'ServiceWorker unregistration');
        }
    },

    notifyUpdate() {
        // Mostrar notificación de actualización disponible
        const notification = DOMManager.createElement('div', {
            className: 'update-notification',
            innerHTML: `
                <p>¡Nueva versión disponible!</p>
                <button onclick="location.reload()">Actualizar ahora</button>
            `
        });

        document.body.appendChild(notification);
        
        if (DEPENDENCIES.GSAP) {
            gsap.from(notification, {
                y: 50,
                opacity: 0,
                duration: 0.3,
                ease: "power2.out"
            });
        }
    }
};

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', () => {
    App.init().catch(error => {
        ErrorHandler.log(error, 'App initialization', {
            severity: 'high',
            userImpact: true
        });
        
        ErrorHandler.showErrorMessage(
            'Ha ocurrido un error al cargar la aplicación. Por favor, recarga la página.',
            document.body,
            10000
        );
    });
});

// Limpieza al descargar la página
window.addEventListener('unload', () => App.cleanup());

// Exportar componentes necesarios al objeto window
Object.assign(window, {
    // Configuración y estado
    CONFIG,
    AppState,
    DEPENDENCIES,
    
    // Gestores base
    EventManager,
    ImageManager,
    DOMManager,
    Logger,
    
    // Sistemas y utilidades
    CacheManager,
    Utils,
    ErrorHandler,
    AnalyticsManager,
    PerformanceMonitor,
    ServiceWorkerManager,
    
    // Controladores principales
    App,
    ServicesController,
    UIController,
    PopupController,
    CarouselController,
    GalleryController,
    FilterController,
    AnimationController,
    ResponsiveController
});

// Exportar versión y tiempo de compilación
Object.defineProperties(window, {
    'APP_VERSION': {
        value: '1.0.0',
        writable: false,
        configurable: false
    },
    'BUILD_TIME': {
        value: new Date().toISOString(),
        writable: false,
        configurable: false
    }
});
