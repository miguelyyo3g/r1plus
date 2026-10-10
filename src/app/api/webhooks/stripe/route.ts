import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Aquí actualizamos también la versión de la API
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil' as any,
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get('Stripe-Signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error(`❌ Error verificando webhook de Stripe: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    const customerEmail = session.customer_details?.email;
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
    const priceId = lineItems.data[0]?.price?.id;

    if (customerEmail && priceId) {
      let newPlan = 'free';
      if (priceId === process.env.STRIPE_PRICE_ID_EMPRESA || priceId === 'price_1UMVl8AT2HWOK4TeXKB7WisC') newPlan = 'empresa';
      if (priceId === process.env.STRIPE_PRICE_ID_PRO || priceId === 'price_1UMVokAT2HWOK4TepVgZJ6gZ') newPlan = 'empresa_pro';

      console.log(`✅ Pago completado: Actualizando ${customerEmail} al plan ${newPlan}`);

      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ 
          plan: newPlan,
          stripe_customer_id: session.customer as string 
        })
        .eq('email', customerEmail);

      if (error) {
        console.error('❌ Error actualizando Supabase:', error.message);
        return new NextResponse('Error actualizando base de datos', { status: 500 });
      }
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription;
    const customerId = subscription.customer as string;

    await supabaseAdmin
      .from('profiles')
      .update({ plan: 'free' })
      .eq('stripe_customer_id', customerId);
      
    console.log(`📉 Suscripción cancelada: Cliente ${customerId} devuelto a Free`);
  }

  return new NextResponse('Webhook recibido y procesado', { status: 200 });
}