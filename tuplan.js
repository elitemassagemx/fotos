document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('plan-form');
    const steps = form.querySelectorAll('.form-step');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const submitBtn = document.getElementById('submit-btn');
    const formProgressBar = document.getElementById('formProgressBar');
    const headerProgressBar = document.getElementById('headerProgressBar');
    let currentStep = 0;

    function showStep(stepIndex) {
        steps.forEach((step, index) => {
            step.classList.toggle('active', index === stepIndex);
        });
        prevBtn.style.display = stepIndex === 0 ? 'none' : 'block';
        nextBtn.style.display = stepIndex === steps.length - 1 ? 'none' : 'block';
        submitBtn.style.display = stepIndex === steps.length - 1 ? 'block' : 'none';
        updateProgressBar();
    }

    function updateProgressBar() {
        const progress = ((currentStep + 1) / steps.length) * 100;
        formProgressBar.style.width = `${progress}%`;
        headerProgressBar.style.width = `${progress}%`;
    }

    function validateStep(stepIndex) {
        const currentStepElement = steps[stepIndex];
        const inputs = currentStepElement.querySelectorAll('input[required], select[required], textarea[required]');
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
        if (validateStep(currentStep)) {
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
        if (validateStep(currentStep)) {
            // Aquí puedes agregar el código para enviar el formulario
            console.log('Formulario enviado');
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

    // Inicializar el formulario mostrando el primer paso
    showStep(currentStep);
});
