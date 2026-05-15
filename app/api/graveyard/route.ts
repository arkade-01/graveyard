import { getGraveyardData } from "@/app/lib/graveyard";

export async function GET() {
  try {
    const data = await getGraveyardData();
    return Response.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
