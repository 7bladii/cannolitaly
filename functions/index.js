// index.js (Firebase Cloud Function)

// 1. IMPORT LIBRARIES
const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const sgMail = require('@sendgrid/mail');

// Initialize the admin app
admin.initializeApp();

// 2. SENDGRID CONFIGURATION
const SENDGRID_API_KEY = functions.config().sendgrid.key;
sgMail.setApiKey(SENDGRID_API_KEY);

// ✅ REMITENTE VERIFICADO: Usamos la dirección de Gmail verificada (la única funcional ahora)
const SEND_FROM_EMAIL = 'cannolitali@gmail.com'; 


/**
 * Helper Function to construct the HTML list of products
 */
function buildItemsListHtml(items) {
    let itemsHTML = '';
    
    if (items && items.length > 0) {
        items.forEach(item => {
            // Aseguramos que los nombres de los sabores se muestren correctamente
            const flavorsBreakdown = Object.entries(item.flavors || {})
                .map(([flavor, qty]) => `<li>${qty}x ${flavor}</li>`).join('');
                
            itemsHTML += `
                <div style="border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 10px;">
                    <p style="margin: 0;"><strong>${item.totalQuantity}x ${item.name} (${item.size})</strong></p>
                    <ul style="list-style-type: none; padding-left: 15px; font-size: 0.9em;">
                        ${flavorsBreakdown}
                    </ul>
                </div>
            `;
        });
    } else {
        itemsHTML = '<p>No product details found for this order.</p>';
    }
    return itemsHTML;
}

/**
 * FUNCIÓN PARA EL CLIENTE: Genera el cuerpo del email amigable, en inglés y SÓLO con la FECHA.
 */
