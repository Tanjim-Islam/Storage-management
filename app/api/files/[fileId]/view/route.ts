import { NextRequest, NextResponse } from "next/server";
import { authorizeFileAccess, buildAppwriteUrl } from "../helpers";

export const GET = async (
  request: NextRequest,
  { params }: { params: { fileId: string } },
) => {
  const token = request.nextUrl.searchParams.get("token");
  const result = await authorizeFileAccess(params.fileId, token);

  if (!result.authorized) {
    const status = result.status ?? 403;
    return NextResponse.json(
      { error: result.message ?? "Unauthorized" },
      { status },
    );
  }

  const url = buildAppwriteUrl(params.fileId, "view");
  return NextResponse.redirect(url);
};
