document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('plan-form');
    const steps = Array.from(form.querySelectorAll('.form-step'));
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const submitBtn = document.getElementById('submit-btn');
    const formProgressBar = document.getElementById('formProgressBar');
    const headerProgressBar = document.getElementById('headerProgressBar');
    const saveProgressBtn = document.querySelector('.save-progress-btn');
    let currentStep = 0;

    function showStep(stepIndex) {
        steps.forEach((step, index) => {
            step.classList.toggle('active', index === stepIndex);
        });
        prevBtn.style.display = stepIndex === 0 ? 'none' : 'inline-block';
        nextBtn.style.display = stepIndex === steps.length - 1 ? 'none' : 'inline-block';
        submitBtn.style.display = stepIndex === steps.length - 1 ? 'inline-block' : 'none';
        updateProgressBar();
    }

    function updateProgressBar() {
        const progress = ((currentStep + 1) / steps.length) * 100;
        formProgressBar.style.width = `${progress}%`;
        headerProgressBar.style.width = `${progress}%`;
    }

    function validateStep(step) {
        const inputs = step.querySelectorAll('input[required], select[required], textarea[required]');
        let isValid = true;
        inputs.forEach(input => {
            if (!input.value.trim()) {
                isValid = false;
                input.classList.add('error');
                showErrorMessage(input, 'Este campo es requerido');
            } else {
                input.classList.remove('error');
                hideErrorMessage(input);
            }
        });
        return isValid;
    }

    function showErrorMessage(input, message) {
        let errorMessage = input.nextElementSibling;
        if (!errorMessage || !errorMessage.classList.contains('error-message')) {
            errorMessage = document.createElement('div');
            errorMessage.className = 'error-message';
            input.parentNode.insertBefore(errorMessage, input.nextSibling);
        }
        errorMessage.textContent = message;
    }

    function hideErrorMessage(input) {
        const errorMessage = input.nextElementSibling;
        if (errorMessage && errorMessage.classList.contains('error-message')) {
            errorMessage.remove();
        }
    }

    nextBtn.addEventListener('click', () => {
        if (validateStep(steps[currentStep])) {
            currentStep++;
            showStep(currentStep);
        }
    });

    prevBtn.addEventListener('click', () => {
        currentStep--;
        showStep(currentStep);
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (validateStep(steps[currentStep])) {
            const formData = new FormData(form);
            const data = Object.fromEntries(formData);
            console.log('Datos del formulario:', data);
            // Aquí puedes agregar la lógica para enviar los datos al servidor
            showThankYouMessage();
        }
    });

    function showThankYouMessage() {
        const thankYouMessage = document.createElement('div');
        thankYouMessage.className = 'thank-you-message';
        thankYouMessage.innerHTML = `
            <h3>¡Gracias por personalizar tu experiencia!</h3>
            <p>Nuestro equipo de expertos en bienestar revisará tu solicitud y te contactará pronto para finalizar los detalles de tu experiencia en Elite Massage.</p>
            <button class="close-message-btn">Cerrar</button>
        `;
        document.body.appendChild(thankYouMessage);

        const closeBtn = thankYouMessage.querySelector('.close-message-btn');
        closeBtn.addEventListener('click', () => {
            thankYouMessage.remove();
            form.reset();
            currentStep = 0;
            showStep(currentStep);
        });
    }

    saveProgressBtn.addEventListener('click', saveProgress);

    function saveProgress() {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        localStorage.setItem('eliteMassageProgress', JSON.stringify(data));
        alert('Tu progreso ha sido guardado. Puedes continuar más tarde.');
    }

    function loadProgress() {
        const savedProgress = localStorage.getItem('eliteMassageProgress');
        if (savedProgress) {
            const data = JSON.parse(savedProgress);
            Object.keys(data).forEach(key => {
                const input = form.querySelector(`[name="${key}"]`);
                if (input) {
                    if (input.type === 'checkbox' || input.type === 'radio') {
                        input.checked = input.value === data[key];
                    } else {
                        input.value = data[key];
                    }
                }
            });
            alert('Tu progreso ha sido cargado. Puedes continuar desde donde lo dejaste.');
        }
    }

    // Cargar progreso al iniciar
    loadProgress();

    // Manejar campos condicionales
    const otroTipoEvento = document.getElementById('otro-tipo-evento');
    const otroEnfoqueMasaje = document.getElementById('otro-enfoque-masaje');
    const temaDecoracion = document.getElementById('tema-decoracion');
    const tipoCatering = document.getElementById('tipo-catering');

    form.addEventListener('change', (e) => {
        if (e.target.name === 'tipo-evento') {
            otroTipoEvento.classList.toggle('hidden', e.target.value !== 'otro');
        }
        if (e.target.name === 'enfoque-masaje') {
            otroEnfoqueMasaje.classList.toggle('hidden', e.target.value !== 'otro');
        }
        if (e.target.name === 'decoracion-tematica') {
            temaDecoracion.classList.toggle('hidden', !e.target.checked);
        }
        if (e.target.name === 'catering') {
            tipoCatering.classList.toggle('hidden', !e.target.checked);
        }
    });

    // Añadir esta función al archivo JavaScript existente

function showFormPreview() {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    let previewContent = `
        <h3>Resumen de tu Experiencia Personalizada</h3>
        <ul>
    `;
    
    for (const [key, value] of Object.entries(data)) {
        if (value) {
            let label = form.querySelector(`label[for="${key}"]`)?.textContent || key;
            previewContent += `<li><strong>${label}:</strong> ${value}</li>`;
        }
    }
    
    previewContent += `
        </ul>
        <button id="edit-form" class="nav-btn">Editar</button>
        <button id="confirm-form" class="submit-btn">Confirmar y Enviar</button>
    `;
    
    const previewModal = document.createElement('div');
    previewModal.className = 'preview-modal';
    previewModal.innerHTML = previewContent;
    
    document.body.appendChild(previewModal);
    
    document.getElementById('edit-form').addEventListener('click', () => {
        previewModal.remove();
    });
    
    document.getElementById('confirm-form').addEventListener('click', () => {
        // Aquí iría la lógica para enviar el formulario
        showThankYouMessage();
        previewModal.remove();
    });
}

// Modificar el evento submit del formulario para mostrar la vista previa
form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (validateStep(steps[currentStep])) {
        showFormPreview();
    }
});

    // Inicializar
    showStep(currentStep);
});

