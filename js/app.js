(function () {
  const state = {
    records: [],
    profiles: [],
    contracts: [],
    currentView: 'dashboard',
    selectedRole: 'Colaborador',
    selectedContractType: 'ordinal'
  };

  const storage = window.FinanceStorage;

  function toSentenceCase(text) {
    return text
      .split(' ')
      .map((word, index) => (index === 0 ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : word.toLowerCase()))
      .join(' ');
  }

  function getVistaDisplayName(vistaId) {
    const labels = {
      dashboard: 'balance general',
      'balance-persona': 'balance por persona',
      arriendo: 'arrendamiento',
      herramientas: 'herramientas'
    };
    return toSentenceCase(labels[vistaId] || vistaId || 'dashboard');
  }

  function updateHeaderContent(vistaId) {
    const title = document.getElementById('header-title');
    const subtitle = document.getElementById('header-subtitle');
    if (title) title.textContent = 'Hola, Yenny 👋🏻';
    if (subtitle) subtitle.textContent = `Estas viendo la pestaña ${getVistaDisplayName(vistaId)}`;
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
  }

  function parseCsv(text) {
    const rows = text.trim().split(/\r?\n/).filter(Boolean);
    if (rows.length < 2) return [];

    const headers = rows[0].split(',').map((item) => item.trim());
    return rows.slice(1).map((row) => {
      const values = row.split(',').map((item) => item.trim());
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      return obj;
    });
  }

  async function loadCsvData() {
    const fallbackCsv = `date,concepto,monto,tipo
2026-07-01,Salario,2800,ingreso
2026-07-02,Arriendo Apto,800,ingreso
2026-07-03,Pago Luz,-120,gasto
2026-07-04,Mercado,-450,gasto
2026-07-05,Transporte,-60,gasto
2026-07-06,Venta extra,150,ingreso
2026-07-07,Internet,-45,gasto`;

    try {
      const response = await fetch('data/finanzas.csv');
      if (!response.ok) throw new Error('CSV no encontrado');
      const text = await response.text();
      return parseCsv(text);
    } catch (error) {
      console.warn('Usando datos de respaldo:', error);
      return parseCsv(fallbackCsv);
    }
  }

  function renderMovements() {
    const tbody = document.querySelector('#view-dashboard tbody');
    if (!tbody) return;

    const rows = state.records.slice(0, 6).map((entry) => {
      const monto = Number(entry.monto || 0);
      const tipo = monto >= 0 ? 'success' : 'danger';
      const sign = monto >= 0 ? '+' : '-';
      return `<tr><td>${entry.date || ''}</td><td>${entry.concepto || ''}</td><td style="color:var(--${tipo})">${sign}${formatCurrency(Math.abs(monto))}</td></tr>`;
    });

    tbody.innerHTML = rows.join('');
  }

  function renderSummary() {
    const ingresos = state.records.filter((entry) => Number(entry.monto || 0) > 0).reduce((sum, entry) => sum + Number(entry.monto || 0), 0);
    const gastos = Math.abs(state.records.filter((entry) => Number(entry.monto || 0) < 0).reduce((sum, entry) => sum + Number(entry.monto || 0), 0));
    const saldo = ingresos - gastos;

    const cards = document.querySelectorAll('.kpi-card');
    if (cards[0]) cards[0].querySelector('.kpi-value').textContent = formatCurrency(gastos);
    if (cards[1]) cards[1].querySelector('.kpi-value').textContent = formatCurrency(saldo);
    if (cards[2]) cards[2].querySelector('.kpi-value').textContent = formatCurrency(ingresos);
  }

  function updateDateTime() {
    const date = new Date();
    const formatter = new Intl.DateTimeFormat('es-CO', {
      timeZone: 'America/Bogota',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    const parts = formatter.formatToParts(date);
    let dia = '';
    let mes = '';
    let anio = '';
    let hora = '';
    let minuto = '';
    let ampm = '';

    for (const part of parts) {
      if (part.type === 'day') dia = part.value;
      if (part.type === 'month') mes = part.value;
      if (part.type === 'year') anio = part.value;
      if (part.type === 'hour') hora = part.value;
      if (part.type === 'minute') minuto = part.value;
      if (part.type === 'dayPeriod') {
        const normalized = part.value.toLowerCase();
        ampm = normalized.includes('a') ? 'a.m.' : normalized.includes('p') ? 'p.m.' : part.value;
      }
    }

    const target = document.getElementById('fecha-hoy');
    if (target) target.innerText = `${dia} de ${mes} de ${anio} | ${hora}:${minuto} ${ampm}`;
  }

  function initCharts() {
    if (typeof Chart === 'undefined') return;

    Chart.defaults.color = '#888';
    Chart.defaults.font.family = "'Poppins', sans-serif";

    const ingresos = state.records.filter((entry) => Number(entry.monto || 0) > 0).map((entry) => Number(entry.monto || 0));
    const gastos = state.records.filter((entry) => Number(entry.monto || 0) < 0).map((entry) => Math.abs(Number(entry.monto || 0)));
    const labels = state.records.slice(0, 6).map((entry) => entry.concepto || '');

    const ctxAnual = document.getElementById('chart-anual');
    if (ctxAnual) {
      new Chart(ctxAnual, {
        type: 'line',
        data: {
          labels: labels.length ? labels : ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul'],
          datasets: [
            {
              label: 'Ingresos',
              data: ingresos.length ? ingresos : [2800, 2900, 3100, 2700, 3200, 2800, 3500],
              borderColor: '#2ecc71',
              backgroundColor: 'rgba(46, 204, 113, 0.1)',
              borderWidth: 2,
              tension: 0.4,
              fill: true
            },
            {
              label: 'Gastos',
              data: gastos.length ? gastos : [1250, 1400, 1300, 1600, 1200, 1500, 1250],
              borderColor: '#ff7675',
              backgroundColor: 'rgba(255, 118, 117, 0.1)',
              borderWidth: 2,
              tension: 0.4,
              fill: true
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'top', labels: { boxWidth: 12, usePointStyle: true } } },
          scales: {
            y: { grid: { color: 'rgba(128, 128, 128, 0.15)' }, border: { display: false } },
            x: { grid: { display: false }, border: { display: false } }
          }
        }
      });
    }

    const ctxMensual = document.getElementById('chart-mensual');
    if (ctxMensual) {
      const dataMensual = state.records.map((entry) => Number(entry.monto || 0));
      new Chart(ctxMensual, {
        type: 'bar',
        data: {
          labels: state.records.slice(0, 10).map((entry) => entry.date || ''),
          datasets: [{
            label: 'Balance Neto Diario',
            data: dataMensual.length ? dataMensual : [50, -30, 80, -10, 95, -25, 40],
            backgroundColor: (context) => context.raw >= 0 ? '#f1c40f' : '#ff7675',
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { grid: { color: 'rgba(128, 128, 128, 0.15)' }, border: { display: false } },
            x: { grid: { display: false }, border: { display: false }, ticks: { maxTicksLimit: 10 } }
          }
        }
      });
    }

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
          plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, usePointStyle: true, padding: 20 } } },
          cutout: '75%'
        }
      });
    }

    const ctxApilado = document.getElementById('chart-apilado');
    if (ctxApilado) {
      new Chart(ctxApilado, {
        type: 'bar',
        data: {
          labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
          datasets: [
            { label: 'Ingresos', data: [1200, 500, 800, 300], backgroundColor: 'rgba(46, 204, 113, 0.8)', borderRadius: 4 },
            { label: 'Gastos', data: [400, 600, 300, 900], backgroundColor: 'rgba(255, 118, 117, 0.8)', borderRadius: 4 }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { stacked: true, grid: { display: false }, border: { display: false } },
            y: { stacked: true, grid: { color: 'rgba(128, 128, 128, 0.15)' }, border: { display: false } }
          },
          plugins: { legend: { position: 'top', labels: { boxWidth: 12, usePointStyle: true } } }
        }
      });
    }
  }

  async function initializeApp() {
    updateDateTime();
    setInterval(updateDateTime, 1000);

    const savedState = storage?.readState ? storage.readState() : {};
    state.profiles = savedState.profiles || [];
    state.contracts = savedState.contracts || [];
    state.records = await loadCsvData();

    if (localStorage.getItem('temaFamilia') === 'light') document.body.classList.add('light-mode');

    updateHeaderContent(state.currentView);
    renderSummary();
    renderMovements();
    initCharts();
  }

  function closeSubmenu() {
    const submenu = document.getElementById('submenu-resumen');
    const container = submenu?.parentElement;
    if (submenu) submenu.classList.remove('open');
    if (container) container.classList.remove('open');
  }

  function cambiarVista(vistaId, elementoMenu) {
    closeSubmenu();
    state.currentView = vistaId;
    updateHeaderContent(vistaId);
    ['view-dashboard', 'view-balance-persona', 'view-arriendo', 'view-herramientas'].forEach((id) => {
      const element = document.getElementById(id);
      if (element) element.style.display = 'none';
    });

    const target = document.getElementById('view-' + vistaId);
    if (target) target.style.display = 'grid';

    document.querySelectorAll('.menu-item, .submenu-item').forEach((el) => el.classList.remove('active'));
    if (elementoMenu) elementoMenu.classList.add('active');

    const submenu = document.getElementById('submenu-resumen');
    if (submenu) {
      if (vistaId === 'dashboard' || vistaId === 'balance-persona') {
        const resumenBtn = document.getElementById('btn-resumen');
        if (resumenBtn) resumenBtn.classList.add('active');
        submenu.style.display = 'flex';
      } else {
        submenu.style.display = 'none';
      }
    }

    const fab = document.getElementById('fab-container');
    if (fab) fab.classList.remove('active');
  }

  function toggleSubmenu(forzarApertura = false) {
    const submenu = document.getElementById('submenu-resumen');
    const container = submenu?.parentElement;
    if (!submenu) return;

    const shouldOpen = forzarApertura || !submenu.classList.contains('open');
    if (shouldOpen) {
      submenu.classList.add('open');
      if (container) container.classList.add('open');
    } else {
      submenu.classList.remove('open');
      if (container) container.classList.remove('open');
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

  function toggleFabMenu() {
    const fabContainer = document.getElementById('fab-container');
    if (fabContainer) fabContainer.classList.toggle('active');
  }

  function abrirModalPerfil() {
    const fab = document.getElementById('fab-container');
    if (fab) fab.classList.remove('active');

    const nombreInput = document.getElementById('input-nombre-perfil');
    const passwordInput = document.getElementById('input-password-perfil');
    if (nombreInput) nombreInput.value = '';
    if (passwordInput) passwordInput.value = '';
    validarFormularioPerfil();

    const modal = document.getElementById('modal-perfil');
    if (modal) {
      modal.style.display = 'flex';
      setTimeout(() => modal.classList.add('active'), 10);
    }
  }

  function cerrarModalPerfil() {
    const modal = document.getElementById('modal-perfil');
    if (modal) {
      modal.classList.remove('active');
      setTimeout(() => (modal.style.display = 'none'), 300);
    }
  }

  function abrirModalContrato() {
    const fab = document.getElementById('fab-container');
    if (fab) fab.classList.remove('active');

    const dropdownContainer = document.getElementById('dropdown-arrendatario-container');
    if (dropdownContainer) dropdownContainer.classList.remove('open');

    const modal = document.getElementById('modal-contrato');
    if (modal) {
      modal.style.display = 'flex';
      setTimeout(() => modal.classList.add('active'), 10);
    }
  }

  function cerrarModalContrato() {
    const modal = document.getElementById('modal-contrato');
    if (modal) {
      modal.classList.remove('active');
      modal.classList.remove('transition-no-blur');
      setTimeout(() => (modal.style.display = 'none'), 300);
    }
  }

  function guardarPerfilSiValido() {
    const btn = document.getElementById('btn-guardar-perfil');
    if (btn && btn.classList.contains('active')) {
      const nombre = document.getElementById('input-nombre-perfil').value.trim();
      const password = document.getElementById('input-password-perfil').value.trim();
      state.profiles.push({ nombre, password, role: state.selectedRole });
      if (storage?.syncToFirebase) storage.syncToFirebase({ ...state, profiles: state.profiles });
      cerrarModalPerfil();
      alert('¡Perfil configurado con éxito!');
    }
  }

  function seleccionarRol(btn) {
    const botones = btn.parentElement.querySelectorAll('.role-btn');
    botones.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    state.selectedRole = btn.textContent.trim();
  }

  function seleccionarAccionContrato(btn) {
    const botones = btn.parentElement.querySelectorAll('.role-btn');
    botones.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
  }

  function seleccionarTipoContrato(btn, tipo) {
    const botones = btn.parentElement.querySelectorAll('.role-btn-outline');
    botones.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    state.selectedContractType = tipo;

    const msgDiv = document.getElementById('msg-dropdown-perfiles');
    const obsContainer = document.getElementById('container-observaciones');
    const toggleMap = {
      'toggle-canon': 'input-canon',
      'toggle-dia': 'input-dia-pago',
      'toggle-vencimiento': 'input-vencimiento'
    };

    if (tipo === 'familiar') {
      if (msgDiv) msgDiv.innerText = 'No se encontraron perfiles de Colaborador o Integrante activos.';
      Object.keys(toggleMap).forEach((tId) => {
        const toggle = document.getElementById(tId);
        if (toggle) toggle.style.display = 'inline-flex';
      });
      if (obsContainer) obsContainer.style.display = 'block';
    } else {
      if (msgDiv) msgDiv.innerText = 'No se encontraron perfiles activos para parametrizar.';
      Object.entries(toggleMap).forEach(([tId, iId]) => {
        const toggle = document.getElementById(tId);
        const input = document.getElementById(iId);
        if (toggle) {
          toggle.style.display = 'none';
          toggle.classList.remove('active');
        }
        if (input) input.disabled = false;
      });
      if (obsContainer) obsContainer.style.display = 'none';
    }
  }

  function toggleFieldOverride(inputId, toggleId) {
    const input = document.getElementById(inputId);
    const toggle = document.getElementById(toggleId);
    if (!input || !toggle) return;

    toggle.classList.toggle('active');
    input.disabled = toggle.classList.contains('active');
    if (input.disabled) input.value = '';
  }

  function capitalizarNombres(input) {
    const palabras = input.value.split(' ');
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
    if (copyBtn) copyBtn.style.display = pwdValid ? 'block' : 'none';

    const saveBtn = document.getElementById('btn-guardar-perfil');
    if (saveBtn) saveBtn.classList.toggle('active', pwdValid && nombreValid);
  }

  function toggleRule(id, isValid) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle('valid', isValid);
  }

  function copiarAlPortapapeles(texto) {
    const tempInput = document.createElement('textarea');
    tempInput.value = texto;
    tempInput.style.position = 'fixed';
    tempInput.style.opacity = '0';
    document.body.appendChild(tempInput);
    tempInput.focus();
    tempInput.select();

    try {
      document.execCommand('copy');
      animarIconoCopia();
    } catch (error) {
      console.error('No se pudo copiar:', error);
    }
    document.body.removeChild(tempInput);
  }

  function animarIconoCopia() {
    const icon = document.getElementById('icono-copiar');
    if (icon) {
      icon.classList.add('copied');
      setTimeout(() => icon.classList.remove('copied'), 1000);
    }
  }

  function copiarPasswordManual() {
    const pwdInput = document.getElementById('input-password-perfil');
    if (!pwdInput || !pwdInput.value) return;
    copiarAlPortapapeles(pwdInput.value);
  }

  function generarPassword() {
    const mayusculas = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const minusculas = 'abcdefghijklmnopqrstuvwxyz';
    const numeros = '0123456789';
    const especiales = '!@#$%*&_';
    const todos = mayusculas + minusculas + numeros + especiales;

    let pwd = '';
    pwd += mayusculas[Math.floor(Math.random() * mayusculas.length)];
    pwd += minusculas[Math.floor(Math.random() * minusculas.length)];
    pwd += numeros[Math.floor(Math.random() * numeros.length)];
    pwd += especiales[Math.floor(Math.random() * especiales.length)];
    for (let i = 0; i < 6; i++) pwd += todos[Math.floor(Math.random() * todos.length)];
    pwd = pwd.split('').sort(() => 0.5 - Math.random()).join('');

    const input = document.getElementById('input-password-perfil');
    if (input) input.value = pwd;

    validarFormularioPerfil();
    copiarAlPortapapeles(pwd);
  }

  function toggleDropdownArrendatario(event) {
    event.stopPropagation();
    const container = document.getElementById('dropdown-arrendatario-container');
    if (container) container.classList.toggle('open');
  }

  function transicionCrearPerfil(event) {
    event.stopPropagation();

    const modalContrato = document.getElementById('modal-contrato');
    const modalPerfil = document.getElementById('modal-perfil');

    if (modalContrato) {
      modalContrato.classList.add('transition-no-blur');
      modalContrato.classList.remove('active');
    }

    if (modalPerfil) modalPerfil.style.display = 'flex';

    const nombreInput = document.getElementById('input-nombre-perfil');
    const passwordInput = document.getElementById('input-password-perfil');
    if (nombreInput) nombreInput.value = '';
    if (passwordInput) passwordInput.value = '';
    validarFormularioPerfil();

    setTimeout(() => {
      if (modalContrato) {
        modalContrato.style.display = 'none';
        modalContrato.classList.remove('transition-no-blur');
      }
      if (modalPerfil) modalPerfil.classList.add('active');
    }, 300);
  }

  function guardarContrato() {
    const btn = document.getElementById('btn-guardar-contrato');
    if (btn && btn.classList.contains('active')) {
      state.contracts.push({ type: state.selectedContractType, date: new Date().toISOString() });
      if (storage?.syncToFirebase) storage.syncToFirebase({ ...state, contracts: state.contracts });
      cerrarModalContrato();
      alert('¡Contrato parametrizado con éxito!');
    }
  }

  document.addEventListener('click', (event) => {
    const container = document.getElementById('dropdown-arrendatario-container');
    if (container && container.classList.contains('open') && !container.contains(event.target)) {
      container.classList.remove('open');
    }
  });

  window.actualizarFechaHora = updateDateTime;
  window.initCharts = initCharts;
  window.cambiarVista = cambiarVista;
  window.toggleSubmenu = toggleSubmenu;
  window.toggleTheme = toggleTheme;
  window.dividirGasto = dividirGasto;
  window.toggleFabMenu = toggleFabMenu;
  window.abrirModalPerfil = abrirModalPerfil;
  window.cerrarModalPerfil = cerrarModalPerfil;
  window.abrirModalContrato = abrirModalContrato;
  window.cerrarModalContrato = cerrarModalContrato;
  window.guardarPerfilSiValido = guardarPerfilSiValido;
  window.seleccionarRol = seleccionarRol;
  window.seleccionarAccionContrato = seleccionarAccionContrato;
  window.seleccionarTipoContrato = seleccionarTipoContrato;
  window.toggleFieldOverride = toggleFieldOverride;
  window.capitalizarNombres = capitalizarNombres;
  window.validarFormularioPerfil = validarFormularioPerfil;
  window.copiarAlPortapapeles = copiarAlPortapapeles;
  window.animarIconoCopia = animarIconoCopia;
  window.copiarPasswordManual = copiarPasswordManual;
  window.generarPassword = generarPassword;
  window.toggleDropdownArrendatario = toggleDropdownArrendatario;
  window.transicionCrearPerfil = transicionCrearPerfil;
  window.guardarContrato = guardarContrato;

  window.addEventListener('load', initializeApp);
})();
