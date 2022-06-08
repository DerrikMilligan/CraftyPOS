import { NextResponse, NextMiddleware } from 'next/server';

export const middleware: NextMiddleware = async (req, ev) => {
  const { pathname } = req.nextUrl;

  if (pathname === '/inventory') {
    const url = req.nextUrl.clone();
    url.pathname = '/inventory/1';

    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}