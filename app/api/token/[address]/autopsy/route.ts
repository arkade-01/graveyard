import { getAutopsyData } from "@/app/lib/autopsy";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params;
  try {
    const data = await getAutopsyData(address);
    return Response.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
