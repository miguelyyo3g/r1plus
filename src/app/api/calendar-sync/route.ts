// @ts-nocheck
/* eslint-disable */
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL requerida' }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; R1PlusCalendarSync/1.0)',
      },
      cache: 'no-store'
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Error al contactar con Google Calendar' }, { status: res.status });
    }

    const data = await res.text();
    return new NextResponse(data, {
      status: 200,
      headers: { 'Content-Type': 'text/calendar; charset=utf-8' }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}