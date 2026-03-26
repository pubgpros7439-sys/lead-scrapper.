import puppeteer from "puppeteer";
import puppeteerCore from "puppeteer-core";
import { BusinessLead } from "../types";

export async function scrapeGoogleMaps(city: string, niche: string): Promise<BusinessLead[]> {
  const browserServicesUrl = process.env.BROWSER_SERVICES_URL;
  let browser;

  if (browserServicesUrl) {
    console.log("Connecting to remote browser service...");
    browser = await puppeteerCore.connect({
      browserWSEndpoint: browserServicesUrl,
    });
  } else {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }

  const page: any = await browser.newPage();
  
  // Set a realistic user agent
  await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36");

  // Set a realistic viewport
  await page.setViewport({ width: 1280, height: 800 });

  const query = encodeURIComponent(`${niche} in ${city}, USA`);
  const url = `https://www.google.com/maps/search/${query}`;

  try {
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    // Wait for the results list to load - try multiple possible selectors
    const feedSelector = "div[role='feed'], div[role='main'], .m67q60eb6v3";
    await page.waitForSelector('div[role="article"], .hfpxzc', { timeout: 15000 }).catch(() => null);

    // Auto-scroll to load about 40-60 results
    await page.evaluate(async () => {
      const feed = document.querySelector('div[role="feed"]') || 
                   document.querySelector('div[aria-label^="Results for"]') ||
                   document.querySelectorAll('div.m67q60eb6v3')[1] ||
                   document.querySelector('.ecceSd + .ecceSd');
      
      if (!feed) {
        console.log("Feed container not found for scrolling");
        return;
      }

      let lastHeight = 0;
      let scrollCount = 0;
      const maxScrolls = 20; // Increased scrolls to reach deeper into the results

      while (scrollCount < maxScrolls) {
        feed.scrollBy(0, 500); // Smaller scroll increments to trigger lazy loading better
        await new Promise((resolve) => setTimeout(resolve, 1500));
        
        let currentHeight = feed.scrollHeight;
        if (currentHeight === lastHeight && scrollCount > 5) break; // Only break early if we haven't found much more
        lastHeight = currentHeight;
        scrollCount++;
      }
    }, feedSelector);

    // Final wait for data to populate
    await new Promise(r => setTimeout(r, 2000));

    // Extract leads
    const rawLeads = await page.evaluate(() => {
      const results: any[] = [];
      const items = document.querySelectorAll('div[role="article"]');

      items.forEach((container) => {
        try {
          const nameElement = container.querySelector('.qBF1Pd, .fontHeadlineSmall');
          const name = nameElement?.textContent?.trim() || "N/A";
          if (name === "N/A") return;

          const id = btoa(unescape(encodeURIComponent(name))).substring(0, 16);

          // --- EXHAUSTIVE DATA EXTRACTION ---
          const allArias = Array.from(container.querySelectorAll('[aria-label]'))
                            .map(el => el.getAttribute('aria-label'))
                            .join(" ");
          const innerText = (container as HTMLElement).innerText || "";
          const everything = (allArias + " " + innerText).replace(/\n/g, " ");

          // 1. Rating
          let rating = 0;
          const rMatch = everything.match(/([\d.]+)\s*stars/i);
          if (rMatch) {
             rating = parseFloat(rMatch[1]);
          } else {
             rating = parseFloat(container.querySelector('.MW4etd')?.textContent || "0");
          }

          // 2. Reviews
          let reviewCount = 0;
          let parsed = NaN;

          // Match '1,145 Reviews'
          const reviewsMatch = everything.match(/([\d,]+)\s*Reviews/i);
          if (reviewsMatch) {
             parsed = parseInt(reviewsMatch[1].replace(/,/g, ""), 10);
          } else {
             // Fallback to parenthetical like (1,145)
             const parenMatch = everything.match(/\(([\d,]+)\)/);
             if (parenMatch) {
                parsed = parseInt(parenMatch[1].replace(/,/g, ""), 10);
             }
          }

          // Optional K notation
          if (Number.isNaN(parsed) && everything.toLowerCase().includes('k')) {
            const kMatch = everything.match(/([\d.]+)\s*k\s*Reviews/i) || everything.match(/([\d.]+)\s*k/i);
            if (kMatch) {
               parsed = Math.floor(parseFloat(kMatch[1]) * 1000);
            }
          }

          // If we successfully parsed a number, use it. Otherwise, assume it's a large business
          // to prevent them from passing the <= 100 filter.
          if (!Number.isNaN(parsed)) {
             reviewCount = parsed;
          } else {
             reviewCount = 999999; // Default to massive to drop it if extraction fails entirely
          }
          // --- END ---

          // External Links
          const googleMapsUrl = (container.querySelector('a.hfpxzc') as HTMLAnchorElement)?.href || "";
          const website = (container.querySelector('a[aria-label*="website"]') as HTMLAnchorElement)?.href || "N/A";
          
          // Phone
          const phoneElement = Array.from(container.querySelectorAll('.W4Efsd')).find(el => 
            /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(el.textContent || "")
          );
          const phone = phoneElement?.textContent?.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/)?.[0] || "N/A";

          results.push({
            id,
            name,
            phone,
            website,
            googleMapsUrl,
            rating,
            reviewCount,
            isClosed: container.textContent?.toLowerCase().includes("permanently closed") || 
                      container.textContent?.toLowerCase().includes("temporarily closed") || false
          });
        } catch (e) {
          // Ignore individual parsing errors
        }
      });

      return results;
    });

    console.log(`Scraper successfully found ${rawLeads.length} total raw leads in the area.`);
    
    // Target businesses based on Review Count only (100 reviews or under)
    const filteredLeads = rawLeads.filter((lead: any) => 
      !lead.isClosed && 
      lead.reviewCount <= 100
    );

    console.log(`Identified ${filteredLeads.length} high-intent matches.`);
    return filteredLeads.map(({ isClosed, ...rest }: any) => rest);

  } catch (error) {
    console.error("Scraping error:", error);
    return [];
  } finally {
    await browser.close();
  }
}
