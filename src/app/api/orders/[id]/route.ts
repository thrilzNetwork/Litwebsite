import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();

        if (!body.status) {
            return NextResponse.json({ error: "Status is required" }, { status: 400 });
        }

        const updatedOrder = await prisma.order.update({
            where: { orderId: id },
            data: { status: body.status },
        });

        return NextResponse.json(updatedOrder);
    } catch (error) {
        console.error("Error updating order status:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
