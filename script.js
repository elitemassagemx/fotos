// Configuración y estado
const CONFIG={BASE_URL:"https://raw.githubusercontent.com/elitemassagemx/Home/main/IMG/",API_URL:"https://raw.githubusercontent.com/elitemassagemx/Home/main/data.json",WHATSAPP_NUMBER:"5215640020305"},AppState={services:{},currentCategory:"masajes",activeBenefit:"all"};

// Controlador de Servicios Principal
const ServicesController={async init(){try{await this.loadServices(),this.setupCategories(),this.setupEventListeners(),this.renderServices("masajes")}catch(e){console.error("Error inicializando servicios:",e)}},async loadServices(){try{const e=await fetch(CONFIG.API_URL);if(!e.ok)throw new Error("Error cargando servicios");const r=await e.json();AppState.services=r.services,console.log("Servicios cargados:",AppState.services)}catch(e){console.error("Error cargando servicios:",e)}},setupCategories(){document.querySelectorAll('.service-category-toggle input[type="radio"]').forEach(e=>{e.addEventListener("change",()=>{const r=e.value;AppState.currentCategory=r,this.renderServices(r)})})},setupEventListeners(){document.addEventListener("click",e=>{if(e.target.classList.contains("saber-mas-button")){const r=e.target.closest(".service-item");if(!r)return;const t=Array.from(r.parentNode.children).indexOf(r),s=AppState.services[AppState.currentCategory][t];this.showServiceDetails(s)}})},renderServices(e){const r=document.getElementById("services-grid");if(!r)return;r.innerHTML="";const t=AppState.services[e];if(!Array.isArray(t))return void(r.innerHTML="<p>No se encontraron servicios</p>");const s=document.createDocumentFragment();t.forEach(e=>{const r=this.createServiceElement(e);s.appendChild(r)}),r.appendChild(s),this.renderBenefitsNav(t)},createServiceElement(e){const r=document.createElement("div");return r.className="service-item",r.innerHTML=`
            <div class="service-content">
                <div class="service-header">
                    <img src="${CONFIG.BASE_URL}${e.icon}" alt="" class="service-icon">
                    <h3 class="service-title">${e.title}</h3>
                </div>
                <p class="service-description">${e.description}</p>
                <div class="benefits-container">
                    ${e.benefits?e.benefits.map((r,t)=>`
                        <div class="benefit">
                            <img src="${CONFIG.BASE_URL}${e.benefitsIcons[t]}" alt="">
                            <span>${r}</span>
                        </div>
                    `).join(""):""}
                </div>
                <div class="duration-container">
                    <img src="${CONFIG.BASE_URL}duration-icon.webp" alt="" class="duration-icon">
                    <span>${e.duration||""}</span>
                </div>
                <button class="saber-mas-button">Saber más</button>
            </div>
        `,r},renderBenefitsNav(e){const r=document.querySelector(".benefits-nav");if(!r)return;const t=new Set,s=new Map;e.forEach(e=>{e.benefits&&e.benefits.forEach((r,n)=>{t.add(r),s.set(r,e.benefitsIcons[n])})}),r.innerHTML=`
            <button class="benefit-btn active" data-filter="all">
                <img src="${CONFIG.BASE_URL}todos.webp" alt="Todos">
                <span>Todos</span>
            </button>
            ${Array.from(t).map(e=>`
                <button class="benefit-btn" data-filter="${e.toLowerCase().replace(/\s+/g,"-")}">
                    <img src="${CONFIG.BASE_URL}${s.get(e)}" alt="${e}">
                    <span>${e}</span>
                </button>
            `).join("")}
        `,this.setupBenefitsFilter(r)},setupBenefitsFilter(e){e.querySelectorAll(".benefit-btn").forEach(e=>{e.addEventListener("click",()=>{const r=e.dataset.filter;this.filterByBenefit(r),e.parentElement.querySelectorAll(".benefit-btn").forEach(e=>e.classList.remove("active")),e.classList.add("active")})})},filterByBenefit(e){document.querySelectorAll(".service-item").forEach(r=>{const t="all"===e||r.textContent.toLowerCase().includes(e.toLowerCase());r.style.display=t?"block":"none"})},showServiceDetails(e){const r=document.getElementById("popup");r&&(r.querySelector("#popup-image").src=CONFIG.BASE_URL+(e.popupImage||e.image),r.querySelector("#popup-title").textContent=e.title,r.querySelector("#popup-description").textContent=e.popupDescription||e.description,this.updatePopupBenefits(r,e),r.style.display="block")}};

// Inicialización
document.addEventListener("DOMContentLoaded",()=>{ServicesController.init()});
