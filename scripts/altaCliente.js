document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("clienteForm");
    
    // 1. Forzar mayúsculas en tiempo real
    document.querySelectorAll('input[type="text"]').forEach(input => {
        input.addEventListener('input', () => {
            input.value = input.value.toUpperCase();
        });
    });

    // 2. Lógica del botón Limpiar
    document.getElementById("btnLimpiar").addEventListener("click", () => {
        if(confirm("¿Estás seguro de que deseas limpiar todos los campos?")) {
            form.reset();
        }
    });

    // 3. Lógica del botón Descargar PDF
    document.getElementById("btnDescargar").addEventListener("click", () => {
        const elemento = document.getElementById("form-to-print");
        const botonera = document.querySelector(".button-group");

        // Opciones de configuración del PDF
        const opciones = {
            margin: 10,
            filename: 'Alta_Cliente_Ricale.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        
        // Ocultar botones para que no salgan en el PDF
        botonera.style.visibility = "hidden";

        html2pdf().set(opciones).from(elemento).save().then(() => {
            botonera.style.visibility = "visible";
        });
    });

    // 4. Lógica del botón Enviar por Mail
    document.getElementById("btnEnviar").addEventListener("click", () => {
        if(form.checkValidity()) {
            const emailVendedor = document.getElementById("vendedor_email").value;
            const nombreVendedor = document.getElementById("vendedor_nombre").value;
            
            alert(`¡Hola ${nombreVendedor}!\n\nEl formulario se ha validado con éxito.\nSe enviaría un correo de confirmación a: ${emailVendedor}\nIncluyendo el archivo adjunto.`);
            
            // Aquí podrías usar Fetch API para enviar los datos a un servidor
        } else {
            alert("Por favor, completa todos los campos obligatorios (*) y adjunta la imagen.");
            form.reportValidity();
        }
    });
});