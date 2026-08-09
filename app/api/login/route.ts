import { NextResponse } from "next/server";
import crypto from "node:crypto";

const SALT = "::driver-crm";

export async function POST(req: Request) {
  let password = "";
  try {
    ({ password } = await req.json());
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const pw = process.env.CRM_PASSWORD;
  if (!pw || password !== pw) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const token = crypto.createHash("sha256").update(password + SALT).digest("hex");
  const res = NextResponse.json({ ok: true });
  res.cookies.set("crm_auth", token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 días
  });
  return res;
}
