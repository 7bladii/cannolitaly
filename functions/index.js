const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');

// --- 1. CONFIGURACIÓN E INICIALIZACIÓN ---
require('dotenv').config(); 

const cors = require('cors')({ origin: true });

admin.initializeApp();

const stripe = require('stripe')(process.env.STRIPE_SECRET);

// NOTA: Necesitas poner esto en tu .env después. 
// Si pruebas en local con "stripe listen", te dará un secreto que empieza por whsec_...
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET; 

// --- 2. CONSTANTES GLOBALES (Correos y Diseño) ---
const ADMIN_EMAIL = 'cannolitali@gmail.com'; 
const SENDER_EMAIL = 'orders@cannolitaly.com'; 
const LOGO_URL = 'https://firebasestorage.googleapis.com/v0/b/cannoli-f1d4d.firebasestorage.app/o/logo.png?alt=media&token=d03e39ac-82a3-495b-9435-04357bd2bf02';
const BG_COLOR = '#F9F4EF'; 

// --- 3. HELPERS (Funciones de ayuda para HTML) ---

function buildItemsListHtml(items) {
  let itemsHTML = '';

  if (items && items.length > 0) {
    items.forEach(item => {
      let displayName = item.name;
      if (displayName && displayName.includes('Make your choice')) {
          displayName = 'Cannoli';
      }

      // Manejo seguro de sabores (si vienen de Stripe metadata pueden variar un poco)
      let flavorsBreakdown = '';
      if(item.flavors) {
          flavorsBreakdown = Object.entries(item.flavors || {})
            .map(([flavor, qty]) => `<li style="margin-bottom: 5px;"><strong>${qty}x ${flavor}</strong></li>`)
            .join('');
      }

      itemsHTML += `
        <div style="border-bottom: 2px solid #eee; padding-bottom: 15px; margin-bottom: 15px;">
          <p style="margin: 0; font-size: 16px; color: #000;">
            <strong>${item.quantity || item.totalQuantity}x ${displayName} (${item.size || 'Regular'})</strong>
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

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 2px solid #6a1b9a; padding: 20px;">
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

// --- 4. CLOUD FUNCTIONS EXPORTADAS ---

// TRIGGER A: Enviar correos cuando se crea una orden en Firestore
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
      // Email Cliente
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

      // Email Admin
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

// TRIGGER B: Crear Sesión de Pago en Stripe (Incluye PROPINAS + DATOS WEBHOOK)
exports.createStripeSession = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(400).send("Please send a POST request");
    }

    try {
      const { items, tipAmount = 0 } = req.body;

      // 1. Preparar items para la página de Stripe (Visual)
      const lineItems = items.map(item => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${item.name} (${item.size})`,
            description: 'Freshly filled Sicilian Cannoli', 
          },
          unit_amount: Math.round(Number(item.price) * 100),
        },
        quantity: item.quantity,
      }));

      if (tipAmount && Number(tipAmount) > 0) {
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Tip for the Team 💖', 
              description: 'Thank you for your support!',
            },
            unit_amount: Math.round(Number(tipAmount) * 100), 
          },
          quantity: 1,
        });
      }

      // 2. Preparar METADATA (Esto es CRUCIAL para que el Webhook sepa qué compraron)
      // Guardamos la info del carrito en un JSON string para recuperarla después del pago
      const simplifiedItems = items.map(i => ({
          name: i.name,
          size: i.size,
          quantity: i.quantity,
          flavors: i.flavors || {} 
      }));

      // Detecta automáticamente si estás en localhost o en la web real
      const origin = req.headers.origin || 'https://cannolitaly.com';

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: lineItems,
        mode: "payment",
        success_url: `${origin}/success.html`, 
        cancel_url: `${origin}/checkout.html`,
        
        // ⚠️ IMPORTANTE: Pedir datos de envío y teléfono a Stripe para guardarlos en DB
        phone_number_collection: { enabled: true },
        shipping_address_collection: { allowed_countries: ['US'] },

        // ⚠️ IMPORTANTE: Pasamos los items "escondidos" en metadata para leerlos luego
        metadata: {
            cartItems: JSON.stringify(simplifiedItems),
            tipAmount: tipAmount.toString()
        }
      });

      res.status(200).json({ url: session.url });

    } catch (error) {
      console.error("Error creating Stripe session:", error);
      res.status(500).json({ error: error.message });
    }
  });
});

// TRIGGER C: WEBHOOK DE STRIPE (¡NUEVO!)
// Esta función escucha cuando Stripe dice "¡Pago completado!" y guarda la orden en DB.
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        // Verifica que el evento sea realmente de Stripe (Seguridad)
        // Nota: Si aún no tienes STRIPE_WEBHOOK_SECRET en .env, esto fallará en producción.
        // Para probar en local, usa el secreto que te da "stripe listen".
        event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error(`Webhook Signature Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Solo nos interesa cuando el pago se ha completado
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;

        console.log('💰 Payment received! Saving order to Firestore...');

        try {
            // Recuperamos los datos del cliente que Stripe recolectó
            const customerEmail = session.customer_details.email;
            const customerName = session.customer_details.name;
            const customerPhone = session.customer_details.phone || 'N/A';
            const address = session.shipping_details ? session.shipping_details.address : {};
            
            // Recuperamos los items que escondimos en metadata
            const items = JSON.parse(session.metadata.cartItems || '[]');
            const totalPaid = session.amount_total / 100; // Stripe viene en centavos

            // Creamos el objeto de orden para guardar en Firebase
            const newOrder = {
                customerName: customerName,
                customerEmail: customerEmail,
                customerPhone: customerPhone,
                customerAddress: address.line1 || 'N/A',
                customerAddress2: `${address.city}, ${address.state} ${address.postal_code}`,
                items: items,
                total: totalPaid,
                status: 'paid',
                paymentId: session.id,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                deliveryDateTime: admin.firestore.FieldValue.serverTimestamp() // OJO: Aquí podrías ajustar si necesitas fecha específica
            };

            // GUARDAR EN FIRESTORE -> ESTO DISPARA EL EMAIL (Trigger A)
            await admin.firestore().collection('orders').add(newOrder);
            console.log('✅ Order saved successfully.');

        } catch (error) {
            console.error('Error saving order from Webhook:', error);
            return res.status(500).send('Internal Server Error');
        }
    }

    res.status(200).send({ received: true });
});