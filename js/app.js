function actualizarFechaHora() {
  const date = new Date();
  const formatter = new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    day: '2-digit', month: 'long', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true
  });

  const parts = formatter.formatToParts(date);
  let dia = '', mes = '', anio = '', hora = '', minuto = '', ampm = '';

  for (const part of parts) {
    if (part.type === 'day') dia = part.value;
    if (part.type === 'month') mes = part.value;
    if (part.type === 'year') anio = part.value;
    if (part.type === 'hour') hora = part.value;
    if (part.type === 'minute') minuto = part.value;
    if (part.type === 'dayPeriod') ampm = part.value.toLowerCase().replace(/\./g, '').trim();
  }

  document.getElementById('fecha-hoy').innerText = `${dia} de ${mes} de ${anio} | ${hora}:${minuto} ${ampm}`;
}

// --- Inicialización de Gráficos (Chart.js) ---
function initCharts() {
  // Configuraciones globales para que luzca bien en ambos temas
  Chart.defaults.color = '#888';
  Chart.defaults.font.family = "'Poppins', sans-serif";

  // 1. Gráfico Anual (Líneas Suaves)
  const ctxAnual = document.getElementById('chart-anual');
  if (ctxAnual) {
    new Chart(ctxAnual, {
      type: 'line',
      data: {
        labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul'],
        datasets: [{
          label: 'Ingresos',
          data: [2800, 2900, 3100, 2700, 3200, 2800, 3500],
          borderColor: '#2ecc71', /* success */
          backgroundColor: 'rgba(46, 204, 113, 0.1)',
          borderWidth: 2,
          tension: 0.4,
          fill: true
        }, {
          label: 'Gastos',
          data: [1250, 1400, 1300, 1600, 1200, 1500, 1250],
          borderColor: '#ff7675', /* danger */
          backgroundColor: 'rgba(255, 118, 117, 0.1)',
          borderWidth: 2,
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { boxWidth: 12, usePointStyle: true } }
        },
        scales: {
          y: { grid: { color: 'rgba(128, 128, 128, 0.15)' }, border: { display: false } },
          x: { grid: { display: false }, border: { display: false } }
        },
        interaction: { mode: 'index', intersect: false }
      }
    });
  }

  // 2. Gráfico Mensual (Barras de Balance Diario 1 al 31)
  const ctxMensual = document.getElementById('chart-mensual');
  if (ctxMensual) {
    const diasDelMes = Array.from({length: 31}, (_, i) => i + 1);
    // Genera valores aleatorios entre -50 y 150 para simular la dinámica del mes
    const dataMensual = diasDelMes.map(() => Math.floor(Math.random() * 200) - 50);

    new Chart(ctxMensual, {
      type: 'bar',
      data: {
        labels: diasDelMes,
        datasets: [{
          label: 'Balance Neto Diario',
          data: dataMensual,
          backgroundColor: (context) => {
            return context.raw >= 0 ? '#F1C40F' : '#ff7675'; /* gold or danger */
          },
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { grid: { color: 'rgba(128, 128, 128, 0.15)' }, border: { display: false } },
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: { maxTicksLimit: 15 } /* Evita saturar la barra X con 31 números pegados */
          }
        }
      }
    });
  }

  // 3. Gráfico Circular (Distribución)
  const ctxCircular = document.getElementById('chart-circular');
  if (ctxCircular) {
    new Chart(ctxCircular, {
      type: 'doughnut',
      data: {
        labels: ['Servicios', 'Arriendo', 'Mercado', 'Otros'],
        datasets: [{
          data: [350, 800, 450, 150],
          backgroundColor: ['#3498db', '#2ecc71', '#f1c40f', '#e74c3c'],
          borderWidth: 0,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, usePointStyle: true, padding: 20 } }
        },
        cutout: '75%'
      }
    });
  }

  // 4. Gráfico Apilado (Flujo de Efectivo)
  const ctxApilado = document.getElementById('chart-apilado');
  if (ctxApilado) {
    new Chart(ctxApilado, {
      type: 'bar',
      data: {
        labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
        datasets: [
          {
            label: 'Ingresos',
            data: [1200, 500, 800, 300],
            backgroundColor: 'rgba(46, 204, 113, 0.8)',
            borderRadius: 4
          },
          {
            label: 'Gastos',
            data: [400, 600, 300, 900],
            backgroundColor: 'rgba(255, 118, 117, 0.8)',
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { stacked: true, grid: { display: false }, border: { display: false } },
          y: { stacked: true, grid: { color: 'rgba(128, 128, 128, 0.15)' }, border: { display: false } }
        },
        plugins: {
          legend: { position: 'top', labels: { boxWidth: 12, usePointStyle: true } }
        }
      }
    });
  }
}

window.addEventListener('load', () => {
  actualizarFechaHora();
  setInterval(actualizarFechaHora, 1000);

  if(localStorage.getItem('temaFamilia') === 'light') {
    document.body.classList.add('light-mode');
  }

  // Arrancamos los gráficos al cargar
  initCharts();
});

