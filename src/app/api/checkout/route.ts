import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Aquí actualizamos la versión de la API a la que nos pide Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
  apiVersion: '2025-03-31.basil' as any, 
});

export async function POST(req: Request) {
  try {
    const { priceId, userEmail, userId } = await req.json();

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: priceId, 
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.get('origin')}/?success=true`,
      cancel_url: `${req.headers.get('origin')}/?canceled=true`,
      customer_email: userEmail,
      metadata: {
        supabaseUserId: userId,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}