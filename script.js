const CONFIG={BASE_URL:"https://raw.githubusercontent.com/elitemassagemx/Home/main/IMG/",API_URL:"https://raw.githubusercontent.com/elitemassagemx/Home/main/data.json",WHATSAPP_NUMBER:"5215640020305"},App={state:{services:{},currentCategory:"masajes",initialized:!1},init:async function(){try{const e=await fetch(CONFIG.API_URL),t=await e.json();this.state.services=t.services,this.renderServices(),this.setupEventListeners(),this.state.initialized=!0}catch(e){console.error("Error initializing app:",e)}},renderServices:function(){const e=document.getElementById("services-grid");if(!e)return;e.innerHTML="";const t=this.state.services[this.state.currentCategory];if(!Array.isArray(t))return void(e.innerHTML="<p>No se encontraron servicios disponibles</p>");const n=document.createDocumentFragment();t.forEach(e=>{const t=this.createServiceElement(e);n.appendChild(t)}),e.appendChild(n),this.renderBenefitsNav(t)},createServiceElement:function(e){const t=document.querySelector("#service-template");if(!t)return document.createElement("div");const n=t.content.cloneNode(!0),r=n.querySelector(".service-icon");return r&&(r.src=`${CONFIG.BASE_URL}${e.icon}`,r.onerror=()=>{r.src=`${CONFIG.BASE_URL}default-icon.webp`}),n.querySelector(".service-title").textContent=e.title,n.querySelector(".service-description").textContent=e.description,this.populateBenefits(n,e),n.querySelector(".duration-text").textContent=e.duration||"",n},populateBenefits:function(e,t){if(!t.benefits)return;const n=e.querySelector(".service-benefits");n.innerHTML="",t.benefits.forEach((e,r)=>{const i=document.createElement("div");i.className="benefit-item";const s=document.createElement("img");s.src=`${CONFIG.BASE_URL}${t.benefitsIcons[r]}`,s.onerror=()=>{s.src=`${CONFIG.BASE_URL}default-icon.webp`},i.appendChild(s);const o=document.createElement("span");o.textContent=e,i.appendChild(o),n.appendChild(i)})},renderBenefitsNav:function(e){const t=document.querySelector(".benefits-nav");if(!t)return;const n=new Set,r=new Map;e.forEach(e=>{e.benefits?.forEach((t,n)=>{r.set(t,e.benefitsIcons[n])}),e.benefits?.forEach(e=>n.add(e))}),t.innerHTML=`
      <button class="benefit-btn active" data-filter="all">
        <img src="${CONFIG.BASE_URL}todos.webp" alt="Todos" onerror="this.src='${CONFIG.BASE_URL}default-icon.webp'">
        <span>Todos</span>
      </button>
      ${Array.from(n).map(e=>`
        <button class="benefit-btn" data-filter="${e.toLowerCase().replace(/\s+/g,"-")}">
          <img src="${CONFIG.BASE_URL}${r.get(e)}" alt="${e}" onerror="this.src='${CONFIG.BASE_URL}default-icon.webp'">
          <span>${e}</span>
        </button>
      `).join("")}`,this.setupBenefitsFilter()},setupBenefitsFilter:function(){document.querySelectorAll(".benefit-btn").forEach(e=>{e.addEventListener("click",()=>{const t=e.dataset.filter;this.filterServices(t),document.querySelectorAll(".benefit-btn").forEach(e=>e.classList.remove("active")),e.classList.add("active")})})},filterServices:function(e){document.querySelectorAll(".service-item").forEach(t=>{const n="all"===e||Array.from(t.querySelectorAll(".benefit-item span")).some(t=>t.textContent.toLowerCase()===e.replace(/-/g," ").toLowerCase());t.style.display=n?"block":"none"})},setupEventListeners:function(){document.querySelectorAll('.service-category-toggle input[type="radio"]').forEach(e=>{e.addEventListener("change",()=>{this.state.currentCategory=e.value,this.renderServices()})}),document.addEventListener("click",e=>{if(e.target.classList.contains("saber-mas-button")){const t=e.target.closest(".service-item");if(!t)return;const n=Array.from(t.parentNode.children).indexOf(t),r=this.state.services[this.state.currentCategory][n];this.showPopup(r)}}),document.querySelector(".popup .close")?.addEventListener("click",()=>this.hidePopup()),document.querySelector("#whatsapp-button")?.addEventListener("click",()=>{const e=document.querySelector("#popup-title")?.textContent;if(e){const t=`https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=Hola, me interesa el servicio: ${encodeURIComponent(e)}`;window.open(t,"_blank")}})},showPopup:function(e){const t=document.getElementById("popup");if(!t)return;const n=t.querySelector("#popup-image"),r=t.querySelector("#popup-title"),i=t.querySelector("#popup-description"),s=t.querySelector(".popup-benefits"),o=t.querySelector(".popup-includes"),a=t.querySelector("#popup-duration");n.src=`${CONFIG.BASE_URL}${e.popupImage||e.image}`,n.onerror=()=>{n.src=`${CONFIG.BASE_URL}default-popup.webp`},r.textContent=e.title,i.textContent=e.popupDescription||e.description,s.innerHTML=e.benefits?e.benefits.map((t,n)=>`
        <div class="popup-benefit-item">
          <img src="${CONFIG.BASE_URL}${e.benefitsIcons[n]}" alt="" onerror="this.src='${CONFIG.BASE_URL}default-icon.webp'">
          <span>${t}</span>
        </div>
      `).join(""):"",o.innerHTML=e.includes?e.includes.map(e=>`
        <div class="popup-include-item">
          <img src="${CONFIG.BASE_URL}check-icon.webp" alt="" onerror="this.src='${CONFIG.BASE_URL}default-icon.webp'">
          <span>${e}</span>
        </div>
      `).join(""):"",a.textContent=e.duration||"",t.style.display="block"},hidePopup:function(){const e=document.getElementById("popup");e&&(e.style.display="none")}};document.addEventListener("DOMContentLoaded",()=>App.init());
