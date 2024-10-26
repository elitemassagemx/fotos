const CONFIG={BASE_URL:"https://raw.githubusercontent.com/elitemassagemx/Home/main/IMG/",API_URL:"https://raw.githubusercontent.com/elitemassagemx/Home/main/data.json",WHATSAPP_NUMBER:"5215640020305"},App={state:{services:{},currentCategory:"masajes",initialized:!1},init:async function(){try{const e=await fetch(CONFIG.API_URL);if(!e.ok)throw new Error(`HTTP error! status: ${e.status}`);const t=await e.json();this.state.services=t.services,this.renderServices(),this.setupEventListeners(),this.state.initialized=!0}catch(e){console.error("Error initializing app:",e)}},buildImageUrl:function(e){return e?e.startsWith("http")?e:`${CONFIG.BASE_URL}${e.startsWith("/")?e.slice(1):e}`:`${CONFIG.BASE_URL}default-icon.webp`},handleImageError:function(e){console.warn(`Failed to load image: ${e.src}`),e.src=`${CONFIG.BASE_URL}default-icon.webp`,e.onerror=null},renderServices:function(){const e=document.getElementById("services-grid");if(!e)return;e.innerHTML="";const t=this.state.services[this.state.currentCategory];if(!Array.isArray(t))return void(e.innerHTML="<p>No se encontraron servicios disponibles</p>");const n=document.createDocumentFragment();t.forEach(e=>{const t=this.createServiceElement(e);n.appendChild(t)}),e.appendChild(n),this.renderBenefitsNav(t)},createServiceElement:function(e){const t=document.querySelector("#service-template");if(!t)return document.createElement("div");const n=t.content.cloneNode(!0),r=n.querySelector(".service-icon");if(r){const t=this.buildImageUrl(e.icon);r.src=t,r.alt=e.title||"Service icon",r.onerror=()=>this.handleImageError(r)}const i=n.querySelector(".service-benefits");return i&&Array.isArray(e.benefits)&&Array.isArray(e.benefitsIcons)&&e.benefits.forEach((t,n)=>{const r=document.createElement("div");r.className="benefit-item";const s=document.createElement("img");s.src=this.buildImageUrl(e.benefitsIcons[n]),s.alt=t,s.className="benefit-icon",s.onerror=()=>this.handleImageError(s);const o=document.createElement("span");o.textContent=t,r.appendChild(s),r.appendChild(o),i.appendChild(r)}),n.querySelector(".service-title").textContent=e.title||"",n.querySelector(".service-description").textContent=e.description||"",n.querySelector(".duration-text").textContent=e.duration||"",n},renderBenefitsNav:function(e){const t=document.querySelector(".benefits-nav");if(!t)return;const n=new Set,r=new Map;e.forEach(e=>{e.benefits?.forEach((t,n)=>{r.set(t,e.benefitsIcons[n])}),e.benefits?.forEach(e=>n.add(e))}),t.innerHTML=`
      <button class="benefit-btn active" data-filter="all">
        <img src="${this.buildImageUrl('todos.webp')}" alt="Todos" onerror="this.handleImageError(this)">
        <span>Todos</span>
      </button>
      ${Array.from(n).map(e=>`
        <button class="benefit-btn" data-filter="${e.toLowerCase().replace(/\s+/g,"-")}">
          <img src="${this.buildImageUrl(r.get(e))}" alt="${e}" onerror="this.handleImageError(this)">
          <span>${e}</span>
        </button>
      `).join("")}`,this.setupBenefitsFilter()},setupBenefitsFilter:function(){document.querySelectorAll(".benefit-btn").forEach(e=>{e.addEventListener("click",()=>{const t=e.dataset.filter;this.filterServices(t),document.querySelectorAll(".benefit-btn").forEach(e=>e.classList.remove("active")),e.classList.add("active")})})},filterServices:function(e){document.querySelectorAll(".service-item").forEach(t=>{const n="all"===e||Array.from(t.querySelectorAll(".benefit-item span")).some(t=>t.textContent.toLowerCase()===e.replace(/-/g," ").toLowerCase());t.style.display=n?"block":"none"})},setupEventListeners:function(){document.querySelectorAll('.service-category-toggle input[type="radio"]').forEach(e=>{e.addEventListener("change",()=>{this.state.currentCategory=e.value,this.renderServices()})}),document.addEventListener("click",e=>{if(e.target.classList.contains("saber-mas-button")){const t=e.target.closest(".service-item");if(!t)return;const n=Array.from(t.parentNode.children).indexOf(t),r=this.state.services[this.state.currentCategory][n];this.showPopup(r)}}),document.querySelector(".popup .close")?.addEventListener("click",()=>this.hidePopup()),document.querySelector("#whatsapp-button")?.addEventListener("click",()=>{const e=document.querySelector("#popup-title")?.textContent;if(e){const t=`https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=Hola, me interesa el servicio: ${encodeURIComponent(e)}`;window.open(t,"_blank")}})}};document.addEventListener("DOMContentLoaded",()=>App.init());
