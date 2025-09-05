/* ==========================================================================
   INICIO DASHBOARD — SUBASTA VEHICULAR
   Archivo: inicio.js
   Descripción:
     - Manejo de UI (sidebar, toggles, hints)
     - Lógica de moneda base (PEN/USD) y monedas de bloques (Papeletas, Gastos)
     - Cálculo detallado: costo referencial, papeletas, gastos, totales, ahorro
     - Conversión limpia (sumas en moneda del bloque → conversión a base)
     - PDF profesional con jsPDF + autotable:
         * Cabecera con marca, fecha, moneda base
         * Tabla de resultados (resumen y detalle insumos)
         * Pie de página branding
     - Acciones de demo y reset
   Notas:
     - Sin gráficos, como solicitaste.
     - Sin animaciones “girando”.
     - Botón de PDF totalmente funcional.
   ========================================================================== */

/* ------------------------------- Estado ---------------------------------- */
const state = {
  base: 'PEN',          // Moneda base global: 'PEN' o 'USD'
  fxDir: 'USD2PEN',     // Dirección actual del tipo de cambio (USD→PEN o PEN→USD)
  fx: 3.8000,           // Tipo de cambio numérico
  papeletasMon: 'PEN',  // Moneda local usada para sumar papeletas
  gastosMon: 'PEN',     // Moneda local usada para sumar gastos
};

/* --------------------------- Helpers Moneda ------------------------------ */
/**
 * Devuelve símbolo para moneda
 */
function sym(c){ return c === 'USD' ? '$' : 'S/'; }

/**
 * Convierte un monto desde "from" a "to" usando state.fx y state.fxDir
 * - fxDir "USD2PEN": fx = cuántos PEN por 1 USD
 * - fxDir "PEN2USD": fx = cuántos USD por 1 PEN
 */
function convert(amount, from, to){
  if(from === to) return amount;
  const f = state.fx;
  if(state.fxDir === 'USD2PEN'){
    // 1 USD = fx PEN
    if(from === 'USD' && to === 'PEN') return amount * f;
    if(from === 'PEN' && to === 'USD') return amount / f;
  }else{
    // 1 PEN = fx USD
    if(from === 'PEN' && to === 'USD') return amount * f;
    if(from === 'USD' && to === 'PEN') return amount / f;
  }
  return amount;
}

/* ------------------------------ DOM refs --------------------------------- */
const $ = sel => document.querySelector(sel);

// Header toggles
const chipPen = $('#chipPen');
const chipUsd = $('#chipUsd');
const fxInput = $('#tipoCambio');
const fxPrefix = $('.fx-prefix');
const fxHelp   = $('#fxDirection');
const btnSwap  = $('#btnSwapFX');
const badgeBase= $('#badgeMonedaBase');
const btnExportPdf = $('#btnExportPdf');
const btnToggleSidebar = $('#btnToggleSidebar');

// Sidebar
const appSidebar = $('#appSidebar');

// Form fields datos vehículo
const prefPresupuesto = $('#prefPresupuesto');
const prefBase = $('#prefBase');
const prefMercado = $('#prefMercado');
const presupuestoCliente = $('#presupuestoCliente');
const precioBase = $('#precioBase');
const comisionPct = $('#comisionPct');
const precioActual = $('#precioActual');

// Papeletas
const papBtns = { pen: $('#papMonPen'), usd: $('#papMonUsd') };
const papInputs = {
  ATU: $('#papATU'),
  Callao: $('#papCallao'),
  Gas: $('#papGas'),
  Gravamen: $('#papGravamen'),
  Impuesto: $('#papImpuesto'),
  Otros: $('#papOtros'),
  SAT: $('#papSAT'),
  SUTRAN: $('#papSUTRAN'),
};
const prefPap = {
  ATU: $('#prefPapATU'),
  Callao: $('#prefPapCallao'),
  Gas: $('#prefPapGas'),
  Gravamen: $('#prefPapGravamen'),
  Impuesto: $('#prefPapImpuesto'),
  Otros: $('#prefPapOtros'),
  SAT: $('#prefPapSAT'),
  SUTRAN: $('#prefPapSUTRAN'),
};

