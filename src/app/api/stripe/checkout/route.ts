import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/stripe/client";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const stripe = getStripe();
    const { priceId } = await request.json();

    if (!priceId) {
      return NextResponse.json({ error: "Missing priceId" }, { status: 400 });
    }

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: session.user.id },
      select: { email: true, stripeCustomerId: true },
    });

    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: session.user.id },
      });
      customerId = customer.id;
      await prisma.user.update({
        where: { id: session.user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?success=subscription_active`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?canceled=true`,
      metadata: { userId: session.user.id },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch {
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
