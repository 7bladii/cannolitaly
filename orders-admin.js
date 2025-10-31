// orders-admin.js (Completo y Corregido con Fecha de Entrega)

document.addEventListener('DOMContentLoaded', () => {
    if (typeof firebase === 'undefined' || typeof firebase.firestore === 'undefined') {
        console.error("Firebase or Firestore is not loaded.");
        return;
    }
    const db = firebase.firestore();

    const ordersTbody = document.getElementById('orders-tbody');
    const modal = document.getElementById('order-details-modal');
    const modalBody = document.getElementById('modal-body');
    const closeModalBtn = document.querySelector('.modal-close-btn');

    if (!ordersTbody || !modal || !modalBody || !closeModalBtn) {
        console.error("One or more essential elements for the orders page are missing.");
        return;
    }

    // --- 1. LOAD ORDERS ---
    async function loadOrders() {
        try {
            const snapshot = await db.collection('orders').orderBy('createdAt', 'desc').get();
            ordersTbody.innerHTML = ''; 

            if (snapshot.empty) {
                // --- CAMBIO (1/4): Colspan actualizado a 9 para la nueva columna ---
                ordersTbody.innerHTML = '<tr><td colspan="9">No orders found.</td></tr>';
                return;
            }

            snapshot.forEach(doc => {
                const order = { id: doc.id, ...doc.data() };
                const orderDate = order.createdAt.toDate().toLocaleDateString();
                const row = document.createElement('tr');
                
                const fullAddress = order.customerAddress2 
                    ? `${order.customerAddress}, ${order.customerAddress2}` 
                    : order.customerAddress;

                // --- CAMBIO (2/4): Lógica añadida para formatear la fecha de entrega ---
                let deliveryDateStr = 'N/A';
                if (order.deliveryDateTime) {
                    deliveryDateStr = order.deliveryDateTime.toDate().toLocaleString();
                }
                // --- Fin del código añadido ---

                row.innerHTML = `
                    <td data-label="Order ID">${order.id.substring(0, 8)}...</td>
                    <td data-label="Customer">${order.customerName}</td>
                    <td data-label="Phone">${order.customerPhone}</td>
                    <td data-label="Address">${fullAddress}</td>
                    <td data-label="Date (Ordered)">${orderDate}</td>
                    
                    <td data-label="Delivery Date">${deliveryDateStr}</td>
                    
                    <td data-label="Total">$${order.total.toFixed(2)}</td>
                    <td data-label="Status"><span class="status-badge status-${order.status.toLowerCase()}">${order.status}</span></td>
                    <td data-label="Actions">
                        <button class="btn btn-secondary details-btn" data-id="${order.id}">Details</button>
                        <button class="btn btn-action change-status-btn" data-id="${order.id}" data-status="${order.status}">Toggle Status</button>
                        <button class="btn btn-danger delete-btn" data-id="${order.id}">Delete</button>
                    </td>
                `;
                ordersTbody.appendChild(row);
            });
            
            addEventListenersToButtons();

        } catch (error) {
            console.error("Error loading orders:", error);
        }
    }

    // --- 2. ADD EVENT LISTENERS (Tu código - Sin cambios) ---
    function addEventListenersToButtons() {
        document.querySelectorAll('.details-btn').forEach(button => {
            button.addEventListener('click', (e) => showOrderDetails(e.target.dataset.id));
        });
        document.querySelectorAll('.change-status-btn').forEach(button => {
            button.addEventListener('click', (e) => updateOrderStatus(e.target.dataset.id, e.target.dataset.status));
        });
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', (e) => deleteOrder(e.target.dataset.id));
        });
    }
    
    // --- 3. UPDATE & DELETE FUNCTIONS (Tu código - Sin cambios) ---
    async function updateOrderStatus(orderId, currentStatus) {
        const newStatus = currentStatus === 'Pending' ? 'Completed' : 'Pending';
        if (confirm(`Change order status to "${newStatus}"?`)) {
            await db.collection('orders').doc(orderId).update({ status: newStatus });
            loadOrders();
        }
    }
    async function deleteOrder(orderId) {
        if (confirm('Are you sure you want to permanently delete this order?')) {
            await db.collection('orders').doc(orderId).delete();
            loadOrders();
        }
    }

    // --- 4. SHOW ORDER DETAILS MODAL ---
    async function showOrderDetails(orderId) {
        try {
            const doc = await db.collection('orders').doc(orderId).get();
            if (!doc.exists) return;
            const order = doc.data();

            // --- CAMBIO (4/4): Lógica añadida para la fecha de entrega en el modal ---
            const deliveryDateStr = order.deliveryDateTime 
                ? order.deliveryDateTime.toDate().toLocaleString() 
                : 'N/A';
            // --- Fin del código añadido ---

            let itemsHTML = '<h4>Items:</h4><div id="modal-items-list">';
            order.items.forEach(item => {
                const flavorsBreakdown = Object.entries(item.flavors)
                    .map(([flavor, qty]) => `<li>${qty}x ${flavor}</li>`).join('');
                itemsHTML += `
                    <div class="item">
                        <strong>${item.totalQuantity}x ${item.name} (${item.size})</strong>
                        <ul>${flavorsBreakdown}</ul>
                    </div>`;
            });
            itemsHTML += '</div>';

            // --- CÓDIGO NUEVO Y ESTRUCTURADO ---
            modalBody.innerHTML = `
                <div class="modal-section">
                    <p><strong>Order ID:</strong> <span>${doc.id}</span></p>
                    <p><strong>Customer:</strong> <span>${order.customerName}</span></p>
                    <p><strong>Email:</strong> <span>${order.customerEmail}</span></p>
                    <p><strong>Phone:</strong> <span>${order.customerPhone}</span></p>
                    <p><strong>Address:</strong> <span>${order.customerAddress}</span></p>
                    ${order.customerAddress2 ? `<p><strong>Apt/Suite:</strong> <span>${order.customerAddress2}</span></p>` : ''}
                    <p><strong>Date (Ordered):</strong> <span>${order.createdAt.toDate().toLocaleString()}</span></p>
                    
                    <p><strong>Delivery Date:</strong> <span>${deliveryDateStr}</span></p>
                </div>
                
                <div class="modal-section">
                    ${itemsHTML}
                </div>
            
                <div class="modal-total-summary">
                    <strong>Total:</strong>
                    <span>$${order.total.toFixed(2)}</span>
                </div>`;
            
            modal.classList.add('visible'); 
        } catch (error) {
            console.error("Error fetching order details:", error);
        }
    }

    // --- 5. MODAL CLOSE LOGIC (Tu código - Sin cambios) ---
    function closeModal() {
        modal.classList.remove('visible');
    }
    closeModalBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    
    // --- INITIAL LOAD ---
    loadOrders();
});