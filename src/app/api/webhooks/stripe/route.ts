import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
  apiVersion: '2023-10-16' as any,
});
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy' // Clave de servicio para permisos de escritura admin
);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET || 'whsec_dummy');
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Cuando el pago de la suscripción se completa con éxito
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.supabaseUserId;
    const customerId = session.customer as string;

    if (userId) {
      // Actualizamos el perfil en Supabase indicando que es pro y guardando su cliente de Stripe
      await supabase
        .from('profiles')
        .update({
          subscription_status: 'active',
          stripe_customer_id: customerId,
          role: 'buyer' // o el nivel correspondiente según el plan adquirido
        })
        .eq('id', userId);
    }
  }

  return NextResponse.json({ received: true });
}