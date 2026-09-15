document.addEventListener('DOMContentLoaded', () => {
    initAdmin();
});

let menuData = [];
let pedidosData = [];

async function initAdmin() {
    await loadData();
    calculateKPIs();
    setupEventListeners();
}

async function loadData() {
    try {
        // Carga de la Carta
        const localCarta = localStorage.getItem('carta_data');
        if (localCarta) {
            menuData = JSON.parse(localCarta);
        } else {
            const resCarta = await fetch('data/carta.json');
            menuData = await resCarta.json();
            localStorage.setItem('carta_data', JSON.stringify(menuData));
        }

        // Carga de Pedidos
        const resPedidos = await fetch('data/pedidos.json');
        pedidosData = await resPedidos.json();

        renderAdminTable(menuData);
    } catch (error) {
        console.error('Error al cargar datos:', error);
    }
}

function calculateKPIs() {
    if (!pedidosData.length || !menuData.length) return;

    // 1. Ventas Totales y Unidades Vendidas
    const ventasTotales = pedidosData.reduce((acc, p) => acc + (p.total || 0), 0);
    const unidadesTotales = pedidosData.reduce((acc, p) => acc + (p.cantidad || 0), 0);
    const ticketPromedio = ventasTotales / (pedidosData.length || 1);

    document.getElementById('kpi-ventas').textContent = `$${ventasTotales.toLocaleString('es-CO')}`;
    document.getElementById('kpi-unidades').textContent = unidadesTotales;
    document.getElementById('kpi-ticket').textContent = `$${Math.round(ticketPromedio).toLocaleString('es-CO')}`;

    // 2. Hora Pico
    const horasMap = {};
    pedidosData.forEach(p => {
        const hora = p.hora ? p.hora.split(':')[0] + ':00' : 'N/A';
        horasMap[hora] = (horasMap[hora] || 0) + 1;
    });
    const horaPico = Object.keys(horasMap).reduce((a, b) => horasMap[a] > horasMap[b] ? a : b, '--:--');
    document.getElementById('kpi-horapico').textContent = `${horaPico} hs`;

    // 3. Plato más rentable (mayor margen: precio_venta - costo)
    let masRentable = menuData[0];
    let maxMargen = 0;
    menuData.forEach(m => {
        const margen = (m.precio_venta || 0) - (m.costo || 0);
        if (margen > maxMargen) {
            maxMargen = margen;
            masRentable = m;
        }
    });
    document.getElementById('kpi-rentable').textContent = masRentable ? masRentable.plato : 'N/A';

    // 4. Alertas de Stock Bajo (< 10 unidades)
    const alertasUl = document.getElementById('alertas-stock-list');
    alertasUl.innerHTML = '';
    const stockBajo = menuData.filter(m => (m.stock_actual || 0) < 10);
    if (stockBajo.length === 0) {
        alertasUl.innerHTML = '<li style="color: #2a9d8f;">✅ Niveles de stock óptimos.</li>';
    } else {
        stockBajo.forEach(s => {
            alertasUl.innerHTML += `<li style="color: #e63946; margin-bottom: 0.3rem;">⚠️ <strong>${s.plato}</strong>: Insumo (${s.insumo_critico}) - Stock: ${s.stock_actual || 0} u.</li>`;
        });
    }

    // 5. Top 5 Platos Más Vendidos
    const platoVentas = {};
    pedidosData.forEach(p => {
        platoVentas[p.plato] = (platoVentas[p.plato] || 0) + p.cantidad;
    });
    const sortedTop = Object.entries(platoVentas).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const topOl = document.getElementById('top-platos-list');
    topOl.innerHTML = '';
    sortedTop.forEach(([nombre, cant]) => {
        topOl.innerHTML += `<li style="margin-bottom: 0.4rem;"><strong>${nombre}</strong>: ${cant} unidades</li>`;
    });

    // 6. Proyección Simple de Demanda
    const proyeccionDiv = document.getElementById('proyeccion-container');
    const promedioDiario = unidadesTotales / 30; // Mes estimado de 30 días
    const estimacionSemanal = Math.round(promedioDiario * 7);
    proyeccionDiv.innerHTML = `
        <p style="font-size: 0.95rem; color: #a0a0a0;">Basado en el histórico del mes:</p>
        <p style="font-size: 1.3rem; color: #f4a261; font-weight: bold;">~${estimacionSemanal} unidades / semana</p>
        <small style="color: #777;">Promedio proyectado para insumos críticos.</small>
    `;
}

function renderAdminTable(items) {
    const tbody = document.getElementById('admin-menu-list');
    if (!tbody) return;
    tbody.innerHTML = '';

    items.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${item.plato}</strong></td>
            <td><span style="background: #333; color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 12px;">${item.categoria}</span></td>
            <td>${item.insumo_critico || 'N/A'}</td>
            <td>$${Number(item.precio_venta).toLocaleString('es-CO')}</td>
            <td>
                <button onclick="editProduct('${item.id_plato}')" class="btn-secondary">Editar</button>
                <button onclick="deleteProduct('${item.id_plato}')" class="btn-danger">Eliminar</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function setupEventListeners() {
    const btnAdd = document.getElementById('btn-add-product');
    const btnCancel = document.getElementById('btn-cancel');
    const modal = document.getElementById('product-modal');
    const productForm = document.getElementById('product-form');

    if (btnAdd) btnAdd.addEventListener('click', () => modal.style.display = 'flex');
    if (btnCancel) btnCancel.addEventListener('click', () => modal.style.display = 'none');

    if (productForm) {
        productForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('product-id').value;
            const name = document.getElementById('product-name').value;
            const category = document.getElementById('product-category').value;
            const price = parseFloat(document.getElementById('product-price').value);
            const insumo = document.getElementById('product-description').value;

            if (id) {
                const idx = menuData.findIndex(item => item.id_plato === id);
                if (idx !== -1) {
                    menuData[idx] = { ...menuData[idx], plato: name, categoria: category, precio_venta: price, insumo_critico: insumo };
                }
            } else {
                const newId = `PLT-0${menuData.length + 1}`;
                menuData.push({ id_plato: newId, plato: name, categoria: category, precio_venta: price, costo: price * 0.4, stock_actual: 20, insumo_critico: insumo });
            }

            localStorage.setItem('carta_data', JSON.stringify(menuData));
            renderAdminTable(menuData);
            calculateKPIs();
            modal.style.display = 'none';
            productForm.reset();
        });
    }
}

window.editProduct = function(id) {
    const product = menuData.find(item => item.id_plato === id);
    if (product) {
        document.getElementById('product-id').value = product.id_plato;
        document.getElementById('product-name').value = product.plato;
        document.getElementById('product-category').value = product.categoria;
        document.getElementById('product-price').value = product.precio_venta;
        document.getElementById('product-description').value = product.insumo_critico || '';
        document.getElementById('product-modal').style.display = 'flex';
    }
};

window.deleteProduct = function(id) {
    if (confirm('¿Deseas eliminar este producto de la carta?')) {
        menuData = menuData.filter(item => item.id_plato !== id);
        localStorage.setItem('carta_data', JSON.stringify(menuData));
        renderAdminTable(menuData);
        calculateKPIs();
    }
};