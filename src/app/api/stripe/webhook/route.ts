import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe/client";

export async function POST(request: Request) {
  const stripe = getStripe();
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET ?? ""
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        if (userId && session.subscription) {
          await prisma.user.update({
            where: { id: userId },
            data: {
              plan: "PRO",
              stripeSubscriptionId: session.subscription as string,
              paymentFailed: false,
            },
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const user = await prisma.user.findFirst({
          where: { stripeSubscriptionId: subscription.id },
        });
        if (user) {
          const isActive = ["active", "trialing"].includes(subscription.status);
          await prisma.user.update({
            where: { id: user.id },
            data: {
              plan: isActive ? "PRO" : "FREE",
              paymentFailed: subscription.status === "past_due",
            },
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const user = await prisma.user.findFirst({
          where: { stripeSubscriptionId: subscription.id },
        });
        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              plan: "FREE",
              stripeSubscriptionId: null,
              paymentFailed: false,
            },
          });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as unknown as Record<string, unknown>;
        const subId = invoice.subscription as string | null;
        if (subId) {
          const user = await prisma.user.findFirst({
            where: { stripeSubscriptionId: subId },
          });
          if (user) {
            await prisma.user.update({
              where: { id: user.id },
              data: { paymentFailed: true },
            });
          }
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as unknown as Record<string, unknown>;
        const subId = invoice.subscription as string | null;
        if (subId) {
          const user = await prisma.user.findFirst({
            where: { stripeSubscriptionId: subId },
          });
          if (user) {
            await prisma.user.update({
              where: { id: user.id },
              data: { paymentFailed: false },
            });
          }
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
