// index.js (Firebase Cloud Function)

// 1. IMPORTAR LIBRERÍAS
const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const sgMail = require('@sendgrid/mail');

// Inicializa la app de admin
admin.initializeApp();

// 2. CONFIGURACIÓN DE SENDGRID
// NOTA: La clave API debe estar configurada en Firebase config con el nombre 'sendgrid.key'
const SENDGRID_API_KEY = functions.config().sendgrid.key;
sgMail.setApiKey(SENDGRID_API_KEY);

// ⚠️ CAMBIA ESTA DIRECCIÓN por la que usaste para autenticar tu dominio en SendGrid
const SEND_FROM_EMAIL = 'orders@cannolitaly.com'; 


/**
 * Función Helper para construir el HTML del correo
 * @param {Object} orderData - Los datos del pedido de Firestore
 * @param {string} orderId - El ID del documento
 * @param {string} projectId - ID del proyecto para el link al panel
 * @returns {string} El contenido HTML del correo
 */
function buildOrderEmailHtml(orderData, orderId, projectId) {
    let itemsHTML = '';
    
    // Genera el listado de productos y sabores
    if (orderData.items && orderData.items.length > 0) {
        orderData.items.forEach(item => {
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
        itemsHTML = '<p>No se encontraron detalles de productos en el pedido.</p>';
    }

    // Formato de fechas y dirección
    const orderDate = orderData.createdAt 
        ? orderData.createdAt.toDate().toLocaleString('es-ES') 
        : 'N/A';
    const deliveryDateStr = orderData.deliveryDateTime 
        ? orderData.deliveryDateTime.toDate().toLocaleString('es-ES') 
        : 'N/A';
        
    const fullAddress = orderData.customerAddress2 
        ? `${orderData.customerAddress}, Apt/Suite: ${orderData.customerAddress2}` 
        : orderData.customerAddress;

    // Estructura completa del correo HTML
    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px;">
            <h2 style="color: #6a1b9a;">📦 Nuevo Pedido Cannolitaly</h2>
            
            <p>Se ha realizado un nuevo pedido en tu sitio web. A continuación, se detallan los datos:</p>

            <h3 style="border-bottom: 2px solid #6a1b9a; padding-bottom: 5px;">Detalles del Cliente</h3>
            <p><strong>ID del Pedido:</strong> ${orderId}</p>
            <p><strong>Nombre:</strong> ${orderData.customerName || 'N/A'}</p>
            <p><strong>Teléfono:</strong> ${orderData.customerPhone || 'N/A'}</p>
            <p><strong>Email:</strong> ${orderData.customerEmail || 'N/A'}</p>
            <p><strong>Dirección de Entrega:</strong> ${fullAddress || 'N/A'}</p>
            <p><strong>Fecha de Pedido:</strong> ${orderDate}</p>
            <p><strong>Fecha/Hora de Entrega Solicitada:</strong> <strong>${deliveryDateStr}</strong></p>

            <h3 style="border-bottom: 2px solid #6a1b9a; padding-bottom: 5px;">Productos Ordenados</h3>
            ${itemsHTML}

            <hr style="border: 0; border-top: 1px dashed #ccc;">
            <p style="font-size: 1.2em; font-weight: bold; color: #6a1b9a;">
                TOTAL DEL PEDIDO: $${orderData.total ? orderData.total.toFixed(2) : 'N/A'}
            </p>
            <p style="text-align: center; margin-top: 20px;">
                <a href="https://console.firebase.google.com/project/${projectId}/firestore/data/~2Forders~2F${orderId}" 
                    style="display: inline-block; padding: 10px 20px; background-color: #6a1b9a; color: white; text-decoration: none; border-radius: 5px;">
                    Ver en el Panel de Administración
                </a>
            </p>
        </div>
    `;
}


// 3. FUNCIÓN PRINCIPAL: Se activa al crear un nuevo documento en la colección 'orders'
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
        const emailHtml = buildOrderEmailHtml(orderData, orderId, projectId);
        
        // --- 1. ENVIAR AL CLIENTE (Confirma el pedido) ---
        const clientMsg = {
            to: orderData.customerEmail, // Envía al cliente
            from: SEND_FROM_EMAIL, // Desde tu dominio autenticado (alta entregabilidad)
            subject: `✅ Confirmación: Tu Pedido #${orderId} de Cannolitaly ha sido recibido`,
            html: `
                <h2>Gracias por tu pedido, ${orderData.customerName || 'Cliente'}!</h2>
                <p>Hemos recibido tu orden y la estamos procesando. Nos pondremos en contacto pronto con más detalles sobre tu entrega.</p>
                ${emailHtml}
            `,
        };

        // --- 2. ENVIAR AL ADMINISTRADOR (Notificación) ---
        const adminMsg = {
            to: 'cannolitali@gmail.com', // Envía a tu correo de negocio
            from: SEND_FROM_EMAIL,
            subject: `🚨 NOTIFICACIÓN ADMIN: Nuevo Pedido #${orderId} - ${orderData.customerName || 'Cliente'}`,
            html: emailHtml,
        };

        try {
            await sgMail.send(clientMsg);
            console.log(`Email de confirmación SendGrid enviado con éxito al cliente.`);
            await sgMail.send(adminMsg);
            console.log(`Email de notificación SendGrid enviado al administrador.`);
            return null;
        } catch (error) {
            console.error(`Error al enviar el email con SendGrid para el pedido ${orderId}:`, error);
            if (error.response) {
                // Esto es útil para debuggear si hay problemas con la clave API
                console.error(error.response.body);
            }
            return null;
        }
    });