// Gastos
const gasBtns = { pen: $('#gasMonPen'), usd: $('#gasMonUsd') };
const gasInputs = {
  Combustible: $('#gasCombustible'),
  Estancia:    $('#gasEstancia'),
  Lavado:      $('#gasLavado'),
  Notaria:     $('#gasNotaria'),
  Grua:        $('#gasGrua'),
  Mecanico:    $('#gasMecanico'),
  Chapero:     $('#gasChapero'),
  Placa:       $('#gasPlaca'),
  Ciguena:     $('#gasCiguena'),
};
const prefGas = {
  Combustible: $('#prefGasComb'),
  Estancia:    $('#prefGasEst'),
  Lavado:      $('#prefGasLav'),
  Notaria:     $('#prefGasNot'),
  Grua:        $('#prefGasGrua'),
  Mecanico:    $('#prefGasMec'),
  Chapero:     $('#prefGasChap'),
  Placa:       $('#prefGasPlaca'),
  Ciguena:     $('#prefGasCig'),
};

// Resumen
const sumCostoVeh = $('#sumCostoVeh');
const sumPapeletas= $('#sumPapeletas');
const sumGastos   = $('#sumGastos');
const sumTotal    = $('#sumTotal');
const sumAlt      = $('#sumAlt');
const sumAhorro   = $('#sumAhorro');
const sumDiferencia = $('#sumDiferencia');
const btnCalcular = $('#btnCalcular');
const btnLlenarDemo = $('#btnLlenarDemo');
const btnResetForm = $('#btnResetForm');

// PDF capture refs
const pdfMonedaBase = $('#pdfMonedaBase');
const pdfFecha = $('#pdfFecha');

/* ----------------------------- UI Updates ------------------------------- */
function updateBaseCurrencyUI(){
  // Chips
  if(state.base === 'PEN'){
    chipPen.classList.add('active');
    chipUsd.classList.remove('active');
    chipPen.setAttribute('aria-pressed','true');
    chipUsd.setAttribute('aria-pressed','false');
  }else{
    chipUsd.classList.add('active');
    chipPen.classList.remove('active');
    chipUsd.setAttribute('aria-pressed','true');
    chipPen.setAttribute('aria-pressed','false');
  }

  // Prefix de inputs principales
  prefPresupuesto.textContent = sym(state.base);
  prefBase.textContent = sym(state.base);
  prefMercado.textContent = sym(state.base);

  // Badges y ayudas
  badgeBase.textContent = `Moneda Base: ${state.base === 'PEN' ? 'S/ PEN' : '$ USD'}`;
  pdfMonedaBase.textContent = `Moneda base: ${state.base === 'PEN' ? 'S/ PEN' : '$ USD'}`;
  fxHelp.textContent = `Convirtiendo a moneda base: ${state.base === 'PEN' ? 'S/ PEN' : '$ USD'}`;

  // Dirección visual de fxPrefix
  fxPrefix.textContent = state.fxDir === 'USD2PEN' ? 'USD → PEN' : 'PEN → USD';

  // Papeletas y Gastos: prefijos del bloque (se mantienen según moneda del bloque)
  const pSym = sym(state.papeletasMon);
  Object.values(prefPap).forEach(el => el.textContent = pSym);

  const gSym = sym(state.gastosMon);
  Object.values(prefGas).forEach(el => el.textContent = gSym);
}

/* ----------------------- Manejo de Monedas Bloque ----------------------- */
function setPapeletasMon(c){
  state.papeletasMon = c;
  const s = sym(c);
  papBtns.pen.classList.toggle('active', c==='PEN');
  papBtns.usd.classList.toggle('active', c==='USD');
  papBtns.pen.setAttribute('aria-pressed', c==='PEN'?'true':'false');
  papBtns.usd.setAttribute('aria-pressed', c==='USD'?'true':'false');
  Object.values(prefPap).forEach(el => el.textContent = s);
}
function setGastosMon(c){
  state.gastosMon = c;
  const s = sym(c);
  gasBtns.pen.classList.toggle('active', c==='PEN');
  gasBtns.usd.classList.toggle('active', c==='USD');
  gasBtns.pen.setAttribute('aria-pressed', c==='PEN'?'true':'false');
  gasBtns.usd.setAttribute('aria-pressed', c==='USD'?'true':'false');
  Object.values(prefGas).forEach(el => el.textContent = s);
}

