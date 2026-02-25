import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(req: NextRequest) {
    // Allow public access to POST /api/orders
    if (req.nextUrl.pathname === '/api/orders' && req.method === 'POST') {
        return NextResponse.next();
    }

    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
        return new NextResponse('Authentication required', {
            status: 401,
            headers: {
                'WWW-Authenticate': 'Basic realm="Secure Admin Panel"',
            },
        })
    }

    const authValue = authHeader.split(' ')[1]
    const [user, pwd] = atob(authValue).split(':')

    const validUser = process.env.ADMIN_USER || 'admin'
    const validPass = process.env.ADMIN_PASS || 'litadmin2025'

    if (user === validUser && pwd === validPass) {
        return NextResponse.next()
    }

    return new NextResponse('Invalid credentials', {
        status: 401,
        headers: {
            'WWW-Authenticate': 'Basic realm="Secure Admin Panel"',
        },
    })
}

export const config = {
    matcher: ['/admin/:path*', '/api/orders/:path*'],
}
