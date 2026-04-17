const trf_charge = 0.012, tc_charge = 0.072, rg_4815 = 0.05;
let datosUltimaCoti = {};

// Función para formatear moneda de las salidas
function formatCurrency(valor, moneda = "ARS") {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: moneda,
    }).format(valor);
}

//Dar formato de 2 decimales a todos los input[type="number"]
const inputsDecimales = document.querySelectorAll('.formato-decimal');
inputsDecimales.forEach(input => {
    input.addEventListener('blur', function() {
        let valor = parseFloat(this.value);
        if (!isNaN(valor)) {
            this.value = valor.toFixed(2);
        }
    });
});



function calcular() {
    const d = {
        dest: document.getElementById('srv_dest').value,
        pCurr: document.getElementById('pay_curr').value,
        pTipe: document.getElementById('pay_tipe').value,
        fCurr: document.getElementById('flyred_curr').value,
        fare: parseFloat(document.getElementById('flyred_fare').value),
        tax:  parseFloat(document.getElementById('flyred_tax').value),
        ifee: parseFloat(document.getElementById('flyred_issuefee').value) || 0,
        comi: parseFloat(document.getElementById('flyred_comi').value) || 0,
        over: parseFloat(document.getElementById('flyred_over').value) || 0,
        sfee: parseFloat(document.getElementById('srv_fee').value) || 0,
        cli: document.getElementById('client_info').value,
        cuit: document.getElementById('client_cuit').value,
        pnr: document.getElementById('client_pnr').value
    };
    
    const cost = d.fare + d.tax + d.ifee;
    const revn = d.comi + d.over;
    const val_prod = cost + d.sfee;
    const rent_final = revn + (d.sfee / 1.21);

    // Validaciones
    if (!d.dest || !d.pCurr || !d.pTipe || !d.fCurr || !cost ) { swal("Datos Incompletos","Complete todos los campos.", "warning"); return; }
    if (d.dest === "cabotaje" && d.pCurr === "Dólares") { swal("Error", "No es posible emitir Cabotaje en Dólares.", "error"); return; }
    if (d.pCurr !== d.fCurr) { swal("Ooops!","La moneda de cotización no coincide con la moneda de pago.", "error"); return; }
    if (d.fare<0 || d.tax<0 || d.ifee<0 || d.comi<0 || d.over<0 || d.sfee<0) {swal("Psst. Por favor,","Verificá que todos los valores deben ser mayores o igual a cero","warning"); return;}
    if (d.pCurr === "Dólares" && d.pTipe ==="Tarjeta de Crédito") { swal("Forma de Pago Inválida", "Por regulaciones del BCRA no se pueden procesar pagos en Dólares con Tarjeta de Crédito para el mercado Argentino por el momento.", "info"); return; }

            let sale_info = 0;
            let uatp = 0;
            let posnet = 0;
            if (d.pTipe === "Transferencia") sale_info = val_prod / (1 - trf_charge);
            else if (d.pTipe === "Depósito" && d.dest === "internacional") {
                let val_rg = d.fare * rg_4815;
                sale_info = (val_prod + val_rg) / (1 - trf_charge);
            } else if (d.pTipe === "Tarjeta de Crédito") {
                uatp = d.fare + d.tax;
                posnet = (d.ifee + d.sfee) / (1 - tc_charge);
                sale_info = uatp + posnet;
                swal("split de pagos",`Importe UATP: $${uatp.toFixed(2)} - Importe POSNET: $${posnet.toFixed(2)}`,"success");
            } else sale_info = val_prod;

    const gastos = sale_info - val_prod;

    // Actualizar UI
    document.getElementById('out_cost').innerText = formatCurrency(cost, "ARS");
    document.getElementById('out_revn').innerText = formatCurrency(revn, "ARS");
    document.getElementById('out_val_prod').innerText = formatCurrency(val_prod, "ARS");
    document.getElementById('out_pTipe').innerText = d.pTipe;
    document.getElementById('out_gastos').innerText = formatCurrency(gastos, "ARS");
    document.getElementById('out_sale_info').innerText = formatCurrency(sale_info, "ARS");
    document.getElementById('out_rent_final').innerText = formatCurrency(rent_final, "ARS");
    
    datosUltimaCoti = {...d, cost, revn, sale_info, rent_final, gastos, val_prod, uatp, posnet};

    if (!rent_final) {swal("Por favor, Verifica los Datos", "Esta cotización no registra rentabilidad", "warning" );return;}
}


