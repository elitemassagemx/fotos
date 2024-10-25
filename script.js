// Configuración y estado global
const CONFIG={BASE_URL:"https://raw.githubusercontent.com/elitemassagemx/Home/main/IMG/",API_URL:"https://raw.githubusercontent.com/elitemassagemx/Home/main/data.json",WHATSAPP_NUMBER:"5215640020305"},AppState={services:{},currentCategory:"masajes",activeBenefit:"all",initialized:!1,loading:!1,error:null};const Logger={log:(e,t)=>{console.log(`[${e}]`,t)},error:(e,t)=>{console.error(`[${e}]`,t)}};

// Manejadores principales
const ServiceManager={async load(){try{const e=await fetch(CONFIG.API_URL),t=await e.json();return AppState.services=t.services,Logger.log("Services","Loaded successfully"),!0}catch(e){return Logger.error("ServiceLoader",e),!1}},createServiceElement(e){const t=document.querySelector("#service-template").content.cloneNode(!0);return t.querySelector(".service-icon").src=CONFIG.BASE_URL+e.icon,t.querySelector(".service-title").textContent=e.title,t.querySelector(".service-description").textContent=e.description,this.populateBenefits(t,e),t.querySelector(".duration-text").textContent=e.duration||"",t},populateBenefits(e,t){if(!t.benefits)return;const n=e.querySelector(".service-benefits");t.benefits.forEach((e,r)=>{const i=document.createElement("div");i.className="benefit-item",i.innerHTML=`<img src="${CONFIG.BASE_URL}${t.benefitsIcons[r]}" alt=""><span>${e}</span>`,n.appendChild(i)})}},UIManager={renderBenefitsNav(e){const t=document.querySelector(".benefits-nav");if(!t)return;const n=new Set,r=new Map;e.forEach(e=>{e.benefits?.forEach((t,n)=>{r.set(t,e.benefitsIcons[n])}),e.benefits?.forEach(e=>n.add(e))}),t.innerHTML=`
            <button class="benefit-btn active" data-filter="all">
                <img src="${CONFIG.BASE_URL}todos.webp" alt="Todos">
                <span>Todos</span>
            </button>
            ${[...n].map(e=>`
                <button class="benefit-btn" data-filter="${e.toLowerCase().replace(/\s+/g,"-")}">
                    <img src="${CONFIG.BASE_URL}${r.get(e)}" alt="${e}">
                    <span>${e}</span>
                </button>
            `).join("")}
        `,this.setupBenefitsFilter()},setupBenefitsFilter(){document.querySelectorAll(".benefit-btn").forEach(e=>{e.addEventListener("click",()=>{const t=e.dataset.filter;this.filterServices(t),document.querySelectorAll(".benefit-btn").forEach(e=>e.classList.remove("active")),e.classList.add("active")})})},filterServices(e){document.querySelectorAll(".service-item").forEach(t=>{const n="all"===e||[...t.querySelectorAll(".benefit-item span")].some(t=>t.textContent.toLowerCase()===e.replace(/-/g," ").toLowerCase());t.style.display=n?"block":"none"})}},PopupManager={show(e){const t=document.getElementById("popup");if(!t)return;const n=t.querySelector("#popup-image"),r=t.querySelector("#popup-title"),i=t.querySelector("#popup-description"),s=t.querySelector(".popup-benefits"),o=t.querySelector(".popup-includes"),a=t.querySelector("#popup-duration");n.src=CONFIG.BASE_URL+(e.popupImage||e.image),r.textContent=e.title,i.textContent=e.popupDescription||e.description,s.innerHTML=e.benefits?e.benefits.map((t,n)=>`
                <div class="popup-benefit-item">
                    <img src="${CONFIG.BASE_URL}${e.benefitsIcons[n]}" alt="">
                    <span>${t}</span>
                </div>
            `).join(""):"",o.innerHTML=e.includes?e.includes.map(e=>`
                <div class="popup-include-item">
                    <img src="${CONFIG.BASE_URL}check-icon.webp" alt="">
                    <span>${e}</span>
                </div>
            `).join(""):"",a.textContent=e.duration||"",t.style.display="block"},hide(){const e=document.getElementById("popup");e&&(e.style.display="none")}};

// Controlador principal
const ServicesController={async init(){try{return AppState.loading=!0,await ServiceManager.load()&&(this.setupEventListeners(),this.renderServices(),AppState.initialized=!0),AppState.loading=!1,!0}catch(e){return Logger.error("ServicesController",e),AppState.loading=!1,!1}},setupEventListeners(){document.querySelectorAll('.service-category-toggle input[type="radio"]').forEach(e=>{e.addEventListener("change",()=>{AppState.currentCategory=e.value,this.renderServices()})}),document.addEventListener("click",e=>{if(e.target.classList.contains("saber-mas-button")){const t=e.target.closest(".service-item");if(!t)return;const n=Array.from(t.parentNode.children).indexOf(t),r=AppState.services[AppState.currentCategory][n];PopupManager.show(r)}}),document.querySelector(".popup .close")?.addEventListener("click",()=>PopupManager.hide()),document.querySelector("#whatsapp-button")?.addEventListener("click",()=>{const e=document.querySelector("#popup-title")?.textContent;if(e){const t=`https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=Hola, me interesa el servicio: ${encodeURIComponent(e)}`;window.open(t,"_blank")}})},renderServices(){const e=document.getElementById("services-grid");if(!e)return;e.innerHTML="";const t=AppState.services[AppState.currentCategory];if(!Array.isArray(t))return void(e.innerHTML="<p>No se encontraron servicios disponibles</p>");const n=document.createDocumentFragment();t.forEach(e=>{const t=ServiceManager.createServiceElement(e);n.appendChild(t)}),e.appendChild(n),UIManager.renderBenefitsNav(t)}};

// Inicialización
document.addEventListener("DOMContentLoaded",async()=>{try{await ServicesController.init(),Logger.log("App","Initialized successfully")}catch(e){Logger.error("App",e)}});
