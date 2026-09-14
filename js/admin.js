document.addEventListener('DOMContentLoaded', () => {
    initAdmin();
});

let menuData = [];
const modal = document.getElementById('product-modal');
const productForm = document.getElementById('product-form');

async function initAdmin() {
    await loadData();
    setupEventListeners();
}

async function loadData() {
    try {
        // Carga datos guardados en LocalStorage o cae al JSON inicial
        const localData = localStorage.getItem('carta_data');
        if (localData) {
            menuData = JSON.parse(localData);
        } else {
            const response = await fetch('data/carta.json');
            if (!response.ok) throw new Error('Error al cargar carta base');
            menuData = await response.json();
            saveToLocalStorage();
        }
        renderAdminTable(menuData);
    } catch (error) {
        console.error(error);
        alert('Error al inicializar los datos de administración.');
    }
}

function saveToLocalStorage() {
    localStorage.setItem('carta_data', JSON.stringify(menuData));
}

function renderAdminTable(items) {
    const tbody = document.getElementById('admin-menu-list');
    tbody.innerHTML = '';

    items.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><img src="${item.imagen}" alt="${item.nombre}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;"></td>
            <td><strong>${item.nombre}</strong></td>
            <td>${item.categoria}</td>
            <td>$${item.precio.toLocaleString()}</td>
            <td>
                <button onclick="editProduct(${item.id})" class="btn-secondary" style="margin-right: 0.25rem;">Editar</button>
                <button onclick="deleteProduct(${item.id})" class="btn-danger">Eliminar</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function setupEventListeners() {
    document.getElementById('btn-add-product').addEventListener('click', () => {
        openModal();
    });

    document.getElementById('btn-cancel').addEventListener('click', () => {
        closeModal();
    });

    productForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveProduct();
    });
}

function openModal(product = null) {
    if (product) {
        document.getElementById('modal-title').textContent = 'Editar Producto';
        document.getElementById('product-id').value = product.id;
        document.getElementById('product-name').value = product.nombre;
        document.getElementById('product-category').value = product.categoria;
        document.getElementById('product-price').value = product.precio;
        document.getElementById('product-description').value = product.descripcion;
        document.getElementById('product-image').value = product.imagen;
    } else {
        document.getElementById('modal-title').textContent = 'Nuevo Producto';
        productForm.reset();
        document.getElementById('product-id').value = '';
    }
    modal.style.display = 'flex';
}

function closeModal() {
    modal.style.display = 'none';
    productForm.reset();
}

function saveProduct() {
    const id = document.getElementById('product-id').value;
    const name = document.getElementById('product-name').value;
    const category = document.getElementById('product-category').value;
    const price = parseFloat(document.getElementById('product-price').value);
    const description = document.getElementById('product-description').value;
    const image = document.getElementById('product-image').value;

    if (id) {
        // Editar existente
        const index = menuData.findIndex(item => item.id == id);
        if (index !== -1) {
            menuData[index] = { id: parseInt(id), nombre: name, categoria: category, precio: price, descripcion: description, imagen: image };
        }
    } else {
        // Crear nuevo
        const newId = menuData.length > 0 ? Math.max(...menuData.map(i => i.id)) + 1 : 1;
        menuData.push({ id: newId, nombre: name, categoria: category, precio: price, descripcion: description, imagen: image });
    }

    saveToLocalStorage();
    renderAdminTable(menuData);
    closeModal();
}

window.editProduct = function(id) {
    const product = menuData.find(item => item.id === id);
    if (product) openModal(product);
};

window.deleteProduct = function(id) {
    if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
        menuData = menuData.filter(item => item.id !== id);
        saveToLocalStorage();
        renderAdminTable(menuData);
    }
};