function descargarPDF() { 
    if (!datosUltimaCoti.sale_info) { swal("Ooops","Para descargar el PDF primero debes realizar una cotización.","warning" ); return; }
    
    const content = `
        <h3 style="color: #BB1010">Cotización FlyRED - ${datosUltimaCoti.pnr}</h3>
        <hr>
        <h4>Datos del Cliente</h4>
        <p>ID_Cliente: ${datosUltimaCoti.cli} - CUIT: ${datosUltimaCoti.cuit}</p>
        <hr>
        <h4>Detalle de la cotización</h4>
        <p>Moneda de Pago: ${datosUltimaCoti.pCurr}</p>
        <p>Forma de Pago: ${datosUltimaCoti.pTipe}</p>
        <p>Tarifa: ${datosUltimaCoti.fare.toFixed(2)} </p>    
        <p>Impuestos: ${datosUltimaCoti.tax.toFixed(2)}</p>
        <p>Fee Ricale: ${datosUltimaCoti.ifee.toFixed(2)}</p>
        <p>Fee Adicional Promotor: ${datosUltimaCoti.sfee.toFixed(2)}</p>
        <p>Gastos por ${datosUltimaCoti.pTipe}:  ${datosUltimaCoti.gastos.toFixed(2)}</p>
        <hr>
        <h3 style="color: #BB1010">Importe Final a Facturar al Cliente: ${datosUltimaCoti.pCurr} ${datosUltimaCoti.sale_info.toFixed(2)} </h3>
        <h3 style="color: #BB1010">Rentabilidad Total a Cobrar Neta de Impuestos: ${datosUltimaCoti.pCurr} ${datosUltimaCoti.rent_final.toFixed(2)} </h3>
        <hr>
    `;
    
    const element = document.getElementById('resumen-pdf');
    document.getElementById('pdf-content').innerHTML = content;
    element.style.display = 'block';
    
    html2pdf().from(element).set({
        margin: 1,
        filename: `Cotización ${datosUltimaCoti.pnr || 'FlyRED'}.pdf`,
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    }).save().then(() => { element.style.display = 'none'; });  
}

function enviarEmail() { 
    if (!datosUltimaCoti.sale_info) { swal("Ooops","Para enviar el mail primero debes realizar una cotización.","warning" ); return; }
    
    const asunto = encodeURIComponent(`Cotización FlyRED - Reserva ${datosUltimaCoti.pnr}`);
    const cuerpo = encodeURIComponent(
        `Hola,\nEnvio detalles de la cotización Aérea:\n` +
        `- Reserva / Localizador: ${datosUltimaCoti.pnr}\n` +
        `- ID_Cliente: ${datosUltimaCoti.cli} - CUIT: ${datosUltimaCoti.cuit}\n` +
        `-----------------------------------------------------------------------------\n` +
        `- Forma de Pago: ${datosUltimaCoti.pTipe}\n` +
        `- Moneda: ${datosUltimaCoti.pCurr}\n` +
        `- Tarifa: ${datosUltimaCoti.fare.toFixed(2)}\n` +    
        `- Impuestos: ${datosUltimaCoti.tax.toFixed(2)}\n` +
        `- Fee Ricale: ${datosUltimaCoti.ifee.toFixed(2)}\n` +
        `- Fee Adicional Promotor: ${datosUltimaCoti.sfee.toFixed(2)}\n` +
        `- Gastos por Forma de Pago [${datosUltimaCoti.pTipe}]: ${datosUltimaCoti.gastos.toFixed(2)}\n` +
        `-----------------------------------------------------------------------------\n` +
        `- Importe Final a Facturar al Cliente: ${datosUltimaCoti.pCurr} ${datosUltimaCoti.sale_info.toFixed(2)}\n` +
        `- Rentabilidad Total a Cobrar Neta de Impuestos: ${datosUltimaCoti.pCurr} ${datosUltimaCoti.rent_final.toFixed(2)}\n` + 
        `-----------------------------------------------------------------------------\n` +
        `-   \n` +
        `-\nSaludos.`
    );
    
    window.location.href = `mailto:?subject=${asunto}&body=${cuerpo}`;

}
function limpiar() { location.reload(); }