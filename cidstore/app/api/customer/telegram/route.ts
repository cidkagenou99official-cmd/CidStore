import { NextResponse } from "next/server";

export async function PATCH() {
  return NextResponse.json(
    { error: "Telegram can only be linked through the official bot." },
    { status: 410 },
  );
}