/* --------------------------- Eventos Header ----------------------------- */
chipPen.addEventListener('click', () => {
  state.base = 'PEN';
  updateBaseCurrencyUI();
  calcular();
});
chipUsd.addEventListener('click', () => {
  state.base = 'USD';
  updateBaseCurrencyUI();
  calcular();
});

fxInput.addEventListener('input', () => {
  const v = parseFloat(fxInput.value);
  if(!isNaN(v) && v>0){
    state.fx = v;
    calcular();
  }
});

btnSwap.addEventListener('click', () => {
  state.fxDir = state.fxDir === 'USD2PEN' ? 'PEN2USD' : 'USD2PEN';
  // Mantener el valor numérico (significa otra interpretación)
  updateBaseCurrencyUI();
  calcular();
});

btnToggleSidebar.addEventListener('click', () => {
  appSidebar.classList.toggle('collapsed');
});

/* --------------------------- Eventos Paneles ---------------------------- */
papBtns.pen.addEventListener('click', ()=>{ setPapeletasMon('PEN'); calcular(); });
papBtns.usd.addEventListener('click', ()=>{ setPapeletasMon('USD'); calcular(); });
gasBtns.pen.addEventListener('click', ()=>{ setGastosMon('PEN'); calcular(); });
gasBtns.usd.addEventListener('click', ()=>{ setGastosMon('USD'); calcular(); });

/* ----------------------------- Cálculo Core ----------------------------- */
function numeric(input){
  const n = parseFloat(input.value);
  return isNaN(n)?0:n;
}

function sumObjectInputs(obj){
  return Object.values(obj).reduce((acc, el)=>acc + numeric(el), 0);
}

function calcular(){
  // Datos Vehículo (en moneda base)
  const base = state.base;

  const presupuesto = numeric(presupuestoCliente);
  const valorAdjudicado = numeric(precioBase);
  const pctComision = numeric(comisionPct);
  const precioMercado = numeric(precioActual);

  const comisionGestion = (valorAdjudicado * pctComision) / 100;
  const costoReferencial = valorAdjudicado + comisionGestion;

  // Papeletas: sumar en su moneda y convertir a base
  const sumaPapLocal = sumObjectInputs(papInputs);
  const sumaPapBase = convert(sumaPapLocal, state.papeletasMon, base);

  // Gastos: sumar en su moneda y convertir a base
  const sumaGasLocal = sumObjectInputs(gasInputs);
  const sumaGasBase = convert(sumaGasLocal, state.gastosMon, base);

  // Total
  const total = costoReferencial + sumaPapBase + sumaGasBase;

  // Moneda secundaria y conversiones de muestra
  const alt = base === 'PEN' ? 'USD' : 'PEN';
  const totalAlt = convert(total, base, alt);

  // Ahorro vs. mercado en base
  const ahorro = precioMercado > 0 ? (precioMercado - total) : 0;

  // Diferencia con presupuesto en base
  const diferencia = presupuesto - total;

  // Pintar UI
  sumCostoVeh.textContent = `${sym(base)} ${costoReferencial.toFixed(2)}`;
  sumPapeletas.textContent = `${sym(base)} ${sumaPapBase.toFixed(2)}`;
  sumGastos.textContent = `${sym(base)} ${sumaGasBase.toFixed(2)}`;
  sumTotal.textContent = `${sym(base)} ${total.toFixed(2)}`;
  sumAlt.textContent = `${sym(alt)} ${totalAlt.toFixed(2)}`;

  // Color por signo
  sumAhorro.textContent = `${sym(base)} ${ahorro.toFixed(2)}`;
  sumAhorro.classList.toggle('success', ahorro>=0);
  sumAhorro.classList.toggle('danger', ahorro<0);

  sumDiferencia.textContent = `${sym(base)} ${diferencia.toFixed(2)}`;
  sumDiferencia.classList.toggle('success', diferencia>=0);
  sumDiferencia.classList.toggle('danger', diferencia<0);

  // Fecha PDF
  pdfFecha.textContent = new Date().toLocaleString();
}

