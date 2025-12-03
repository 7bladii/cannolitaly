const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');

admin.initializeApp();

// --- CONFIGURACIÓN DE CORREOS ---
// 1. Tu email personal donde recibirás los pedidos (Verificado en SendGrid)
const ADMIN_EMAIL = 'cannolitali@gmail.com'; 

// 2. El email profesional que verán tus clientes como remitente (Verificado en SendGrid)
const SENDER_EMAIL = 'orders@cannolitaly.com'; 

/**
 * HELPER: Construye la lista HTML de productos
 * Se usa para generar el resumen de lo que compraron.
 */
function buildItemsListHtml(items) {
  let itemsHTML = '';

  if (items && items.length > 0) {
    items.forEach(item => {
      // Desglose de sabores si existen
      const flavorsBreakdown = Object.entries(item.flavors || {})
        .map(([flavor, qty]) => `<li>${qty}x ${flavor}</li>`).join('');

      itemsHTML += `
        <div style="border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 10px;">
          <p style="margin: 0;"><strong>${item.totalQuantity}x ${item.name} (${item.size})</strong></p>
          <ul style="list-style-type: none; padding-left: 15px; font-size: 0.9em; color: #555;">
            ${flavorsBreakdown}
          </ul>
        </div>
      `;
    });
  } else {
    itemsHTML = '<p>No details found.</p>';
  }
  return itemsHTML;
}

/**
 * VISTA CLIENTE: Limpia y sencilla
 * Solo contiene: Confirmación, Lista de items, Total.
 * NO contiene: Dirección ni datos sensibles.
 */
function buildClientEmailBody(orderData, orderId) {
  const itemsListHtml = buildItemsListHtml(orderData.items);
  
  // Formatear fecha de entrega si existe
  const deliveryDateStr = orderData.deliveryDateTime
    ? orderData.deliveryDateTime.toDate().toLocaleDateString('en-US')
    : 'Pending Confirmation';

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; background-color: #fafafa;">
      <h2 style="color: #6a1b9a; text-align: center;">Grazie, ${orderData.customerName || 'Customer'}! 🇮🇹</h2>
      
      <p style="text-align: center; font-size: 1.1em;">
        We have received your order <strong>#${orderId}</strong>.
      </p>
      
      <div style="background-color: white; padding: 15px; border-radius: 5px; margin-top: 20px;">
        <h3 style="border-bottom: 2px solid #6a1b9a; padding-bottom: 5px; margin-top: 0;">Your Order</h3>
        ${itemsListHtml}
        
        <hr style="border: 0; border-top: 1px solid #ccc;">
        <p style="font-size: 1.3em; font-weight: bold; color: #6a1b9a; text-align: right;">
          TOTAL: $${orderData.total ? orderData.total.toFixed(2) : '0.00'}
        </p>
      </div>

      <p style="text-align: center; margin-top: 30px; font-size: 0.9em; color: #777;">
        Expected Delivery: <strong>${deliveryDateStr}</strong><br>
        You will receive another update when your order is out for delivery.
      </p>
      <p style="text-align: center;">— The Cannolitaly Team</p>
    </div>
  `;
}

/**
 * VISTA ADMIN: Completa con datos de envío
 * Contiene: Dirección, Teléfono, Email, Items, Link al panel.
 */
function buildAdminEmailBody(orderData, orderId, projectId) {
  const itemsListHtml = buildItemsListHtml(orderData.items);

  const orderDate = orderData.createdAt
    ? orderData.createdAt.toDate().toLocaleString('en-US')
    : 'N/A';
    
  const deliveryDateStr = orderData.deliveryDateTime
    ? orderData.deliveryDateTime.toDate().toLocaleString('en-US')
    : 'N/A';

  const fullAddress = orderData.customerAddress2
    ? `${orderData.customerAddress}, ${orderData.customerAddress2}`
    : orderData.customerAddress;

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 2px solid #6a1b9a; padding: 20px;">
      <h2 style="color: #6a1b9a; text-align: center;">🚨 NEW ORDER #${orderId}</h2>
      
      <div style="background-color: #f3e5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
        <h3 style="margin-top: 0; color: #4a148c;">Customer Details (Shipping)</h3>
        <p><strong>Name:</strong> ${orderData.customerName || 'N/A'}</p>
        <p><strong>Phone:</strong> <a href="tel:${orderData.customerPhone}">${orderData.customerPhone || 'N/A'}</a></p>
        <p><strong>Email:</strong> ${orderData.customerEmail || 'N/A'}</p>
        <p><strong>Address:</strong><br> ${fullAddress || 'N/A'}</p>
        <p><strong>Order Date:</strong> ${orderDate}</p>
        <p><strong>Delivery Due:</strong> <span style="background-color: yellow;">${deliveryDateStr}</span></p>
      </div>

      <h3 style="border-bottom: 1px solid #ccc;">Items to Prepare:</h3>
      ${itemsListHtml}

      <p style="font-size: 1.2em; font-weight: bold; text-align: right;">
        TOTAL VALUE: $${orderData.total ? orderData.total.toFixed(2) : '0.00'}
      </p>
      
      <p style="text-align: center; margin-top: 20px;">
        <a href="https://console.firebase.google.com/project/${projectId}/firestore/data/~2Forders~2F${orderId}" 
           style="background-color: #6a1b9a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
           Open in Firebase Console
        </a>
      </p>
    </div>
  `;
}

// --- FUNCIÓN PRINCIPAL (Trigger) ---
exports.onNewOrderCreate = functions
  .firestore
  .document('orders/{orderId}')
  .onCreate(async (snap, context) => {

    const orderData = snap.data();
    const orderId = context.params.orderId;

    // Validación básica: Si no hay datos o total, no enviamos nada.
    if (!orderData || !orderData.total || !orderData.items) {
      console.error(`Order ${orderId} missing data. Aborting.`);
      return null;
    }

    const projectId = context.projectId || 'cannoli-f1d4d'; 

    // Referencia a la colección 'mail' (Para activar la extensión Trigger Email)
    const mailRef = admin.firestore().collection('mail');

    try {
      // 1. PREPARAR EMAIL PARA EL CLIENTE (Recibo sin datos sensibles)
      const clientHtml = buildClientEmailBody(orderData, orderId);
      
      // 2. ENVIAR AL CLIENTE
      await mailRef.add({
        to: orderData.customerEmail,
        message: {
          from: `Cannolitaly <${SENDER_EMAIL}>`, // Se ve profesional: "Cannolitaly <orders@...>"
          subject: `✅ Order Received: Cannolitaly #${orderId}`,
          html: clientHtml,
        }
      });
      console.log(`Email queued for Customer: ${orderData.customerEmail}`);

      // 3. PREPARAR EMAIL PARA EL ADMIN (Con todos los detalles)
      const adminHtml = buildAdminEmailBody(orderData, orderId, projectId);
      
      // 4. ENVIAR AL ADMIN
      await mailRef.add({
        to: ADMIN_EMAIL, 
        message: {
          from: `Cannolitaly Bot <${SENDER_EMAIL}>`, 
          subject: `📦 NEW ORDER: #${orderId} - $${orderData.total}`, // El asunto incluye el precio para vista rápida
          html: adminHtml,
        }
      });
      console.log(`Email queued for Admin: ${ADMIN_EMAIL}`);

    } catch (error) {
      console.error(`Error processing emails for order ${orderId}:`, error);
    }
    
    return null;
  });