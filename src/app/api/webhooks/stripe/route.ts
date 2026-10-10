import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
<<<<<<< HEAD
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
    apiVersion: '2025-03-31.basil' as any,
  });

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_key'
  );

  const body = await req.text();
  
  // EL FIX CLAVE: Leemos la firma directamente de 'req', sin usar next/headers
  const signature = req.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

=======
>>>>>>> deploy-v2
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
      apiVersion: '2025-03-31.basil' as any,
    });

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co',
      process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_key'
    );

<<<<<<< HEAD
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    // Recuperamos el ID directamente de la metadata
    const userId = session.metadata?.supabaseUserId;
    
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
    const priceId = lineItems.data[0]?.price?.id;
=======
    const body = await req.text();
    const signature = req.headers.get('stripe-signature') as string;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET || 'whsec_dummy'
      );
    } catch (err: any) {
      return new NextResponse(`Fallo de Firma Webhook: ${err.message}`, { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.supabaseUserId;
      
      if (!userId) {
         // Si por lo que sea no hay userId, avisamos a Stripe para que no reintente a lo tonto
         return new NextResponse('No hay userId en metadata', { status: 200 }); 
      }

      const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
      const priceId = lineItems.data[0]?.price?.id;
>>>>>>> deploy-v2

      let newPlan = 'free';
      if (priceId === process.env.STRIPE_PRICE_ID_EMPRESA || priceId === 'price_1UMVl8AT2HWOK4TeXKB7WisC') newPlan = 'empresa';
      if (priceId === process.env.STRIPE_PRICE_ID_PRO || priceId === 'price_1UMVokAT2HWOK4TepVgZJ6gZ') newPlan = 'empresa_pro';

<<<<<<< HEAD
      console.log(`✅ Pago completado: Actualizando usuario ${userId} al plan ${newPlan}`);

=======
      // Intentamos actualizar Supabase
>>>>>>> deploy-v2
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ 
          plan: newPlan,
          stripe_customer_id: session.customer as string 
        })
        .eq('id', userId); 

      if (error) {
        // AQUÍ ESTÁ LA TRAMPA: Le mandamos el error real de Supabase a Stripe
        return new NextResponse(`Error interno de Supabase: ${error.message}`, { status: 500 });
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

    return new NextResponse('Webhook procesado con éxito', { status: 200 });

  } catch (globalError: any) {
    // Si el error salta en cualquier otra línea rara, lo capturamos aquí
    return new NextResponse(`Fallo catastrófico (Global): ${globalError.message}`, { status: 500 });
  }
}