import { NextResponse } from 'next/server'

// Force this API route to be treated as dynamic (cannot be statically prerendered)
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const pin = url.searchParams.get('pin')

    if (!pin) {
      return NextResponse.json({ error: 'Missing pin query parameter' }, { status: 400 })
    }

    // Fetch from the external postal API server-side to avoid CORS
    const resp = await fetch(`https://api.postalpincode.in/pincode/${encodeURIComponent(pin)}`, {
      method: 'GET',
      // Do not forward client headers that might cause issues
    })

    const data = await resp.json()

    return NextResponse.json(data, { status: resp.ok ? 200 : 502 })
  } catch (error) {
    console.error('Server proxy pincode error:', error)
    return NextResponse.json({ error: 'Failed to fetch pincode data' }, { status: 502 })
  }
}