function cambiarVista(vistaId, elementoMenu) {
  ['view-dashboard', 'view-balance-persona', 'view-arriendo', 'view-herramientas'].forEach(id => {
    document.getElementById(id).style.display = 'none';
  });

  document.getElementById('view-' + vistaId).style.display = 'grid';
  document.querySelectorAll('.menu-item, .submenu-item').forEach(el => el.classList.remove('active'));
  elementoMenu.classList.add('active');

  const submenu = document.getElementById('submenu-resumen');
  if (vistaId === 'dashboard' || vistaId === 'balance-persona') {
    document.getElementById('btn-resumen').classList.add('active');
    submenu.style.display = 'flex';
  } else {
    submenu.style.display = 'none';
  }

  document.getElementById('fab-container').classList.remove('active');
}

function toggleSubmenu(forzarApertura = false) {
  const submenu = document.getElementById('submenu-resumen');
  if (submenu.style.display === 'none' || forzarApertura) {
    submenu.style.display = 'flex';
    cambiarVista('dashboard', document.getElementById('btn-sub-general'));
  } else {
    submenu.style.display = 'none';
  }
}

function toggleTheme() {
  const body = document.body;
  body.classList.toggle('light-mode');
  localStorage.setItem('temaFamilia', body.classList.contains('light-mode') ? 'light' : 'dark');
}

function dividirGasto() {
  const monto = parseFloat(document.getElementById('monto-div').value);
  if (monto) document.getElementById('res-div').innerText = `$${(monto / 4).toLocaleString()} c/u`;
}

// Control de animación del menú flotante
function toggleFabMenu() {
  const fabContainer = document.getElementById('fab-container');
  fabContainer.classList.toggle('active');
}

// --- Modales y Gestión de Ventanas ---

function abrirModalPerfil() {
  document.getElementById('fab-container').classList.remove('active');

  document.getElementById('input-nombre-perfil').value = '';
  document.getElementById('input-password-perfil').value = '';
  validarFormularioPerfil();

  const modal = document.getElementById('modal-perfil');
  modal.style.display = 'flex';
  setTimeout(() => modal.classList.add('active'), 10);
}

function cerrarModalPerfil() {
  const modal = document.getElementById('modal-perfil');
  modal.classList.remove('active');
  setTimeout(() => modal.style.display = 'none', 300);
}

function abrirModalContrato() {
  document.getElementById('fab-container').classList.remove('active');

  const dropdownContainer = document.getElementById('dropdown-arrendatario-container');
  dropdownContainer.classList.remove('open');

  const modal = document.getElementById('modal-contrato');
  modal.style.display = 'flex';
  setTimeout(() => modal.classList.add('active'), 10);
}

function cerrarModalContrato() {
  const modal = document.getElementById('modal-contrato');
  modal.classList.remove('active');
  modal.classList.remove('transition-no-blur');
  setTimeout(() => modal.style.display = 'none', 300);
}

function guardarPerfilSiValido() {
  const btn = document.getElementById('btn-guardar-perfil');
  if (btn.classList.contains('active')) {
    cerrarModalPerfil();
    alert('¡Perfil configurado con éxito!');
  }
}

