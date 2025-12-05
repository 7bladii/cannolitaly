const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');

admin.initializeApp();

// --- CONFIGURACIÓN DE CORREOS ---
const ADMIN_EMAIL = 'cannolitali@gmail.com'; 
const SENDER_EMAIL = 'orders@cannolitaly.com'; 

// URL DEL LOGO (Enlace verificado de Firebase Storage)
const LOGO_URL = 'https://firebasestorage.googleapis.com/v0/b/cannoli-f1d4d.firebasestorage.app/o/logo.png?alt=media&token=d03e39ac-82a3-495b-9435-04357bd2bf02';

// COLOR DE FONDO (Igual al Website: Crema Suave)
const BG_COLOR = '#F9F4EF'; 

/**
 * HELPER: Construye la lista HTML de productos
 * Mantiene: Texto en NEGRITA (Bold) y color NEGRO.
 */
function buildItemsListHtml(items) {
  let itemsHTML = '';

  if (items && items.length > 0) {
    items.forEach(item => {
      
      let displayName = item.name;
      if (displayName && displayName.includes('Make your choice')) {
          displayName = 'Cannoli';
      }

      const flavorsBreakdown = Object.entries(item.flavors || {})
        .map(([flavor, qty]) => `<li style="margin-bottom: 5px;"><strong>${qty}x ${flavor}</strong></li>`).join('');

      itemsHTML += `
        <div style="border-bottom: 2px solid #eee; padding-bottom: 15px; margin-bottom: 15px;">
          <p style="margin: 0; font-size: 16px; color: #000;">
            <strong>${item.totalQuantity}x ${displayName} (${item.size})</strong>
          </p>
          <ul style="list-style-type: none; padding-left: 15px; margin-top: 5px; font-size: 14px; color: #000;">
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
 * VISTA CLIENTE
 * - Fondo color CREMA (#F9F4EF) igual que el website.
 * - Caja de detalles en BLANCO para resaltar.
 * - Logo al final + Instagram.
 */
function buildClientEmailBody(orderData, orderId, shortId) {
  const itemsListHtml = buildItemsListHtml(orderData.items);
  
  const deliveryDateStr = orderData.deliveryDateTime
    ? orderData.deliveryDateTime.toDate().toLocaleDateString('en-US')
    : 'Pending Confirmation';

  const logoHtml = LOGO_URL 
    ? `<div style="text-align:center; margin-top: 30px; margin-bottom: 15px;"><img src="${LOGO_URL}" alt="Cannolitaly Logo" style="width: 120px; height: auto;"></div>` 
    : '';

  return `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: ${BG_COLOR}; padding: 40px 10px;">
      
      <div style="max-width: 600px; margin: auto; padding: 40px 30px; border: 1px solid #e0e0e0; background-color: ${BG_COLOR}; border-radius: 8px; color: #333;">
        
        <h2 style="color: #6a1b9a; text-align: center; font-weight: 400; margin-bottom: 10px;">Grazie, ${orderData.customerName || 'Customer'}! 🇮🇹</h2>
        
        <div style="text-align: center; margin-bottom: 30px; margin-top: 20px;">
          <p style="font-size: 12px; color: #888; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1.5px;">Order Reference</p>
          <div style="display: inline-block; background-color: #ffffff; padding: 10px 20px; border-radius: 6px; border: 1px solid #ddd; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
              <span style="font-size: 22px; font-weight: 700; color: #333; letter-spacing: 3px;">#${shortId}</span>
          </div>
          <p style="font-size: 14px; color: #777; margin-top: 15px;">We have received your order.</p>
        </div>
        
        <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; margin-top: 10px; border: 1px solid #eaeaea;">
          <h3 style="border-bottom: 1px solid #eee; padding-bottom: 15px; margin-top: 0; font-size: 16px; text-transform: uppercase; letter-spacing: 1px; color: #555;">Your Selection</h3>
          
          ${itemsListHtml}
          
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 1.5em; font-weight: bold; color: #6a1b9a; text-align: right; margin: 0;">
            TOTAL: $${orderData.total ? orderData.total.toFixed(2) : '0.00'}
          </p>
        </div>

        <div style="text-align: center; margin-top: 40px; font-size: 14px; color: #777;">
          <p style="margin-bottom: 5px;">Expected Delivery:</p>
          <strong style="color: #333; font-size: 18px;">${deliveryDateStr}</strong>
          <p style="margin-top: 10px; font-size: 12px; color: #999;">
            You will receive another update when your order is out for delivery.
          </p>
        </div>

        ${logoHtml}

        <div style="text-align: center; margin-bottom: 30px;">
          <p style="font-size: 14px; color: #555; margin: 0;">
            Follow us on Instagram:<br>
            <a href="https://instagram.com/cannolitalyla" style="text-decoration: none; color: #E1306C; font-weight: bold; font-size: 16px;">
              @CannolitalyLA
            </a>
          </p>
        </div>

        <p style="text-align: center; margin-top: 30px; color: #bbb; font-size: 12px;">— The Cannolitaly Team —</p>
      </div>
    </div>
  `;
}

/**
 * VISTA ADMIN
 * Mantiene diseño técnico y limpio.
 */
function buildAdminEmailBody(orderData, orderId, projectId, shortId) {
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

  const logoHtml = LOGO_URL 
    ? `<div style="text-align:center; margin-bottom: 15px;"><img src="${LOGO_URL}" alt="Logo" style="width: 100px; height: auto;"></div>` 
    : '';

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 2px solid #6a1b9a; padding: 20px;">
      ${logoHtml}
      <h2 style="color: #6a1b9a; text-align: center;">🚨 NEW ORDER #${shortId}</h2>
      <p style="text-align: center; font-size: 11px; color: #999; margin-top:-10px;">Full ID: ${orderId}</p>
      
      <div style="background-color: #f3e5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
        <h3 style="margin-top: 0; color: #4a148c;">Customer Details (Shipping)</h3>
        <p><strong>Name:</strong> ${orderData.customerName || 'N/A'}</p>
        <p><strong>Phone:</strong> <a href="tel:${orderData.customerPhone}">${orderData.customerPhone || 'N/A'}</a></p>
        <p><strong>Email:</strong> ${orderData.customerEmail || 'N/A'}</p>
        <p><strong>Address:</strong><br> ${fullAddress || 'N/A'}</p>
        <p><strong>Order Date:</strong> ${orderDate}</p>
        <p><strong>Delivery Due:</strong> <span style="background-color: yellow; font-weight:bold; padding: 2px 5px;">${deliveryDateStr}</span></p>
      </div>

      <h3 style="border-bottom: 1px solid #ccc;">Items to Prepare:</h3>
      ${itemsListHtml}

      <p style="font-size: 1.2em; font-weight: bold; text-align: right; margin-top: 20px;">
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

// --- TRIGGER PRINCIPAL ---
exports.onNewOrderCreate = functions
  .firestore
  .document('orders/{orderId}')
  .onCreate(async (snap, context) => {

    const orderData = snap.data();
    const orderId = context.params.orderId;

    if (!orderData || !orderData.total || !orderData.items) {
      console.error(`Order ${orderId} missing data. Aborting.`);
      return null;
    }

    const projectId = context.projectId || 'cannoli-f1d4d'; 
    const mailRef = admin.firestore().collection('mail');
    const shortId = orderId.slice(-6).toUpperCase();

    try {
      // 1. EMAIL CLIENTE
      const clientHtml = buildClientEmailBody(orderData, orderId, shortId);
      await mailRef.add({
        to: orderData.customerEmail,
        message: {
          from: `Cannolitaly <${SENDER_EMAIL}>`, 
          subject: `Order Confirmed #${shortId} - Cannolitaly 🇮🇹`,
          html: clientHtml,
        }
      });
      console.log(`Email queued for Customer: ${orderData.customerEmail}`);

      // 2. EMAIL ADMIN
      const adminHtml = buildAdminEmailBody(orderData, orderId, projectId, shortId);
      await mailRef.add({
        to: ADMIN_EMAIL, 
        message: {
          from: `Cannolitaly Bot <${SENDER_EMAIL}>`, 
          subject: `📦 NEW ORDER: #${shortId} - $${orderData.total}`, 
          html: adminHtml,
        }
      });
      console.log(`Email queued for Admin: ${ADMIN_EMAIL}`);

    } catch (error) {
      console.error(`Error processing emails for order ${orderId}:`, error);
    }
    
    return null;
  });