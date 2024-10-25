// Configuración y estado global
const CONFIG={BASE_URL:"https://raw.githubusercontent.com/elitemassagemx/Home/main/IMG/",CAROUSEL_IMAGE_BASE_URL:"https://raw.githubusercontent.com/elitemassagemx/prueba/main/carruimg/",DEFAULT_ERROR_IMAGE:"https://raw.githubusercontent.com/elitemassagemx/Home/main/IMG/error.webp",WHATSAPP_NUMBER:"5215640020305",ANIMATION_DURATION:300,CACHE_DURATION:3600000,DEBUG:true},AppState={services:{},currentPopupIndex:0,currentCategory:"masajes",activeBenefit:"all",loading:false,error:null,cache:new Map,initialized:false};

// Logger y Error Handler
const Logger={log(e,t){CONFIG.DEBUG&&console.log(`[${e}]`,t)},error(e,t){CONFIG.DEBUG&&console.error(`[${e}]`,t)}},ErrorHandler={handle(e,t){Logger.error(t,e),AppState.error=e}};

// Gestor de Analytics
const Analytics={track(e,t){CONFIG.DEBUG&&Logger.log("Analytics",`${e}: ${t}`)}};

// Gestor de Caché
const CacheManager={get:e=>AppState.cache.get(e),set(e,t){AppState.cache.set(e,t)},clear(){AppState.cache.clear()}};

// Gestor de Imágenes
const ImageManager={async load(e){try{const t=await fetch(e);if(!t.ok)throw Error("Image load failed");return e}catch{return CONFIG.DEFAULT_ERROR_IMAGE}},buildUrl:e=>e?.startsWith("http")?e:CONFIG.BASE_URL+e};

// Controlador de Servicios
const ServicesController={async init(){try{return await this.loadServices(),this.setupEvents(),this.renderInitial(),!0}catch(e){return ErrorHandler.handle(e,"ServicesController init"),!1}},async loadServices(){const e=CacheManager.get("services");if(e)return AppState.services=e,!0;try{const e=await fetch("https://raw.githubusercontent.com/elitemassagemx/Home/main/data.json"),t=await e.json();return AppState.services=t.services,CacheManager.set("services",t.services),!0}catch(e){return ErrorHandler.handle(e,"Loading services"),!1}},setupEvents(){document.querySelectorAll('.service-category-toggle input[type="radio"]').forEach(e=>{e.addEventListener("change",()=>{AppState.currentCategory=e.value,this.renderServices()})}),document.addEventListener("click",e=>{if(e.target.classList.contains("saber-mas-button")){const t=e.target.closest(".service-item");if(!t)return;const r=Array.from(t.parentNode.children).indexOf(t),s=AppState.services[AppState.currentCategory][r];PopupController.show(s)}})},renderServices(){const e=document.getElementById("services-grid");if(!e)return;e.innerHTML="";const t=AppState.services[AppState.currentCategory];if(!Array.isArray(t))return void(e.innerHTML="<p>No se encontraron servicios</p>");const r=document.createDocumentFragment();t.forEach(e=>{const t=this.createServiceElement(e);r.appendChild(t)}),e.appendChild(r)},createServiceElement(e){const t=document.createElement("div");return t.className="service-item",t.innerHTML=`
            <div class="service-content">
                <div class="service-header">
                    <img src="${ImageManager.buildUrl(e.icon)}" alt="" class="service-icon">
                    <h3 class="service-title">${e.title}</h3>
                </div>
                <p class="service-description">${e.description}</p>
                ${this.renderBenefits(e)}
                <div class="duration-container">
                    <img src="${CONFIG.BASE_URL}duration-icon.webp" alt="" class="duration-icon">
                    <span>${e.duration||""}</span>
                </div>
                <button class="saber-mas-button">Saber más</button>
            </div>
        `,t},renderBenefits(e){return e.benefits?`
            <div class="benefits-container">
                ${e.benefits.map((t,r)=>`
                    <div class="benefit">
                        <img src="${ImageManager.buildUrl(e.benefitsIcons[r])}" alt="">
                        <span>${t}</span>
                    </div>
                `).join("")}
            </div>
        `:""}};

// Controlador de Popups
const PopupController={show(e){const t=document.getElementById("popup");t&&(AppState.currentPopupIndex=AppState.services[AppState.currentCategory].indexOf(e),this.updatePopupContent(t,e),t.style.display="block",Analytics.track("popup_open",e.title))},updatePopupContent(e,t){const r=e.querySelector("#popup-image"),s=e.querySelector("#popup-title"),n=e.querySelector("#popup-description");r.src=ImageManager.buildUrl(t.popupImage||t.image),s.textContent=t.title,n.textContent=t.popupDescription||t.description,this.updateBenefits(e,t),this.updateIncludes(e,t)},hide(){const e=document.getElementById("popup");e&&(e.style.display="none",Analytics.track("popup_close"))}};

// Controlador de Carrusel
const CarouselController={async init(){try{return await this.loadContent(),this.setupCarousel(),!0}catch(e){return ErrorHandler.handle(e,"CarouselController init"),!1}},async loadContent(){try{const e=await fetch("carrusel.html"),t=await e.text(),r=document.getElementById("carrusel-container");r&&(r.innerHTML=t)}catch(e){ErrorHandler.handle(e,"Loading carousel")}},setupCarousel(){const e=document.querySelectorAll(".carousel-item");e.length&&(this.showSlide(0),this.setupNavigation(e.length))}};

// Controlador UI 
const UIController={init(){this.setupResponsive(),this.setupAnimations()},setupResponsive(){window.addEventListener("resize",()=>{this.updateLayout()})},setupAnimations(){if("undefined"!=typeof gsap){const e={opacity:0,y:30,duration:.8,ease:"power2.out"};gsap.utils.toArray("section").forEach(t=>{gsap.from(t,{...e,scrollTrigger:{trigger:t,start:"top bottom-=100",toggleActions:"play none none reverse"}})})}}};

// Inicialización
document.addEventListener("DOMContentLoaded",async()=>{try{await ServicesController.init(),await CarouselController.init(),UIController.init(),PopupController.init(),AppState.initialized=!0,Analytics.track("app_init","success")}catch(e){ErrorHandler.handle(e,"App initialization")}});