function buildClientEmailBody(orderData, orderId) {
    
    // MODIFICADO: Formatea la fecha de entrega para mostrar solo la FECHA (toLocaleDateString)
    const deliveryDateStr = orderData.deliveryDateTime 
        ? orderData.deliveryDateTime.toDate().toLocaleDateString('en-US') 
        : 'N/A';
        
    const itemsListHtml = buildItemsListHtml(orderData.items);
    
    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0;">
            <h2 style="color: #6a1b9a;">Thank you for your order, ${orderData.customerName || 'Customer'}!</h2>
            
            <p>We have received your order and are processing it. Below is a summary of your purchase:</p>
            
            <h3 style="border-bottom: 2px solid #6a1b9a; padding-bottom: 5px; font-size: 1.1em;">Order Summary (#${orderId})</h3>
            
            <p><strong>Delivery Date:</strong> <strong>${deliveryDateStr}</strong></p>
            
            <h4 style="margin-top: 20px;">Items Ordered:</h4>
            ${itemsListHtml}
            
            <hr style="border: 0; border-top: 1px solid #ccc;">
            <p style="font-size: 1.2em; font-weight: bold; color: #6a1b9a;">
                TOTAL: $${orderData.total ? orderData.total.toFixed(2) : 'N/A'}
            </p>
            
            <p style="margin-top: 30px;">
                You will receive another notification when your order is out for delivery.
            </p>
            <p>— The Cannolitaly Team</p>
        </div>
    `;
}

/**
 * FUNCIÓN PARA EL ADMINISTRADOR: Genera el cuerpo del email DETALLADO (incluye la hora de entrega y el botón).
 */
function buildAdminEmailBody(orderData, orderId, projectId) {
    const itemsListHtml = buildItemsListHtml(orderData.items);
    
    // Mantiene la fecha Y HORA aquí porque el ADMIN la necesita
    const orderDate = orderData.createdAt 
        ? orderData.createdAt.toDate().toLocaleString('en-US') 
        : 'N/A';
    const deliveryDateStr = orderData.deliveryDateTime 
        ? orderData.deliveryDateTime.toDate().toLocaleString('en-US') 
        : 'N/A';
        
    const fullAddress = orderData.customerAddress2 
        ? `${orderData.customerAddress}, Apt/Suite: ${orderData.customerAddress2}` 
        : orderData.customerAddress;

    // Botón de Administrador 
    const adminButtonHTML = `
        <p style="text-align: center; margin-top: 20px;">
            <a href="https://console.firebase.google.com/project/${projectId}/firestore/data/~2Forders~2F${orderId}" 
                style="display: inline-block; padding: 10px 20px; background-color: #6a1b9a; color: white; text-decoration: none; border-radius: 5px;">
                    View in Admin Panel
            </a>
        </p>
    `;

    // Full HTML Email Structure
    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px;">
            <h2 style="color: #6a1b9a;">📦 New Cannolitaly Order</h2>
            
            <p>A new order has been placed on your website. Here are the details:</p>

            <h3 style="border-bottom: 2px solid #6a1b9a; padding-bottom: 5px;">Customer Details</h3>
            <p><strong>Order ID:</strong> ${orderId}</p>
            <p><strong>Customer Name:</strong> ${orderData.customerName || 'N/A'}</p>
            <p><strong>Phone:</strong> ${orderData.customerPhone || 'N/A'}</p>
            <p><strong>Email:</strong> ${orderData.customerEmail || 'N/A'}</p>
            <p><strong>Delivery Address:</strong> ${fullAddress || 'N/A'}</p>
            <p><strong>Date Ordered:</strong> ${orderDate}</p>
            <p><strong>Requested Delivery Date:</strong> <strong>${deliveryDateStr}</strong></p>

            <h3 style="border-bottom: 2px solid #6a1b9a; padding-bottom: 5px;">Items Ordered</h3>
            ${itemsListHtml}

            <hr style="border: 0; border-top: 1px dashed #ccc;">
            <p style="font-size: 1.2em; font-weight: bold; color: #6a1b9a;">
                TOTAL: $${orderData.total ? orderData.total.toFixed(2) : 'N/A'}
            </p>
            ${adminButtonHTML}
        </div>
    `;
}


// 3. MAIN FUNCTION: Triggers on new document creation in the 'orders' collection
exports.onNewOrderCreate = functions.firestore
    .document('orders/{orderId}')
    .onCreate(async (snap, context) => {
        const orderData = snap.data();
        const orderId = context.params.orderId;
        
        if (!orderData || !orderData.total || !orderData.items) {
            console.error(`Order ${orderId} is incomplete. Aborting email send.`);
            return null;
        }

        const projectId = context.projectId || 'cannoli-f1d4d';
        
        // USAMOS LA FUNCIÓN SIMPLE PARA EL CLIENTE
        const clientEmailHtml = buildClientEmailBody(orderData, orderId); 
        
        // USAMOS LA FUNCIÓN DETALLADA PARA EL ADMINISTRADOR
        const adminEmailHtml = buildAdminEmailBody(orderData, orderId, projectId);

        // --- 1. SEND TO CUSTOMER (Confirmation Email) ---
        const clientMsg = {
            to: orderData.customerEmail, 
            from: SEND_FROM_EMAIL, 
            subject: `✅ Order Confirmation: Your Cannolitaly Order #${orderId} Has Been Received`, 
            html: clientEmailHtml, // ¡ESTE ES EL HTML LIMPIO Y SÓLO CON LA FECHA!
        };

        // --- 2. SEND TO ADMINISTRATOR (Admin Notification) ---
        const adminMsg = {
            to: 'cannolitali@gmail.com', // Admin Email
            from: SEND_FROM_EMAIL, 
            subject: `🚨 ADMIN NOTIFICATION: New Order #${orderId}`,
            html: adminEmailHtml, // ¡ESTE ES EL HTML DETALLADO CON BOTÓN Y HORA!
        };

        try {
            await sgMail.send(clientMsg);
            console.log(`SendGrid confirmation email sent successfully to customer.`);
            await sgMail.send(adminMsg);
            console.log(`SendGrid notification email sent successfully to admin.`);
            return null;
        } catch (error) {
            console.error(`Error sending email with SendGrid for order ${orderId}:`, error); 
            if (error.response) {
                console.error("SendGrid Error Details:", error.response.body);
            }
            return null;
        }
    });