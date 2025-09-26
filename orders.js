document.addEventListener('DOMContentLoaded', function() {
    const db = firebase.firestore();
    const ordersList = document.getElementById('orders-list');

    db.collection('orders').onSnapshot(snapshot => {
        ordersList.innerHTML = '';
        snapshot.forEach(doc => {
            const order = doc.data();
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${doc.id}</td>
                <td>${order.customerName}</td>
                <td>$${order.total.toFixed(2)}</td>
                <td>${order.status}</td>
            `;
            ordersList.appendChild(row);
        });
    });
});