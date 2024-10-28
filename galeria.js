
const gallery = document.getElementById("gallery");
const lightbox = document.querySelector(".lightbox");
const lightboxImg = lightbox.querySelector("img");
const close = lightbox.querySelector(".lightbox-close");

// Array con las rutas de tus imágenes
const images = [
    "ruta/imagen1.jpg",
    "ruta/imagen2.jpg",
    // Añade aquí todas tus rutas de imágenes
];

// Crear elementos de la galería
images.forEach(src => {
    const item = document.createElement("div");
    item.className = "gallery-item";
    item.innerHTML = `<img src="${src}" alt="Galería">`;
    
    item.addEventListener("click", () => {
        lightboxImg.src = src;
        lightbox.classList.add("active");
    });
    
    gallery.appendChild(item);
});

// Cerrar lightbox
close.addEventListener("click", () => lightbox.classList.remove("active"));
lightbox.addEventListener("click", e => {
    if(e.target === lightbox) lightbox.classList.remove("active");
});