/* ------------------------- Acciones auxiliares -------------------------- */
btnCalcular.addEventListener('click', calcular);

btnLlenarDemo.addEventListener('click', () => {
  presupuestoCliente.value = 19000;
  precioBase.value = 14500;
  comisionPct.value = 10;
  precioActual.value = 22000;

  // Papeletas (en la moneda elegida para el bloque)
  papInputs.ATU.value = 120;
  papInputs.Callao.value = 0;
  papInputs.Gas.value = 0;
  papInputs.Gravamen.value = 350;
  papInputs.Impuesto.value = 0;
  papInputs.Otros.value = 0;
  papInputs.SAT.value = 600;
  papInputs.SUTRAN.value = 300;

  // Gastos
  gasInputs.Combustible.value = 100;
  gasInputs.Estancia.value = 0;
  gasInputs.Lavado.value = 50;
  gasInputs.Notaria.value = 400;
  gasInputs.Grua.value = 0;
  gasInputs.Mecanico.value = 0;
  gasInputs.Chapero.value = 0;
  gasInputs.Placa.value = 270;
  gasInputs.Ciguena.value = 0;

  calcular();
});

btnResetForm.addEventListener('click', ()=>{
  // Datos
  presupuestoCliente.value = '';
  precioBase.value = '';
  comisionPct.value = '';
  precioActual.value = '';

  // Papeletas
  Object.values(papInputs).forEach(i=>i.value='');
  // Gastos
  Object.values(gasInputs).forEach(i=>i.value='');

  calcular();
});

/* ------------------------------ PDF ------------------------------------- */
btnExportPdf.addEventListener('click', async () => {
  await exportarPDFProfesional();
});

/**
 * Genera un PDF profesional con:
 * - Portada (logo y título)
 * - Tabla de resumen de resultados
 * - Tabla de insumos (papeletas y gastos, mostrando su moneda original y la conversión)
 * - Pie de página con branding
 */
