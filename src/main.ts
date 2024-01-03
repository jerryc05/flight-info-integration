import { strict, strictEqual } from 'assert'
import { Page, chromium as browser_ } from 'playwright-core'

import kayak from './kayak'
import travelgo from './travelgo'
import { GenUrlInfo } from './util'

type RoundTripTicket = {
  price: number
  departTime: string | null
  departAirline: string | null
  returnTime: string | null
  returnAirline: string | null
  link: string | null
}

type KayakTicketLegSegment = {
  flightNumber: number
  airline: {
    code: string
    name: string
  }
  departure: {
    airport: {
      code: string
      displayName: string
    }
    isoDateTimeLocal: string
  }
  arrival: KayakTicket['legs'][0]['segments'][1]['departure']
  duration: string
  cabinDisplay: string
  segmentQualityItems: {
    equipmentTypeName: string
  }
}

type KayakTicketLeg = {
  legDurationDisplay: string
  legDurationMinutes: number
  segments: [
    KayakTicketLegSegment & {
      layover: {
        duration: string
      }
    },
    KayakTicketLegSegment,
  ]
}
type KayakTicket = {
  legs: [KayakTicketLeg, KayakTicketLeg]
  optionsByFare: {
    options: {
      url: string
      fees: {
        rawPrice: number
        carryOnBagData: {
          displayPrice: string
        }
        checkedBagData: {
          displayPrice: string
          secondBag: { status: string }
        }
      }
    }[]
  }[]
}

async function kayak_(page: Page) {
  const tickets: KayakTicket[] = []
  const promises: Promise<void>[] = []

  function kayakMinFareOption(ticket: KayakTicket) {
    let option = ticket.optionsByFare[0].options[0]
    ticket.optionsByFare.forEach(x =>
      x.options.forEach(x => {
        if (x.fees.rawPrice < option.fees.rawPrice) option = x
      }),
    )
    return option
  }

  page.on('response', resp => {
    if (!resp.url().includes('/flights/results/FlightSearchPoll')) return
    promises.push(
      new Promise(async resolve => {
        const jsonResp = await resp.json()
        const bufferedScripts = jsonResp.bufferedScripts[0] as string
        let info =
          '{' +
          bufferedScripts.substring(bufferedScripts.indexOf('"results":{'))
        info = info.substring(0, info.indexOf('R9.redux.')).trimEnd()
        if (info.endsWith(' })')) info = info.substring(0, info.length - 3)
        const jsObj = JSON.parse(info)
        Object.values(jsObj.results as object[]).forEach(x => {
          if ('legs' in x) tickets.push(x as KayakTicket)
        })
        resolve()
      }),
    )
  })

  await page.goto(
    'https://www.kayak.com/flights/SFO-CAN,HAK,SHA/2024-01-22?sort=price_a&fs=cfc=1' /*carry on*/ +
      ';stops=-2' /*nonstop+1stop*/ +
      ';bfc=1' /*checked bag*/,
  )

  try {
    const totalPages = 5
    for (let i = 2; i <= totalPages; i++) {
      const loadMore = await page.waitForSelector('.show-more-button')
      await loadMore.click()
      console.log(`kayak: loading page ${i}/${totalPages}`)
      await page.waitForSelector('.show-more-button')
    }
  } catch (e) {}
  await page.waitForTimeout(1000)

  await Promise.allSettled(promises)
  console.log(`kayak: allSettled, ${tickets.length} tickets`)

  tickets.sort(
    (a, b) =>
      kayakMinFareOption(a).fees.rawPrice - kayakMinFareOption(b).fees.rawPrice,
  )
  tickets.forEach(x => {
    const minFareOption = kayakMinFareOption(x)
    const url = new URL(page.url())
    console.log(
      `--------------------\n$${minFareOption.fees.rawPrice} ${url.protocol}//${
        url.host
      }${minFareOption.url.startsWith('/') ? '' : '/'}${minFareOption.url}`,
    )
    x.legs.forEach(leg => {
      console.log(`    ${leg.legDurationDisplay}`)
      leg.segments.forEach(x => {
        process.stdout.write(
          `        ${x.airline.code}${x.flightNumber}\t${x.duration}\t${x.departure.isoDateTimeLocal}->${x.arrival.isoDateTimeLocal}\t${x.departure.airport.displayName}(${x.departure.airport.code})\t-> ${x.arrival.airport.displayName}(${x.arrival.airport.code})`,
        )
        if ('layover' in x) {
          process.stdout.write(` (Layover: ${x.layover.duration})`)
        }
        console.log()
      })
    })
  })

  console.log('kayak: done')

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
  await page.goto('https://www.google.com/travel/flights')

  page.waitForSelector('input')
  const inputs_ = await page.$$('input')
  const inputs = inputs_.filter(async x => {
    const box = await x.boundingBox()
    return box != null && box.height > 0 && box.width > 0
  })
}

async function ctrip(
  page: Page,
  isOneWay: boolean,
  from: string,
  to: string,
  date: Date,
) {
  strictEqual(isOneWay, true) //todo
  await page.goto(
    `https://flights.ctrip.com/online/list/${
      isOneWay ? 'oneway' : ''
    }-${from}-${to}?depdate=${date.getFullYear()}-${date.getMonth()}-${date.getDay()}`,
  )
  const responsePromises: Promise<{ k: object[]; v: number }[]>[] = []

  page.on('response', resp => {
    if (!resp.url().includes('/batchSearch?')) return
    responsePromises.push(
      new Promise(async resolve => {
        const jsonResp = await resp.json()
        console.log(jsonResp)

        const flightList = jsonResp.data.flightItineraryList as {
          flightSegments: { flightList: object[] }[]
          priceList: { adultPrice: number }[]
        }[]
        strict(flightList.every(x => x.flightSegments.length === 1))

        resolve(
          flightList.map(x => ({
            k: x.flightSegments[0].flightList,
            v: x.priceList[0].adultPrice,
          })),
        )
      }),
    )
  })
  await page.waitForSelector(
    'div.flight-list.root-flights > span > div:nth-child(1)',
  )
  await page.waitForTimeout(2000)
  await page.waitForLoadState('networkidle')

  const tickets = (await Promise.all(responsePromises)).flat()
  console.log(tickets)
}

const args: GenUrlInfo = {
  srcs: ['SFO'],
  dsts: ['CAN'],
  departDate: new Date('2024-05-20'),
}

export async function main() {
  const browser = await browser_.connectOverCDP('http://127.0.0.1:9222')

  const newContext = () =>
    browser.newContext({
      viewport: { width: 1080, height: 1080 },
    })

  const allTickets = await Promise.all([
    ...kayak
      .gen_url(args)
      .map(async url => await kayak.run(await newContext(), url)),
    ...travelgo
      .gen_url(args)
      .map(async url => await travelgo.run(await newContext(), url)),
  ])

  console.dir(allTickets, {
    depth: null,
  })

  // await context.close()
  // await browser.close()
}

main()
