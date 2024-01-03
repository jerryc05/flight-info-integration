import { BrowserContext } from 'playwright-core'

import { GenUrlInfo, Service, Ticket } from '@/util'

import * as FlightSearchPollAction from './FlightSearchPollAction.json'

export default {
  gen_url(args: GenUrlInfo) {
    let url = `https://www.kayak.com/flights/${args.srcs.join(
      ',',
    )}-${args.dsts.join(',')}/${args.departDate.getFullYear()}-${args.departDate
      .getMonth()
      .toString()
      .padStart(2, '0')}-${args.departDate
      .getDate()
      .toString()
      .padStart(2, '0')}?sort=price_a&`
    if (args.stops != null && args.stops !== true)
      url += `stops=${args.stops == 0 ? 0 : '-2'};`
    if (args.carryOn != null) url += `fs=cfc=${args.carryOn};`
    if (args.checkedBags != null) url += `bfc=${args.checkedBags};`
    return [url]
  },
  async run(ctx: BrowserContext, url: string) {
    const page = await ctx.newPage()
    await page.goto(url)
    let result: Ticket[] = []

    try {
      for (;;) {
        const resp = await page.waitForResponse(
          resp =>
            resp
              .url()
              .includes('/s/horizon/flights/results/FlightSearchPollAction'),
          {
            timeout: 5000,
          },
        )

        const jsonResp = await resp.json()
        result = result.concat(processResponse(jsonResp, url))
      }
    } catch (e) {
      console.error(e)
    }

    return [{} as Ticket]
  },
} as Service

const processResponse = (
  jsonResp: typeof FlightSearchPollAction,
  url: string,
): Ticket[] =>
  Object.entries(jsonResp.FlightResultsList.results)
    .filter(([_, result]) => !result.itemType.includes('AD'))
    .map(
      ([_, result]) =>
        result as typeof FlightSearchPollAction.FlightResultsList.results.b7b642d3d6e336d621e3ee190850c716,
    )
    .map(result => ({
      priceWithUrl: result.optionsByFare
        .map(opt => opt.options)
        .flat()
        .map(opt => ({
          usdPrice: opt.fees.rawPrice,
          url,
        })),
      steps: result.legs[0].segments.map(seg => ({
        airline: `${seg.airline.code}${seg.flightNumber}`,
        departLocalTimeIgnoreTz: new Date(seg.departure.isoDateTimeLocal),
        departAirport: seg.departure.airport.displayName,
        arrivalLocalTimeIgnoreTz: new Date(seg.arrival.isoDateTimeLocal),
        arrivalAirport: seg.arrival.airport.displayName,
      })),
    }))
