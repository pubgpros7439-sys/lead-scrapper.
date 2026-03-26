import { NextResponse } from "next/server";
import { scrapeGoogleMaps } from "@/lib/scraper";

export async function POST(request: Request) {
  try {
    const { city, niche } = await request.json();

    if (!city || !niche) {
      return NextResponse.json(
        { error: "City and Niche are required" },
        { status: 400 }
      );
    }

    // Call the custom scraper (no API key needed!)
    const leads = await scrapeGoogleMaps(city, niche);

    if (leads.length === 0) {
      return NextResponse.json({ 
        leads: [],
        message: "No leads found matching criteria in this area." 
      });
    }

    return NextResponse.json({ leads });
  } catch (error) {
    console.error("Scrape Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
