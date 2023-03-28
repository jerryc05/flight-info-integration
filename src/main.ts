import { chromium, Page } from "playwright";

class RoundTripTicket {
  price: number;
  departTime: string | null;
  departAirline: string | null;
  returnTime: string | null;
  returnAirline: string | null;
  link: string | null;
  constructor(
    price: number,
    departTime: string | null,
    departAirline: string | null,
    returnTime: string | null,
    returnAirline: string | null,
    link: string | null
  ) {
    this.price = price;
    this.departTime = departTime;
    this.departAirline = departAirline;
    this.returnTime = returnTime;
    this.returnAirline = returnAirline;
    this.link = link;
  }
}

async function kayak(page: Page) {
  await page.goto(
    "https://www.kayak.com/flights/ATL-WAS/2023-04-26/2023-05-03"
  );

  // Wait for all results to load.
  page.waitForFunction(
    '!document.querySelector(".col-advice > div").textContent.includes("Loading")'
  );

  try {
    for (let i = 0; i < 15; i++) {
      const loadMore = await page.waitForSelector(".show-more-button");
      await loadMore.click();
    }
  } catch (e) {}

  const ticketSelector =
    ".Ui-Flights-Results-Components-ListView-container > div > div[data-resultid]";
  await page.waitForSelector(ticketSelector);
  const tickets = await page.$$(ticketSelector);

  const allTickets: RoundTripTicket[] = [];
  for (const ticket of tickets) {
    const priceDiv = await ticket.waitForSelector("div[class*=-price-text]");
    let price = await priceDiv.textContent();
    if (price == null) price = "0";
    if (price[0] == "$") price = price.slice(1);

    const roundTrips = await ticket.$$("ol > li");
    console.assert(roundTrips.length === 2);
    const times: (string | null)[][] = [];

    for (const trip of roundTrips) {
      const timeDiv = await trip.waitForSelector(
        "div[class*=-mod-variant-large]"
      );
      const timeText = await timeDiv.textContent();
      const airlineDiv = await trip.waitForSelector(
        "div[class*=-mod-variant-default]"
      );
      const airlineText = await airlineDiv.textContent();
      times.push([timeText, airlineText]);
    }

    const bookDiv = await ticket.waitForSelector("div[class*=-booking-btn]");
    const bookLink_ = await bookDiv.waitForSelector("a");
    const bookLink = await bookLink_.getAttribute("href");

    const url = new URL(page.url());
    allTickets.push(
      new RoundTripTicket(
        parseFloat(price),
        times[0][0],
        times[0][1],
        times[1][0],
        times[1][1],
        `${url.protocol}//${url.hostname}${bookLink}`
      )
    );
  }
  allTickets.sort((a, b) => a.price - b.price);
  console.log(allTickets);
}

async function google(page: Page) {
  await page.goto("https://www.google.com/travel/flights");

  page.waitForSelector("input");
  const inputs_ = await page.$$("input");
  const inputs = inputs_.filter(async (x) => {
    const box = await x.boundingBox();
    return box != null && box.height > 0 && box.width > 0;
  });
}

(async () => {
  const browser = await chromium.launch({
    headless: false,
  });

  const context = await browser.newContext({
    viewport: { width: 1080, height: 1080 },
  });

  Promise.allSettled([
    kayak(await context.newPage()),
    google(await context.newPage()),
  ]);

  // Turn off the browser to clean up after ourselves.
  await browser.close();
})();
