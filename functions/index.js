// index.js (Firebase Cloud Function)

// 1. IMPORTANTE: Usamos la API v1 para compatibilidad con la sintaxis functions.firestore.document
const functions = require('firebase-functions/v1');
const nodemailer = require('nodemailer');
const admin = require('firebase-admin');

// Inicializa la app de admin para acceder a Firestore
admin.initializeApp();

// 1. Configuración del Transportador de Correo
// Las credenciales (user y pass) se leen directamente de las variables de entorno, 
// que configuraste usando 'firebase functions:config:set'.
const transporter = nodemailer.createTransport({
    // Utiliza el servicio de correo que configuraste (ej. 'gmail')
    service: 'gmail',
    auth: {
        // Corregido para usar process.env, resolviendo el error de migración
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASSWORD 
    }
});

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
            <h2 style="color: #6a1b9a;">📦 ¡Nuevo Pedido Cannolitaly Recibido!</h2>
            
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


// 2. FUNCIÓN PRINCIPAL: Se activa al crear un nuevo documento en la colección 'orders'
exports.onNewOrderCreate = functions.firestore
    .document('orders/{orderId}')
    .onCreate(async (snap, context) => {
        const orderData = snap.data();
        const orderId = context.params.orderId;
        
        // Verificación de datos
        if (!orderData || !orderData.total || !orderData.items) {
            console.error(`Order ${orderId} is incomplete. Aborting email send.`);
            return null;
        }

        // Extraer projectId del context (corregido)
        const projectId = context.projectId || 'cannoli-f1d4d';

        const emailHtml = buildOrderEmailHtml(orderData, orderId, projectId);

        const mailOptions = {
            from: 'Cannolitaly Orders <cannolitali@gmail.com>',
            to: 'cannolitali@gmail.com', // Tu email de negocio real
            subject: `🚨 NUEVO PEDIDO #${orderId} - ${orderData.customerName || 'Cliente'}`,
            html: emailHtml,
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log(`Email de notificación enviado con éxito para el pedido ${orderId}`);
            return null;
        } catch (error) {
            console.error(`Error al enviar el email para el pedido ${orderId}:`, error);
            return null;
        }
    });