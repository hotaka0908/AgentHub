import Stripe from 'stripe'

function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }
  return new Stripe(secretKey, {
    apiVersion: '2023-10-16',
    typescript: true,
  })
}

export async function createOrRetrieveCustomer(
  userId: string,
  email: string
): Promise<string> {
  const stripe = getStripeClient()
  const customer = await stripe.customers.create({
    email,
    metadata: {
      supabase_user_id: userId,
    },
  })
  return customer.id
}

export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  const stripe = getStripeClient()
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
  })
  return session.url!
}

export async function createUsageRecord(
  subscriptionItemId: string,
  quantity: number
): Promise<void> {
  const stripe = getStripeClient()
  await stripe.subscriptionItems.createUsageRecord(subscriptionItemId, {
    quantity,
    timestamp: Math.floor(Date.now() / 1000),
    action: 'increment',
  })
}
