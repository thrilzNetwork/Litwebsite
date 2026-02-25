const demoOrder = {
    customer: {
        firstName: "Alejandro",
        lastName: "Soria",
        phone: "+52 55 1234 5678",
        email: "alejandro@example.com"
    },
    delivery: {
        method: "Envio",
        address: {
            line1: "Calle Falsa 123",
            city: "CDMX",
            state: "CDMX",
            zip: "01000",
            country: "Mexico"
        }
    },
    items: [
        {
            productId: "prod_1",
            name: "Proteína Whey",
            variant: "Vainilla",
            qty: 2,
            unitPrice: 50.00,
            lineTotal: 100.00
        },
        {
            productId: "prod_2",
            name: "Creatina Monohidratada",
            variant: "Sin sabor",
            qty: 1,
            unitPrice: 30.00,
            lineTotal: 30.00
        }
    ],
    totals: {
        subtotal: 130.00,
        discount: 10.00,
        shipping: 5.00,
        tax: 0.00,
        total: 125.00,
        currency: "USD"
    },
    notes: "Dejar en caseta de vigilancia"
};

async function runTests() {
    console.log("🚀 Running Test: Create Order (POST /api/orders)");

    try {
        const createRes = await fetch("http://localhost:3000/api/orders", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(demoOrder)
        });

        const createData = await createRes.json();
        console.log("Create Response:", createData);

        if (!createData.orderId) {
            console.error("❌ Failed to create order.");
            return;
        }

        console.log("✅ Order created successfully.");
        console.log("WhatsApp Link:", createData.whatsappLink);

        // Give it a second
        await new Promise(r => setTimeout(r, 1000));

        // Test GET /api/orders (Protected Route)
        console.log("\n🚀 Running Test: List Orders (GET /api/orders) [Without Auth]");
        const getFailRes = await fetch("http://localhost:3000/api/orders");
        if (getFailRes.status === 401) {
            console.log("✅ Protected Route blocked access correctly (401).");
        } else {
            console.error("❌ Protected Route did not block access.");
        }

        console.log("\n🚀 Running Test: List Orders (GET /api/orders) [With Auth]");
        const headers = new Headers();
        headers.append('Authorization', 'Basic ' + Buffer.from('admin:litadmin2025').toString('base64'));

        const getSuccessRes = await fetch("http://localhost:3000/api/orders", { headers });
        const orders = await getSuccessRes.json();
        console.log("Fetched Orders count:", orders.length);
        if (orders.length > 0) {
            console.log("✅ Admin fetch successful.");
        }

        // Test PATCH status
        console.log("\n🚀 Running Test: Update Status (PATCH /api/orders/:id)");
        const patchRes = await fetch(`http://localhost:3000/api/orders/${createData.orderId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": headers.get("Authorization")
            },
            body: JSON.stringify({ status: "Pagado" })
        });

        const updatedOrder = await patchRes.json();
        if (updatedOrder.status === "Pagado") {
            console.log("✅ Status updated successfully to:", updatedOrder.status);
        } else {
            console.error("❌ Status update failed", updatedOrder);
        }

    } catch (err) {
        console.error("Test execution failed:", err);
    }
}

runTests();