async function exportarPDFProfesional(){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit:'pt', format:'a4' }); // 595 x 842 approx
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const margin = 40;
  let y = margin;

  // 0) Recoger cálculos actuales (asegurar consistencia)
  calcular();

  const base = state.base;
  const alt = base === 'PEN' ? 'USD' : 'PEN';

  // Datos vehiculo
  const presupuesto = parseFloat(presupuestoCliente.value)||0;
  const valorAdjudicado = parseFloat(precioBase.value)||0;
  const pctComision = parseFloat(comisionPct.value)||0;
  const precioMercado = parseFloat(precioActual.value)||0;
  const comisionGestion = (valorAdjudicado*pctComision)/100;
  const costoReferencial = valorAdjudicado + comisionGestion;

  // Papeletas
  const papList = [
    ['ATU', parseFloat(papInputs.ATU.value)||0],
    ['Callao', parseFloat(papInputs.Callao.value)||0],
    ['Gas Natural', parseFloat(papInputs.Gas.value)||0],
    ['Gravamen', parseFloat(papInputs.Gravamen.value)||0],
    ['Impuestos Vehiculares', parseFloat(papInputs.Impuesto.value)||0],
    ['Otros', parseFloat(papInputs.Otros.value)||0],
    ['SAT', parseFloat(papInputs.SAT.value)||0],
    ['SUTRAN', parseFloat(papInputs.SUTRAN.value)||0],
  ];
  const sumaPapLocal = papList.reduce((a, [,v])=>a+v,0);
  const sumaPapBase = convert(sumaPapLocal, state.papeletasMon, base);

  // Gastos
  const gasList = [
    ['Combustible', parseFloat(gasInputs.Combustible.value)||0],
    ['Estancia/Almacenaje', parseFloat(gasInputs.Estancia.value)||0],
    ['Lavado y Detallado', parseFloat(gasInputs.Lavado.value)||0],
    ['Notaría', parseFloat(gasInputs.Notaria.value)||0],
    ['Servicio de Grúa', parseFloat(gasInputs.Grua.value)||0],
    ['Servicio Mecánico', parseFloat(gasInputs.Mecanico.value)||0],
    ['Trabajo de Chapería', parseFloat(gasInputs.Chapero.value)||0],
    ['Trámite de Placa/Tarjeta', parseFloat(gasInputs.Placa.value)||0],
    ['Traslado en Cigüeña', parseFloat(gasInputs.Ciguena.value)||0],
  ];
  const sumaGasLocal = gasList.reduce((a, [,v])=>a+v,0);
  const sumaGasBase = convert(sumaGasLocal, state.gastosMon, base);

  // Totales
  const total = costoReferencial + sumaPapBase + sumaGasBase;
  const totalAlt = convert(total, base, alt);
  const ahorro = precioMercado - total;
  const diferencia = presupuesto - total;

  // 1) Cabecera con branding
  // Fondo gradiente simple (rectángulo de color)
  doc.setFillColor(124,58,237); // morado base
  doc.roundedRect(0,0,pw,90,0,0,'F');

  // Título y subtítulo blancos
  doc.setFont('helvetica','bold');
  doc.setTextColor(255,255,255);
  doc.setFontSize(20);
  doc.text('Subasta Vehicular — Resumen Financiero', margin, 50);
  doc.setFont('helvetica','normal');
  doc.setFontSize(11);
  doc.text(`Moneda base: ${base==='PEN'?'S/ PEN':'$ USD'}  •  Tipo de Cambio: ${state.fxDir==='USD2PEN'?'USD→PEN':'PEN→USD'} = ${state.fx}`, margin, 70);

  y = 110;

  // 2) Tabla Resumen Resultados (autotable)
  doc.setTextColor(20,20,30);
  doc.setFont('helvetica','bold');
  doc.setFontSize(14);
  doc.text('Resumen de Resultados', margin, y);
  y += 10;

  const resumenRows = [
    ['Presupuesto del Comprador', `${sym(base)} ${presupuesto.toFixed(2)}`],
    ['Valor Adjudicado en Subasta', `${sym(base)} ${valorAdjudicado.toFixed(2)}`],
    ['Comisión por Gestión (%)', `${pctComision.toFixed(2)} %`],
    ['Comisión por Gestión (monto)', `${sym(base)} ${comisionGestion.toFixed(2)}`],
    ['Costo Referencial del Vehículo', `${sym(base)} ${costoReferencial.toFixed(2)}`],
    ['Papeletas (convertidas a base)', `${sym(base)} ${sumaPapBase.toFixed(2)}`],
    ['Gastos Adicionales (convertidos)', `${sym(base)} ${sumaGasBase.toFixed(2)}`],
    ['Total a Pagar', `${sym(base)} ${total.toFixed(2)}`],
    [`Total en ${alt==='PEN'?'S/ PEN':'$ USD'}`, `${sym(alt)} ${totalAlt.toFixed(2)}`],
    ['Ahorro vs. Precio de Mercado', `${sym(base)} ${ahorro.toFixed(2)}`],
    ['Diferencia con Presupuesto', `${sym(base)} ${diferencia.toFixed(2)}`],
  ];

  doc.autoTable({
    startY: y + 8,
    head: [['Concepto', 'Valor']],
    body: resumenRows,
    styles: { font:'helvetica', fontSize: 10, cellPadding: 6 },
    headStyles: { fillColor:[124,58,237], textColor:255 },
    alternateRowStyles: { fillColor:[245,245,255] },
    theme: 'grid',
    margin: { left: margin, right: margin },
    columnStyles: { 0:{cellWidth: 280}, 1:{cellWidth:'auto', halign:'right'} }
  });

  y = doc.lastAutoTable.finalY + 18;

  // 3) Detalle de Insumos — Papeletas
  doc.setFont('helvetica','bold');
  doc.setFontSize(13);
  doc.setTextColor(30,30,40);
  doc.text('Detalle de Papeletas y Obligaciones', margin, y);
  y += 6;
  doc.setFont('helvetica','normal'); doc.setFontSize(10);
  doc.setTextColor(90,90,110);
  doc.text(`Moneda del bloque: ${state.papeletasMon==='PEN'?'S/ PEN':'$ USD'} — Se convierten a moneda base: ${base==='PEN'?'S/ PEN':'$ USD'}`, margin, y);
  y += 8;

  const papBody = papList.map(([k,v]) => [
    k,
    `${sym(state.papeletasMon)} ${v.toFixed(2)}`,
    `${sym(base)} ${convert(v, state.papeletasMon, base).toFixed(2)}`
  ]);
  papBody.push(['TOTAL', `${sym(state.papeletasMon)} ${sumaPapLocal.toFixed(2)}`, `${sym(base)} ${sumaPapBase.toFixed(2)}`]);

  doc.autoTable({
    startY: y + 6,
    head: [['Concepto', `Monto (${state.papeletasMon})`, `Convertido (${base})`]],
    body: papBody,
    styles: { font:'helvetica', fontSize: 10, cellPadding: 6 },
    headStyles: { fillColor:[99,102,241], textColor:255 },
    alternateRowStyles: { fillColor:[245,248,255] },
    theme: 'grid',
    margin: { left: margin, right: margin },
    columnStyles: { 0:{cellWidth: 220}, 1:{halign:'right'}, 2:{halign:'right'} }
  });

  y = doc.lastAutoTable.finalY + 18;

  // 4) Detalle de Insumos — Gastos
  doc.setFont('helvetica','bold');
  doc.setFontSize(13);
  doc.setTextColor(30,30,40);
  doc.text('Detalle de Gastos Adicionales', margin, y);
  y += 6;
  doc.setFont('helvetica','normal'); doc.setFontSize(10);
  doc.setTextColor(90,90,110);
  doc.text(`Moneda del bloque: ${state.gastosMon==='PEN'?'S/ PEN':'$ USD'} — Se convierten a moneda base: ${base==='PEN'?'S/ PEN':'$ USD'}`, margin, y);
  y += 8;

  const gasBody = gasList.map(([k,v]) => [
    k,
    `${sym(state.gastosMon)} ${v.toFixed(2)}`,
    `${sym(base)} ${convert(v, state.gastosMon, base).toFixed(2)}`
  ]);
  gasBody.push(['TOTAL', `${sym(state.gastosMon)} ${sumaGasLocal.toFixed(2)}`, `${sym(base)} ${sumaGasBase.toFixed(2)}`]);

  doc.autoTable({
    startY: y + 6,
    head: [['Concepto', `Monto (${state.gastosMon})`, `Convertido (${base})`]],
    body: gasBody,
    styles: { font:'helvetica', fontSize: 10, cellPadding: 6 },
    headStyles: { fillColor:[34,197,94], textColor:255 },
    alternateRowStyles: { fillColor:[242,255,245] },
    theme: 'grid',
    margin: { left: margin, right: margin },
    columnStyles: { 0:{cellWidth: 220}, 1:{halign:'right'}, 2:{halign:'right'} }
  });

  // 5) Pie de página
  doc.setFont('helvetica','normal');
  doc.setTextColor(120,120,130);
  doc.setFontSize(9);
  doc.text(`Documento generado: ${new Date().toLocaleString()}`, margin, ph - 30);
  doc.text('© 2025 Subasta Vehicular — Todos los derechos reservados.', pw - margin, ph - 30, { align: 'right' });

  // Guardar
  doc.save('resumen_subasta.pdf');
}

/* --------------------------- INIT --------------------------------------- */
function attachRealtime(){
  const nums = document.querySelectorAll('input[type="number"]');
  nums.forEach(n => n.addEventListener('input', calcular));
}

(function init(){
  // Estado inicial UI
  updateBaseCurrencyUI();
  attachRealtime();
  calcular();
})();