function seleccionarRol(btn) {
  const botones = btn.parentElement.querySelectorAll('.role-btn');
  botones.forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function seleccionarAccionContrato(btn) {
  const botones = btn.parentElement.querySelectorAll('.role-btn');
  botones.forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function seleccionarTipoContrato(btn, tipo) {
  const botones = btn.parentElement.querySelectorAll('.role-btn-outline');
  botones.forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  const msgDiv = document.getElementById('msg-dropdown-perfiles');
  const obsContainer = document.getElementById('container-observaciones');

  const toggleMap = {
      'toggle-canon': 'input-canon',
      'toggle-dia': 'input-dia-pago',
      'toggle-vencimiento': 'input-vencimiento'
  };

  if(tipo === 'familiar') {
      msgDiv.innerText = "No se encontraron perfiles de Colaborador o Integrante activos.";

      // Mostrar los botones de exención y observaciones
      for (const tId in toggleMap) {
          document.getElementById(tId).style.display = 'inline-flex';
      }
      obsContainer.style.display = 'block';

  } else {
      msgDiv.innerText = "No se encontraron perfiles activos para parametrizar.";

      // Ocultar los botones, limpiar su estado si estaban activos y ocultar observaciones
      for (const [tId, iId] of Object.entries(toggleMap)) {
          const t = document.getElementById(tId);
          t.style.display = 'none';
          if (t.classList.contains('active')) {
              t.classList.remove('active');
              document.getElementById(iId).disabled = false;
          }
      }
      obsContainer.style.display = 'none';
  }
}

// Animación e inhabilitación de campos de contrato
function toggleFieldOverride(inputId, toggleId) {
  const input = document.getElementById(inputId);
  const toggle = document.getElementById(toggleId);

  toggle.classList.toggle('active');

  if (toggle.classList.contains('active')) {
      // Se activó el botón de exención
      input.value = '';
      input.disabled = true;
  } else {
      // Se desactivó el botón de exención
      input.disabled = false;
  }
}

function capitalizarNombres(input) {
  let palabras = input.value.split(' ');
  for (let i = 0; i < palabras.length; i++) {
    if (palabras[i].length > 0) {
      palabras[i] = palabras[i].charAt(0).toUpperCase() + palabras[i].substring(1).toLowerCase();
    }
  }
  input.value = palabras.join(' ');
}

function validarFormularioPerfil() {
  const pwd = document.getElementById('input-password-perfil').value;
  const nombre = document.getElementById('input-nombre-perfil').value;

  const rLength = pwd.length >= 8;
  const rCase = /[a-z]/.test(pwd) && /[A-Z]/.test(pwd);
  const rNum = /\d/.test(pwd);
  const rSpec = /[^a-zA-Z0-9]/.test(pwd);

  toggleRule('rule-length', rLength);
  toggleRule('rule-case', rCase);
  toggleRule('rule-num', rNum);
  toggleRule('rule-spec', rSpec);

  const pwdValid = rLength && rCase && rNum && rSpec;
  const nombreValid = nombre.trim().length > 0;

  const copyBtn = document.getElementById('wrapper-copy-btn');
  if (pwdValid) {
    copyBtn.style.display = 'block';
  } else {
    copyBtn.style.display = 'none';
  }

  const saveBtn = document.getElementById('btn-guardar-perfil');
  if (pwdValid && nombreValid) {
    saveBtn.classList.add('active');
  } else {
    saveBtn.classList.remove('active');
  }
}

function toggleRule(id, isValid) {
  const el = document.getElementById(id);
  if (isValid) {
    el.classList.add('valid');
  } else {
    el.classList.remove('valid');
  }
}

function copiarAlPortapapeles(texto) {
  const tempInput = document.createElement("textarea");
  tempInput.value = texto;
  tempInput.style.position = "fixed";
  tempInput.style.opacity = "0";
  document.body.appendChild(tempInput);
  tempInput.focus();
  tempInput.select();

  try {
    document.execCommand('copy');
    animarIconoCopia();
  } catch (err) {
    console.error('No se pudo copiar: ', err);
  }
  document.body.removeChild(tempInput);
}

function animarIconoCopia() {
  const icon = document.getElementById('icono-copiar');
  icon.classList.add('copied');
  setTimeout(() => {
    icon.classList.remove('copied');
  }, 1000);
}

function copiarPasswordManual() {
  const pwdInput = document.getElementById('input-password-perfil');
  if (!pwdInput.value) return;
  copiarAlPortapapeles(pwdInput.value);
}

function generarPassword() {
  const mayusculas = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const minusculas = "abcdefghijklmnopqrstuvwxyz";
  const numeros = "0123456789";
  const especiales = "!@#$%*&_";
  const todos = mayusculas + minusculas + numeros + especiales;

  let pwd = "";

  pwd += mayusculas[Math.floor(Math.random() * mayusculas.length)];
  pwd += minusculas[Math.floor(Math.random() * minusculas.length)];
  pwd += numeros[Math.floor(Math.random() * numeros.length)];
  pwd += especiales[Math.floor(Math.random() * especiales.length)];

  for (let i = 0; i < 6; i++) {
    pwd += todos[Math.floor(Math.random() * todos.length)];
  }

  pwd = pwd.split('').sort(() => 0.5 - Math.random()).join('');

  document.getElementById('input-password-perfil').value = pwd;

  validarFormularioPerfil();
  copiarAlPortapapeles(pwd);
}

// --- Funciones exclusivas del Modal Contrato ---

function toggleDropdownArrendatario(event) {
  event.stopPropagation();
  const container = document.getElementById('dropdown-arrendatario-container');
  container.classList.toggle('open');
}

document.addEventListener('click', function(event) {
  const container = document.getElementById('dropdown-arrendatario-container');
  if (container && container.classList.contains('open') && !container.contains(event.target)) {
    container.classList.remove('open');
  }
});

function transicionCrearPerfil(event) {
  event.stopPropagation();

  const modalContrato = document.getElementById('modal-contrato');
  modalContrato.classList.add('transition-no-blur');
  modalContrato.classList.remove('active');

  const modalPerfil = document.getElementById('modal-perfil');
  modalPerfil.style.display = 'flex';

  document.getElementById('input-nombre-perfil').value = '';
  document.getElementById('input-password-perfil').value = '';
  validarFormularioPerfil();

  setTimeout(() => {
      modalContrato.style.display = 'none';
      modalContrato.classList.remove('transition-no-blur');
      modalPerfil.classList.add('active');
  }, 300);
}

function guardarContrato() {
  const btn = document.getElementById('btn-guardar-contrato');
  if (btn.classList.contains('active')) {
    cerrarModalContrato();
    alert('¡Contrato parametrizado con éxito!');
  }
}