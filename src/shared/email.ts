import { Resend } from 'resend';
import { env } from '../config/env';

const resend = new Resend(env.RESEND_API_KEY);

interface SendOrderNotificationInput {
  orderId: string;
  pointOfSaleName: string;
  customerFirstName: string;
  customerLastName: string;
  customerPhone: string;
  items: Array<{
    productNameSnapshot: string;
    colorNameSnapshot: string;
    sizeNameSnapshot: string;
    quantity: number;
    unitPriceSnapshot: number;
  }>;
  total: number;
  notes?: string | null;
}

export async function sendOrderNotification(input: SendOrderNotificationInput) {
  const {
    orderId,
    pointOfSaleName,
    customerFirstName,
    customerLastName,
    customerPhone,
    items,
    total,
    notes,
  } = input;

  const itemList = items
    .map(
      (item) =>
        `- ${item.productNameSnapshot} (${item.colorNameSnapshot} / ${item.sizeNameSnapshot}) x${item.quantity} - $${item.unitPriceSnapshot}`
    )
    .join('\n');

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a1a1a;">Nueva orden en ${pointOfSaleName}</h2>
      <p style="color: #666;">Pedido <strong>#${orderId.slice(0, 8)}</strong></p>

      <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <h3 style="margin: 0 0 8px 0; color: #1a1a1a;">Cliente</h3>
        <p style="margin: 0; color: #333;">${customerFirstName} ${customerLastName}</p>
        <p style="margin: 4px 0 0 0; color: #333;">${customerPhone}</p>
      </div>

      <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <h3 style="margin: 0 0 8px 0; color: #1a1a1a;">Items</h3>
        <pre style="margin: 0; white-space: pre-wrap; color: #333;">${itemList}</pre>
      </div>

      <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <h3 style="margin: 0; color: #1a1a1a;">Total: $${total}</h3>
      </div>

      ${notes ? `<p style="color: #666;"><strong>Notas:</strong> ${notes}</p>` : ''}

      <a href="https://ironthreads-frontend.vercel.app/ventas/puntos-de-venta"
         style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 16px;">
        Ver en el panel
      </a>
    </div>
  `;

  await resend.emails.send({
    from: 'Iron Catalog <notificaciones@ironthreads.com.ar>',
    to: env.NOTIFICATION_EMAIL,
    subject: `Nueva orden en ${pointOfSaleName} - $${total}`,
    html,
  });
}
