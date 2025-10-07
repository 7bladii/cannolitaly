document.addEventListener('DOMContentLoaded', () => {
    if (typeof firebase === 'undefined') return;

    const db = firebase.firestore();
    const ordersTableBody = document.getElementById('orders-table-body');
    const modal = document.getElementById('order-detail-modal');
    const modalCloseBtn = document.querySelector('.modal-close');
    
    if (!ordersTableBody || !modal || !modalCloseBtn) {
        console.error("Essential elements for the orders page are missing.");
        return;
    }

    // --- 1. Fetch and Display Orders ---
    async function loadOrders() {
        ordersTableBody.innerHTML = '<tr><td colspan="7">Loading orders...</td></tr>';
        
        try {
            const snapshot = await db.collection('orders').orderBy('createdAt', 'desc').get();
            
            if (snapshot.empty) {
                ordersTableBody.innerHTML = '<tr><td colspan="7">No orders found.</td></tr>';
                return;
            }
            
            ordersTableBody.innerHTML = '';
            snapshot.forEach(doc => {
                const order = doc.data();
                const orderId = doc.id;
                
                const row = document.createElement('tr');
                // **KEY CHANGE**: Added phone/address and data-labels for mobile view
                row.innerHTML = `
                    <td data-label="Order ID">${orderId.substring(0, 8)}...</td>
                    <td data-label="Customer">${order.customerName}</td>
                    <td data-label="Phone">${order.customerPhone || 'N/A'}</td>
                    <td data-label="Address">${order.customerAddress || 'N/A'}</td>
                    <td data-label="Date">${new Date(order.createdAt.seconds * 1000).toLocaleDateString()}</td>
                    <td data-label="Total">$${order.total.toFixed(2)}</td>
                    <td data-label="Actions">
                        <span class="status status-${order.status.toLowerCase()}">${order.status}</span>
                        <button class="btn btn-secondary view-details-btn" data-id="${orderId}">Details</button>
                    </td>
                `;
                ordersTableBody.appendChild(row);
            });

            addDetailButtonListeners();

        } catch (error) {
            console.error("Error loading orders:", error);
            ordersTableBody.innerHTML = '<tr><td colspan="7">Error loading orders.</td></tr>';
        }
    }

    // --- 2. Show Order Details in a Modal ---
    function addDetailButtonListeners() {
        document.querySelectorAll('.view-details-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const orderId = e.target.dataset.id;
                await showOrderDetails(orderId);
            });
        });
    }

    async function showOrderDetails(orderId) {
        const doc = await db.collection('orders').doc(orderId).get();
        if (!doc.exists) return;

        const order = doc.data();
        
        document.getElementById('modal-order-id').textContent = orderId;
        document.getElementById('modal-customer-name').textContent = order.customerName;
        document.getElementById('modal-customer-email').textContent = order.customerEmail;
        // **KEY CHANGE**: Added phone and address to the modal
        document.getElementById('modal-customer-phone').textContent = order.customerPhone || 'Not provided';
        document.getElementById('modal-customer-address').textContent = order.customerAddress || 'Not provided';
        document.getElementById('modal-order-date').textContent = new Date(order.createdAt.seconds * 1000).toLocaleString();
        document.getElementById('modal-order-total').textContent = `$${order.total.toFixed(2)}`;
        
        const itemsList = document.getElementById('modal-order-items');
        itemsList.innerHTML = '';
        order.items.forEach(item => {
            const li = document.createElement('li');
            const flavors = item.flavors && item.flavors.length > 0 ? `(${item.flavors.join(', ')})` : '';
            li.textContent = `${item.quantity} x ${item.name} ${flavors} - $${(item.price * item.quantity).toFixed(2)}`;
            itemsList.appendChild(li);
        });

        modal.style.display = 'flex';
    }

    // --- 3. Close the Modal ---
    modalCloseBtn.onclick = () => {
        modal.style.display = 'none';
    };
    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };

    // Initial load
    loadOrders();
});