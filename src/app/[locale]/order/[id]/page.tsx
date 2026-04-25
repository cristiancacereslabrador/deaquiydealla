import { setRequestLocale } from "next-intl/server";
import { OrderTrackingClient } from "@/components/order/order-tracking-client";

export default async function OrderTrackingPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  return (
    <main className="px-4 py-8 max-w-4xl mx-auto min-h-[calc(100vh-200px)] flex flex-col justify-center">
      <OrderTrackingClient orderId={id} />
    </main>
  );
}

export const dynamic = "force-dynamic";
