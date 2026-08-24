import { getCurrentUser } from "@/app/lib/auth";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return Response.json({ user: null });
  }

  return Response.json({
    user: {
      fullName: user.fullName,
    },
  });
}
