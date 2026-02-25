import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SALES_WHATSAPP_NUMBER = process.env.SALES_WHATSAPP_NUMBER || "+15557089007";
const DEFAULT_CURRENCY = process.env.DEFAULT_CURRENCY || "USD";
const DEFAULT_SHIPPING_COST = parseFloat(process.env.DEFAULT_SHIPPING_COST || "5");

// Generate Order ID: LIT-YYYYMMDD-XXXX
function generateOrderId(): string {
    const date = new Date();
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const randomStr = Math.floor(1000 + Math.random() * 9000).toString();
    return `LIT-${yyyy}${mm}${dd}-${randomStr}`;
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Basic Validation
        if (!body.customer || !body.customer.phone) {
            return NextResponse.json({ error: "Customer phone is required" }, { status: 400 });
        }

        if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
            return NextResponse.json({ error: "Order must contain at least one item" }, { status: 400 });
        }

        if (typeof body.totals?.total !== "number") {
            return NextResponse.json({ error: "Valid total is required" }, { status: 400 });
        }

        const orderId = generateOrderId();
        const dateTime = new Date().toLocaleString("es-ES");

        // Defaulting missing values
        const orderData = {
            orderId,
            status: "Nuevo",
            firstName: body.customer.firstName || "N/A",
            lastName: body.customer.lastName || "N/A",
            phone: body.customer.phone,
            email: body.customer.email || null,
            deliveryMethod: body.delivery?.method || "Retiro",
            addressLine1: body.delivery?.address?.line1 || null,
            addressCity: body.delivery?.address?.city || null,
            addressState: body.delivery?.address?.state || null,
            addressZip: body.delivery?.address?.zip || null,
            addressCountry: body.delivery?.address?.country || null,
            items: JSON.stringify(body.items),
            subtotal: body.totals.subtotal || body.totals.total,
            discount: body.totals.discount || 0,
            shipping: body.totals.shipping || (body.delivery?.method === "Envio" ? DEFAULT_SHIPPING_COST : 0),
            tax: body.totals.tax || 0,
            total: body.totals.total,
            currency: body.totals.currency || DEFAULT_CURRENCY,
            coupon: body.coupon || null,
            notes: body.notes || null,
            whatsAppNumber: SALES_WHATSAPP_NUMBER,
        };

        const newOrder = await prisma.order.create({
            data: orderData,
        });

        // Formatting Items text
        let itemsText = "";
        body.items.forEach((item: any, index: number) => {
            itemsText += `${index + 1}) ${item.name} ${item.variant || ""}\n   ${item.qty} x ${item.unitPrice} = ${item.lineTotal}\n`;
        });

        // Generate accurate WhatsApp Message
        const message = `🧾 NUEVO PEDIDO – LIT
Pedido: ${orderId}
Fecha: ${dateTime}

Cliente: ${orderData.firstName} ${orderData.lastName}
Teléfono: ${orderData.phone}
Email: ${orderData.email || "N/A"}

Entrega: ${orderData.deliveryMethod}${orderData.deliveryMethod === "Envio" ? `\nDirección: ${orderData.addressLine1 || ""}, ${orderData.addressCity || ""}, ${orderData.addressState || ""}` : ""}

ITEMS:
${itemsText}
Subtotal: ${orderData.subtotal}
Descuento: ${orderData.discount}
Envío: ${orderData.shipping}
Impuestos: ${orderData.tax}
TOTAL: ${orderData.total} ${orderData.currency}

Notas: ${orderData.notes || "--"}

Por favor confirmar disponibilidad y método de pago.`;

        // Removing '+' and spaces from the phone number format
        const salesNumberClean = SALES_WHATSAPP_NUMBER.replace(/\+/g, "").replace(/ /g, "");
        const encodedMessage = encodeURIComponent(message);
        const whatsappLink = `https://wa.me/${salesNumberClean}?text=${encodedMessage}`;

        return NextResponse.json({
            orderId: newOrder.orderId,
            whatsappLink,
        });

    } catch (error: any) {
        console.error("Error creating order:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status");

        const orders = await prisma.order.findMany({
            where: status ? { status } : undefined,
            orderBy: { createdAt: "desc" },
            take: 100,
        });

        return NextResponse.json(orders);
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
