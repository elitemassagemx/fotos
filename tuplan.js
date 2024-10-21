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
        if (formProgressBar) formProgressBar.style.width = `${progress}%`;
        if (headerProgressBar) headerProgressBar.style.width = `${progress}%`;
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

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (validateStep(steps[currentStep])) {
                currentStep++;
                showStep(currentStep);
            }
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            currentStep--;
            showStep(currentStep);
        });
    }

    if (submitBtn) {
        submitBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (validateStep(steps[currentStep])) {
                showFormPreview();
            }
        });
    }

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

    if (saveProgressBtn) {
        saveProgressBtn.addEventListener('click', saveProgress);
    }

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
            sendWhatsAppMessage();
            showThankYouMessage();
            previewModal.remove();
        });
    }

    function sendWhatsAppMessage() {
        const formData = new FormData(form);
        let message = "Hola! Me gustaría reservar una experiencia personalizada en Elite Massage:\n\n";

        // Mapeo de nombres de campos a etiquetas legibles
        const fieldLabels = {
            'tipo-evento': 'Tipo de evento',
            'numero-personas': 'Número de personas',
            'duracion': 'Duración',
            'enfoque-masaje': 'Enfoque del masaje',
            'obsequios': 'Obsequios',
            'decoracion-tematica': 'Decoración temática',
            'musica': 'Música/DJ',
            'catering': 'Catering',
            'ambiente': 'Ambiente',
            'nombre': 'Nombre',
            'telefono': 'Teléfono',
            'email': 'Email',
            'fecha': 'Fecha preferida'
        };

        for (let [key, value] of formData.entries()) {
            if (value) {
                const label = fieldLabels[key] || key;
                if (key === 'obsequios') {
                    // Para checkboxes, podemos tener múltiples valores
                    const obsequios = formData.getAll('obsequios');
                    message += `${label}: ${obsequios.join(', ')}\n`;
                } else if (key === 'decoracion-tematica' || key === 'musica' || key === 'catering') {
                    // Para toggles, convertimos a Sí/No
                    message += `${label}: ${value === 'on' ? 'Sí' : 'No'}\n`;
                } else {
                    message += `${label}: ${value}\n`;
                }
            }
        }

        const phoneNumber = '5215640020305'; // Número de WhatsApp de Elite Massage
        const encodedMessage = encodeURIComponent(message);
        const url = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
        window.open(url, '_blank');
    }

    // Inicializar
    showStep(currentStep);
});
