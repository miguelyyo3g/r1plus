import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  // 1. Inicializamos Stripe y Supabase DENTRO de la función POST para que no rompa el Build en Vercel
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
    apiVersion: '2025-03-31.basil' as any,
  });

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_key'
  );

  const body = await req.text();
  const signature = headers().get('Stripe-Signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || 'whsec_dummy'
    );
  } catch (err: any) {
    console.error(`❌ Error verificando webhook de Stripe: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    // Recuperamos el ID directamente de la metadata inyectada en el pago
    const userId = session.metadata?.supabaseUserId;
    
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
    const priceId = lineItems.data[0]?.price?.id;

    if (userId && priceId) {
      let newPlan = 'free';
      if (priceId === process.env.STRIPE_PRICE_ID_EMPRESA || priceId === 'price_1UMVl8AT2HWOK4TeXKB7WisC') newPlan = 'empresa';
      if (priceId === process.env.STRIPE_PRICE_ID_PRO || priceId === 'price_1UMVokAT2HWOK4TepVgZJ6gZ') newPlan = 'empresa_pro';

      console.log(`✅ Pago completado: Actualizando usuario ${userId} al plan ${newPlan}`);

      // Actualizamos por ID (Infalible)
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ 
          plan: newPlan,
          stripe_customer_id: session.customer as string 
        })
        .eq('id', userId); 

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
  }

  return new NextResponse('Webhook procesado', { status: 200 });
}