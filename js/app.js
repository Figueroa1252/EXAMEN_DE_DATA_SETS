document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

let menuData = [];

async function initApp() {
  try {
    const localData = localStorage.getItem('carta_data');
    if (localData) {
      menuData = JSON.parse(localData);
    } else {
      const response = await fetch('carta.json');
      if (!response.ok) throw new Error('Error al cargar la carta');
      menuData = await response.json();
    }
    
    setupCategories(menuData);
    renderMenu(menuData);
  } catch (error) {
    console.error(error);
    document.getElementById('menu-grid').innerHTML = 
      `<p style="color: var(--primary);">Error cargando la carta. Asegúrate de ejecutar un servidor local.</p>`;
  }
}

function renderMenu(items) {
  const container = document.getElementById('menu-grid');
  container.innerHTML = '';

  items.forEach(item => {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <div>
        <div class="card-header">
          <h3 class="card-title">${item.plato}</h3>
          <span class="badge">${item.categoria}</span>
        </div>
        <div class="card-body">
          <p>Insumo clave: <strong>${item.insumo_critico}</strong></p>
        </div>
      </div>
      <div class="card-footer">
        <span class="price">$${item.precio_venta.toLocaleString('es-CO')}</span>
      </div>
    `;
    container.appendChild(card);
  });
}

function setupCategories(items) {
  const categoriesContainer = document.getElementById('categories-filter');
  const categories = ['Todos', ...new Set(items.map(item => item.categoria))];

  categoriesContainer.innerHTML = '';

  categories.forEach(category => {
    const btn = document.createElement('button');
    btn.className = `filter-btn ${category === 'Todos' ? 'active' : ''}`;
    btn.textContent = category;
    btn.dataset.category = category;

    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');

      if (category === 'Todos') {
        renderMenu(menuData);
      } else {
        const filtered = menuData.filter(item => item.categoria === category);
        renderMenu(filtered);
      }
    });

    categoriesContainer.appendChild(btn);
  });
}