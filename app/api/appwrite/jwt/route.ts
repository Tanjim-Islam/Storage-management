import { NextResponse } from "next/server";

import { createSessionClient } from "@/lib/appwrite";

export async function GET() {
  try {
    const { account } = await createSessionClient();
    const jwt = await account.createJWT();

    return NextResponse.json({ jwt: jwt.jwt, expireAt: jwt.expireAt });
  } catch (error) {
    console.error("Failed to create Appwrite JWT", error);
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
  }
}
