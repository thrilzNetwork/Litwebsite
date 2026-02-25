"use client";

import { useEffect, useState, useMemo } from "react";
import {
    ExternalLink,
    RefreshCw,
    LayoutDashboard,
    ShoppingBag,
    Users,
    TrendingUp,
    DollarSign,
    Package,
    Search,
    ChevronDown,
    MoreHorizontal,
    Bell,
    Menu,
    LogOut
} from "lucide-react";
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip
} from 'recharts';

type Order = {
    id: string;
    orderId: string;
    createdAt: string;
    status: string;
    firstName: string;
    lastName: string;
    phone: string;
    total: number;
    currency: string;
    whatsAppNumber: string;
    items: string;
};

const STATUS_OPTIONS = ["Nuevo", "Contactado", "Pagado", "Enviado", "Cancelado"];

export default function AdminDashboard() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("All");
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const url = filter === "All" ? "/api/orders" : `/api/orders?status=${filter}`;
            const res = await fetch(url);
            const data = await res.json();
            setOrders(data);
        } catch (error) {
            console.error("Failed to load orders", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [filter]);

    const updateStatus = async (orderId: string, newStatus: string) => {
        try {
            await fetch(`/api/orders/${orderId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
            fetchOrders();
        } catch (error) {
            console.error("Failed to update status", error);
        }
    };

    const getWhatsAppLink = (order: Order) => {
        const date = new Date(order.createdAt).toLocaleString("es-ES");
        const items = JSON.parse(order.items || "[]");
        let itemsText = "";
        items.forEach((item: any, i: number) => {
            itemsText += `${i + 1}) ${item.name} ${item.variant || ""}\n   ${item.qty} x ${item.unitPrice} = ${item.lineTotal}\n`;
        });

        const msg = `Hola ${order.firstName}, nos comunicamos de Laboratorios LIT en relación a tu pedido ${order.orderId}.\n\nResumen:\n${itemsText}\nTotal: ${order.total} ${order.currency}\n\n¿Podrías confirmarnos el pago?`;
        const clientNumber = order.phone.replace(/[\+\s]/g, "");
        return `https://wa.me/${clientNumber}?text=${encodeURIComponent(msg)}`;
    };

    // Metrics Calculation
    const metrics = useMemo(() => {
        const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
        const totalOrders = orders.length;
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        const pendingOrders = orders.filter(o => o.status === "Nuevo").length;

        return [
            { label: "Ventas Totales", value: `$${totalRevenue.toLocaleString()}`, change: "+12.5%", icon: DollarSign, color: "bg-emerald-50 text-emerald-600" },
            { label: "Pedidos Totales", value: totalOrders.toString(), change: "+5.2%", icon: ShoppingBag, color: "bg-blue-50 text-blue-600" },
            { label: "Ticket Promedio", value: `$${avgOrderValue.toFixed(2)}`, change: "-2.1%", icon: TrendingUp, color: "bg-purple-50 text-purple-600" },
            { label: "Pendientes", value: pendingOrders.toString(), change: "+3", icon: Package, color: "bg-amber-50 text-amber-600" },
        ];
    }, [orders]);

    // Chart Data Generation
    const chartData = useMemo(() => {
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return d.toISOString().split('T')[0];
        });

        return last7Days.map(date => {
            const dayOrders = orders.filter(o => o.createdAt.split('T')[0] === date);
            const revenue = dayOrders.reduce((sum, o) => sum + o.total, 0);
            return {
                name: date.split('-').slice(1).reverse().join('/'),
                revenue
            };
        });
    }, [orders]);

    return (
        <div className="min-h-screen bg-[#F8F9FA] flex font-sans">
            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-primary text-white transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:inset-0 shadow-xl`}>
                <div className="flex items-center gap-3 px-6 py-8 border-b border-white/10">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-primary font-bold overflow-hidden">
                        <img src="/next.svg" alt="LIT" className="w-5 h-5 invert" />
                    </div>
                    <span className="text-xl font-bold tracking-tight">LIT Lab</span>
                </div>

                <nav className="mt-8 px-4 space-y-2">
                    <a href="#" className="flex items-center gap-3 px-4 py-3 bg-white/10 rounded-xl text-white font-medium transition-all">
                        <LayoutDashboard size={20} />
                        Dashboard
                    </a>
                    <a href="#" className="flex items-center gap-3 px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                        <ShoppingBag size={20} />
                        Pedidos
                    </a>
                    <a href="#" className="flex items-center gap-3 px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                        <Users size={20} />
                        Clientes
                    </a>
                    <a href="#" className="flex items-center gap-3 px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                        <Package size={20} />
                        Inventario
                    </a>
                </nav>

                <div className="absolute bottom-8 left-0 w-full px-4">
                    <button className="flex items-center gap-3 w-full px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                        <LogOut size={20} />
                        Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                {/* Header */}
                <header className="bg-white border-b border-border sticky top-0 z-40 px-8 py-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden p-2 hover:bg-neutral-100 rounded-lg">
                            <Menu size={20} />
                        </button>
                        <h1 className="text-xl font-bold text-neutral-800">Panel de Control</h1>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="relative hidden md:block w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                            <input
                                type="text"
                                placeholder="Buscar pedidos..."
                                className="w-full pl-10 pr-4 py-2 bg-neutral-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                        </div>
                        <button className="p-2 text-neutral-500 hover:bg-neutral-100 rounded-lg relative">
                            <Bell size={20} />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>
                        <div className="flex items-center gap-3 pl-6 border-l border-neutral-200">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-semibold text-neutral-800">Admin LIT</p>
                                <p className="text-xs text-neutral-500">Administrator</p>
                            </div>
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                                AD
                            </div>
                        </div>
                    </div>
                </header>

                <div className="p-8 space-y-8">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {metrics.map((m, i) => (
                            <div key={i} className="bg-white p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow group">
                                <div className="flex justify-between items-start">
                                    <div className={`p-3 rounded-xl ${m.color}`}>
                                        <m.icon size={24} />
                                    </div>
                                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${m.change.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                        {m.change}
                                    </span>
                                </div>
                                <div className="mt-4">
                                    <h3 className="text-neutral-500 text-sm font-medium">{m.label}</h3>
                                    <p className="text-2xl font-bold text-neutral-800 mt-1">{m.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Chart Section */}
                    <div className="bg-white p-8 rounded-2xl border border-border shadow-sm">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h2 className="text-lg font-bold text-neutral-800">Rendimiento de Ventas</h2>
                                <p className="text-sm text-neutral-500">Ventas diarias en los últimos 7 días</p>
                            </div>
                            <button onClick={fetchOrders} className="p-2 text-neutral-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors">
                                <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                            </button>
                        </div>
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#31172e" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#31172e" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fill: '#888' }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fill: '#888' }}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#31172e"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorRevenue)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Data Table */}
                    <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h2 className="text-lg font-bold text-neutral-800">Pedidos Recientes</h2>
                                <p className="text-sm text-neutral-500">Gestión y estado de pedidos realizados</p>
                            </div>
                            <div className="flex gap-3 w-full sm:w-auto">
                                <select
                                    value={filter}
                                    onChange={(e) => setFilter(e.target.value)}
                                    className="flex-1 sm:w-48 bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer"
                                >
                                    <option value="All">Todos los estados</option>
                                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-neutral-50/50 border-b border-border">
                                        <th className="px-8 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Pedido / Fecha</th>
                                        <th className="px-8 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Cliente</th>
                                        <th className="px-8 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Total</th>
                                        <th className="px-8 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Estado</th>
                                        <th className="px-8 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {orders.map((order) => (
                                        <tr key={order.orderId} className="hover:bg-neutral-50/50 transition-colors group">
                                            <td className="px-8 py-5">
                                                <div className="font-bold text-neutral-800">{order.orderId}</div>
                                                <div className="text-neutral-400 text-xs mt-1">
                                                    {new Date(order.createdAt).toLocaleDateString("es-ES", { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="font-semibold text-neutral-800">
                                                    {order.firstName} {order.lastName}
                                                </div>
                                                <div className="text-neutral-400 text-xs mt-1 flex items-center gap-1">
                                                    {order.phone}
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="font-bold text-neutral-800">${order.total.toFixed(2)}</div>
                                                <div className="text-neutral-400 text-[10px] font-bold uppercase">{order.currency}</div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="relative inline-block">
                                                    <select
                                                        value={order.status}
                                                        onChange={(e) => updateStatus(order.orderId, e.target.value)}
                                                        className={`appearance-none text-xs px-4 py-1.5 rounded-full font-bold border-none cursor-pointer pr-10
                                                            ${order.status === 'Nuevo' ? 'bg-blue-100 text-blue-700' : ''}
                                                            ${order.status === 'Contactado' ? 'bg-purple-100 text-purple-700' : ''}
                                                            ${order.status === 'Pagado' ? 'bg-emerald-100 text-emerald-700' : ''}
                                                            ${order.status === 'Enviado' ? 'bg-amber-100 text-amber-700' : ''}
                                                            ${order.status === 'Cancelado' ? 'bg-red-100 text-red-700' : ''}
                                                        `}
                                                    >
                                                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                                    </select>
                                                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <a
                                                        href={getWhatsAppLink(order)}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="flex items-center gap-2 px-4 py-2 bg-[#25D366] hover:bg-[#1DA851] text-white text-xs font-bold rounded-xl transition-all shadow-sm hover:shadow-md"
                                                    >
                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                        WhatsApp
                                                    </a>
                                                    <button className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-neutral-600 transition-colors">
                                                        <MoreHorizontal size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {orders.length === 0 && !loading && (
                                        <tr>
                                            <td colSpan={5} className="px-8 py-20 text-center">
                                                <div className="flex flex-col items-center">
                                                    <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-300 mb-4">
                                                        <ShoppingBag size={32} />
                                                    </div>
                                                    <p className="text-neutral-500 font-medium">No se encontraron pedidos</p>
                                                    <p className="text-neutral-400 text-sm mt-1">Intenta cambiar el filtro o recargar la página</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="p-6 border-t border-border bg-neutral-50/50 flex justify-between items-center text-sm text-neutral-500">
                            <span>Mostrando {orders.length} pedidos</span>
                            <div className="flex gap-2">
                                <button className="px-4 py-2 bg-white border border-border rounded-xl font-medium hover:bg-neutral-100 disabled:opacity-50" disabled>Anterior</button>
                                <button className="px-4 py-2 bg-white border border-border rounded-xl font-medium hover:bg-neutral-100 disabled:opacity-50" disabled>Siguiente</button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

