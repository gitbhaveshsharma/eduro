/**
 * API Route: Get Client IP Address
 * 
 * Returns the client's real IP address using middleware security utilities
 * 
 * @route GET /api/get-client-ip
 */

import { NextRequest, NextResponse } from 'next/server';
import { IPUtils } from '@/lib/middleware/security-utils';

export async function GET(request: NextRequest) {
    try {
        // Get real IP using security utilities
        const ip = IPUtils.getRealIP(request);
        
        return NextResponse.json({ 
            ip,
            success: true 
        });
    } catch (error) {
        console.error('Failed to get client IP:', error);
        return NextResponse.json(
            { 
                success: false,
                error: 'Failed to get IP address',
                ip: null
            },
            { status: 500 }
        );
    }
}
