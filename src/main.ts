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
  const promises: Promise<void>[] = [];
  page.on("response", (resp) => {
    if (!resp.url().includes("/flights/results/FlightSearchPoll")) return;
    promises.push(
      new Promise(async (resolve) => {
        const jsonResp = await resp.json();
        const bufferedScripts = jsonResp.bufferedScripts[0] as string;
        let info =
          "{" +
          bufferedScripts.substring(bufferedScripts.indexOf('"results":{'));
        info = info.substring(0, info.indexOf("R9.redux.")).trimEnd();
        if (info.endsWith(" })")) info = info.substring(0, info.length - 3);
        const jsObj = JSON.parse(info);
        console.log(jsObj);
        resolve();
      })
    );
  });

  await page.goto(
    "https://www.kayak.com/flights/ATL-WAS/2023-04-26/2023-05-03"
  );

  // try {
  //   for (let i = 0; i < 10; i++) {
  //     const loadMore = await page.waitForSelector(".show-more-button");
  //     await loadMore.click();
  //   }
  // } catch (e) {}
  // console.log("kayak: 10 more result-pagess loaded, should be enough");

  await Promise.allSettled(promises);

  /*
{"resultId":"d4aa80d2ed440b12656fdeb60eb6ae28","uiResultId":"d4aa80d2ed440b12656fdeb60eb6ae28","legs":[{"legId":"ATLCAN1682546400000BA2261682632800000CZ3042","legIndex":0,"distinctAirlines":[{"code":"BA","name":"British Airways","logoUrl":"https://content.r9cdn.net/rimg/provider-logos/airlines/v/BA.png?crop=false&width=108&height=92&fallback=default3.png&_v=89077931bb09ce2fc497652a6aaa40b2"},{"code":"CZ","name":"China Southern","logoUrl":"https://content.r9cdn.net/rimg/provider-logos/airlines/v/CZ.png?crop=false&width=108&height=92&fallback=default2.png&_v=315ef6d04651b818d44ef49c20c16f44"}],"displayAirline":{"code":"MULT","name":"Multiple airlines","logoUrl":"https://content.r9cdn.net/rimg/provider-logos/airlines/v/MULT.png?crop=false&width=108&height=92&fallback=default2.png&_v=230551432b21d8d61f889d8fad67a560"},"legDurationDisplay":"30h 40m","legDurationMinutes":1840,"segments":[{"flightNumber":"226","airline":{"code":"BA","name":"British Airways","logoUrl":"https://content.r9cdn.net/rimg/provider-logos/airlines/v/BA.png?crop=false&width=108&height=92&fallback=default3.png&_v=89077931bb09ce2fc497652a6aaa40b2"},"departure":{"airport":{"code":"ATL","displayName":"Atlanta Hartsfield-Jackson","fullDisplayName":"Hartsfield-Jackson"},"isoDateTimeLocal":"2023-04-26T22:25:00"},"arrival":{"airport":{"code":"LHR","displayName":"London Heathrow","fullDisplayName":"Heathrow"},"isoDateTimeLocal":"2023-04-27T11:35:00","isDateMismatch":true},"duration":"8h 10m","cabinDisplay":"Basic Economy","cabinCode":"bfbe","isOvernight":true,"segmentQualityItems":{"equipmentTypeName":"Boeing 777","qualityItems":[{"icon":"FLIGHT","msg":"Boeing 777 (Wide-body jet)"}]},"layover":{"duration":"10h 35m","message":"Change planes in London (LHR)","isLong":true,"isSelfTransfer":true}},{"flightNumber":"304","airline":{"code":"CZ","name":"China Southern","logoUrl":"https://content.r9cdn.net/rimg/provider-logos/airlines/v/CZ.png?crop=false&width=108&height=92&fallback=default2.png&_v=315ef6d04651b818d44ef49c20c16f44"},"departure":{"airport":{"code":"LHR","displayName":"London Heathrow","fullDisplayName":"Heathrow","cityCode":"LON","cityName":"London"},"isoDateTimeLocal":"2023-04-27T22:10:00"},"arrival":{"airport":{"code":"CAN","displayName":"Guangzhou Baiyun","fullDisplayName":"Baiyun"},"isoDateTimeLocal":"2023-04-28T17:05:00","isDateMismatch":true},"duration":"11h 55m","cabinDisplay":"Economy","cabinCode":"e","isOvernight":true,"segmentQualityItems":{"equipmentTypeName":"Boeing 787-9 Dreamliner","qualityItems":[{"icon":"FLIGHT","msg":"Boeing 787-9 Dreamliner (Wide-body jet)"}]}}]},{"legId":"CANATL1683115200000OZ3701683136800000OZ2721683129600000AS4923","legIndex":1,"distinctAirlines":[{"code":"OZ","name":"Asiana Airlines","logoUrl":"https://content.r9cdn.net/rimg/provider-logos/airlines/v/OZ.png?crop=false&width=108&height=92&fallback=default2.png&_v=c1801956f050e1e41787fa214a09248f"},{"code":"AS","name":"Alaska Airlines","logoUrl":"https://content.r9cdn.net/rimg/provider-logos/airlines/v/AS.png?crop=false&width=108&height=92&fallback=default2.png&_v=7e7c4110616a97db4d99676711cb7247"}],"displayAirline":{"code":"MULT","name":"Multiple airlines","logoUrl":"https://content.r9cdn.net/rimg/provider-logos/airlines/v/MULT.png?crop=false&width=108&height=92&fallback=default2.png&_v=230551432b21d8d61f889d8fad67a560"},"legDurationDisplay":"23h 32m","legDurationMinutes":1412,"segments":[{"flightNumber":"370","airline":{"code":"OZ","name":"Asiana Airlines","logoUrl":"https://content.r9cdn.net/rimg/provider-logos/airlines/v/OZ.png?crop=false&width=108&height=92&fallback=default2.png&_v=c1801956f050e1e41787fa214a09248f"},"departure":{"airport":{"code":"CAN","displayName":"Guangzhou Baiyun","fullDisplayName":"Baiyun"},"isoDateTimeLocal":"2023-05-03T12:25:00"},"arrival":{"airport":{"code":"ICN","displayName":"Incheon Intl","fullDisplayName":"Incheon Intl"},"isoDateTimeLocal":"2023-05-03T17:00:00"},"duration":"3h 35m","cabinDisplay":"Economy","cabinCode":"e","segmentQualityItems":{"equipmentTypeName":"Boeing 777-200LR","qualityItems":[{"icon":"FLIGHT","msg":"Boeing 777-200LR (Wide-body jet)"}]},"layover":{"duration":"1h 15m","message":"Change planes in Incheon (ICN)"}},{"flightNumber":"272","airline":{"code":"OZ","name":"Asiana Airlines","logoUrl":"https://content.r9cdn.net/rimg/provider-logos/airlines/v/OZ.png?crop=false&width=108&height=92&fallback=default2.png&_v=c1801956f050e1e41787fa214a09248f"},"departure":{"airport":{"code":"ICN","displayName":"Incheon Intl","fullDisplayName":"Incheon Intl"},"isoDateTimeLocal":"2023-05-03T18:15:00"},"arrival":{"airport":{"code":"SEA","displayName":"Seattle/Tacoma Intl","fullDisplayName":"Seattle/Tacoma Intl"},"isoDateTimeLocal":"2023-05-03T12:45:00"},"duration":"10h 30m","cabinDisplay":"Economy","cabinCode":"e","isOvernight":true,"segmentQualityItems":{"equipmentTypeName":"Boeing 777-200LR","qualityItems":[{"icon":"FLIGHT","msg":"Boeing 777-200LR (Wide-body jet)"}]},"layover":{"duration":"3h 25m","message":"Change planes in Seattle (SEA)","isLong":true,"isSelfTransfer":true}},{"flightNumber":"492","airline":{"code":"AS","name":"Alaska Airlines","logoUrl":"https://content.r9cdn.net/rimg/provider-logos/airlines/v/AS.png?crop=false&width=108&height=92&fallback=default2.png&_v=7e7c4110616a97db4d99676711cb7247"},"departure":{"airport":{"code":"SEA","displayName":"Seattle/Tacoma Intl","fullDisplayName":"Seattle/Tacoma Intl","cityCode":"SEA","cityName":"Seattle"},"isoDateTimeLocal":"2023-05-03T16:10:00"},"arrival":{"airport":{"code":"ATL","displayName":"Atlanta Hartsfield-Jackson","fullDisplayName":"Hartsfield-Jackson"},"isoDateTimeLocal":"2023-05-03T23:57:00"},"duration":"4h 47m","cabinDisplay":"Saver","cabinCode":"bfbe","segmentQualityItems":{"equipmentTypeName":"Boeing 737-900 (winglets)","qualityItems":[{"icon":"FLIGHT","msg":"Boeing 737-900 (winglets) (Narrow-body jet)"},{"icon":"WIFI","msg":"Wi-Fi available"},{"icon":"POWER","msg":"Power available"}]}}]}],"trackingDataLayer":{"tagLayerPrice":2663},"optionsByFare":[{"fareName":{"fareId":"NOBAG_ECONOMY","displayName":"Basic Economy, Economy"},"options":[{"url":"/book/flight?code=biDiZKNjnT.47F3EeHCWiIEdn9PX-8xhQ.266300.d4aa80d2ed440b12656fdeb60eb6ae28&h=c3221e541eb4&sub=E-19387ac18a6","bookingId":"E-19387ac18a6","displayPrice":"$2,663","providerInfo":{"code":"KIWIVI","displayName":"Kiwi.com","logoUrls":[{"image":"https://content.r9cdn.net/rimg/provider-logos/airlines/v/SKYPICKER.png?crop=false&width=108&height=92&fallback=default3.png&_v=554e7b58a40b798a35cbdf6f30ba584b","name":"Kiwi.com"}],"currency":"USD","countryName":"United States"},"fees":{"rawPrice":2663,"basePrice":"$2,663","totalPrice":"$2,663","carryOnBagData":{"status":"INCLUDED","displayPrice":"$0","numSelected":0},"checkedBagData":{"status":"FEE","displayPrice":"$177","numSelected":0,"secondBag":{"status":"UNKNOWN"}},"carryOnDisplay":"Included","checkedBagDisplay":"Not included"},"flags":{"isFeaturedProvider":true,"isSelfTransferProtection":false,"hasVirtualInterline":true},"qualityFlags":{"flag":"","cancellation":"no flag","accuracy":"Invalid","standards":"Invalid","fees":"Invalid","score":0},"fareAmenities":[{"type":"ANY","restriction":"INCLUDED","message":"Last to board"},{"type":"ANY","restriction":"INCLUDED","message":"Carry-on hand baggage"},{"type":"ANY","restriction":"FEE","message":"Food and beverages"},{"type":"ANY","restriction":"FEE","message":"Extra legroom"},{"type":"ANY","restriction":"FEE","message":"First checked bag"},{"type":"ANY","restriction":"UNAVAILABLE","message":"Pre-reserved seat assignment"}]}],"isFeatured":true}],"displayAirline":{"code":"MULT","name":"Multiple Airlines","logoUrl":"https://content.r9cdn.net/rimg/provider-logos/airlines/v/MULT.png?crop=false&width=108&height=92&fallback=default2.png&_v=230551432b21d8d61f889d8fad67a560"},"distinctAirlines":[{"code":"BA","name":"British Airways","logoUrl":"https://content.r9cdn.net/rimg/provider-logos/airlines/v/BA.png?crop=false&width=108&height=92&fallback=default3.png&_v=89077931bb09ce2fc497652a6aaa40b2"},{"code":"CZ","name":"China Southern","logoUrl":"https://content.r9cdn.net/rimg/provider-logos/airlines/v/CZ.png?crop=false&width=108&height=92&fallback=default2.png&_v=315ef6d04651b818d44ef49c20c16f44"},{"code":"OZ","name":"Asiana Airlines","logoUrl":"https://content.r9cdn.net/rimg/provider-logos/airlines/v/OZ.png?crop=false&width=108&height=92&fallback=default2.png&_v=c1801956f050e1e41787fa214a09248f"},{"code":"AS","name":"Alaska Airlines","logoUrl":"https://content.r9cdn.net/rimg/provider-logos/airlines/v/AS.png?crop=false&width=108&height=92&fallback=default2.png&_v=7e7c4110616a97db4d99676711cb7247"}],"cabinCode":"bfbe","warnings":["VIRTUAL_INTERLINE"],"co2Info":{"co2Total":6.332376033067703,"co2Average":7.36449783969446},"itemType":"RESULT"}
  */

  /*




















  */

  // // Wait for all results to load.
  // page.waitForFunction(
  //   'document.querySelector(".col-advice > div").ariaBusy == "false"'
  // );
  // console.log("kayak: first result ready");

  // // no hacker fares
  // {
  //   try {
  //     const titleSelector = "div[class*=-title-inner]";
  //     await page.waitForSelector(titleSelector, { timeout: 1000 });
  //     console.log("kayak: found -title-inner");
  //     const titles = await page.$$(titleSelector);

  //     let foundFlightQuality = false;
  //     for (const title of titles) {
  //       const text = await title.textContent();
  //       if (text?.includes("Flight quality")) {
  //         await title.click();
  //         foundFlightQuality = true;
  //         break;
  //       }
  //     }
  //     if (!foundFlightQuality) {
  //       console.error("kayak: ERROR: could not find Flight Quality");
  //     }
  //   } catch (e) {
  //     const qualitySection = await page.waitForSelector(
  //       "h3[id*=-quality-section-title-text].title"
  //     );
  //     await qualitySection.click();
  //   }

  //   const qualitySection = await page.waitForSelector(
  //     "div[data-name=quality-section]"
  //   );
  //   const labels = await qualitySection.$$("label");

  //   let foundHackerFaresCheckbox = false;
  //   for (const label of labels) {
  //     const text = await label.textContent();
  //     if (text?.includes("Hacker Fares")) {
  //       label.click();
  //       foundHackerFaresCheckbox = true;
  //       break;
  //     }
  //   }
  //   if (!foundHackerFaresCheckbox) {
  //     console.error("kayak: ERROR: could not find Hacker Fares checkbox");
  //   }
  // }

  // const ticketSelector =
  //   ".Ui-Flights-Results-Components-ListView-container > div > div[data-resultid]";
  // await page.waitForSelector(ticketSelector);
  // const tickets = await page.$$(ticketSelector);

  // const allTickets: RoundTripTicket[] = [];
  // for await (const ticket of tickets) {
  //   const priceDiv = await ticket.waitForSelector("div[class*=-price-text]");
  //   let price = await priceDiv.textContent();
  //   if (price == null) price = "0";
  //   if (price[0] == "$") price = price.slice(1);

  //   const roundTrips = await ticket.$$("ol > li");
  //   console.assert(roundTrips.length === 2);
  //   const times: (string | null)[][] = [];

  //   for (const trip of roundTrips) {
  //     const timeDiv = await trip.waitForSelector(
  //       "div[class*=-mod-variant-large]"
  //     );
  //     const timeText = await timeDiv.textContent();
  //     const airlineDiv = await trip.waitForSelector(
  //       "div[class*=-mod-variant-default]"
  //     );
  //     const airlineText = await airlineDiv.textContent();
  //     times.push([timeText, airlineText]);
  //   }

  //   const bookDiv1 = await ticket.waitForSelector("div[class*=-booking-btn]");
  //   const bookDiv2 = await bookDiv1.waitForSelector(
  //     "div[class*=-main-btn-wrap]"
  //   );
  //   const bookLink_ = await bookDiv2.waitForSelector("a");
  //   const bookLink = await bookLink_.getAttribute("href");

  //   const url = new URL(page.url());
  //   allTickets.push(
  //     new RoundTripTicket(
  //       parseFloat(price),
  //       times[0][0],
  //       times[0][1],
  //       times[1][0],
  //       times[1][1],
  //       `${url.protocol}//${url.hostname}${bookLink}`
  //     )
  //   );
  // }
  // allTickets.sort((a, b) => a.price - b.price);
  // allTickets.forEach((x) => console.log(x));
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

export async function main() {
  const browser = await chromium.launch({
    headless: false,
  });

  const context = await browser.newContext({
    viewport: { width: 1080, height: 1080 },
  });

  await Promise.allSettled([
    kayak(await context.newPage()),
    // google(await context.newPage()),
  ]);

  // Turn off the browser to clean up after ourselves.
  // await browser.close();
}

main();
