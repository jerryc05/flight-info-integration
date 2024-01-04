import { BrowserContext } from 'playwright-core'

import { GenUrlInfo, Service, Ticket, getMyDate } from '@/util'

import * as FlightSearchPollAction from './FlightSearchPollAction.json'

export default {
  gen_url(args: GenUrlInfo) {
    let url = `https://www.kayak.com/flights/${args.srcs.join(
      ',',
    )}-${args.dsts.join(',')}/${getMyDate(args.departDate).year}-${getMyDate(
      args.departDate,
    )
      .month.toString()
      .padStart(2, '0')}-${getMyDate(args.departDate)
      .day.toString()
      .padStart(2, '0')}?sort=price_a&`
    if (args.stops != null && args.stops !== true)
      url += `stops=${args.stops == 0 ? 0 : '-2'};`
    if (args.carryOn != null) url += `fs=cfc=${args.carryOn};`
    if (args.checkedBags != null) url += `bfc=${args.checkedBags};`
    return [url]
  },
  async run(ctx: BrowserContext, url: string) {
    const page = await ctx.newPage()
    const resp = await page.goto(url)
    console.log(url)

    if (resp) {
      const textResp = await resp.text()
      const textResps = textResp
        .replaceAll("\\'", '\\"')
        .split('\n')
        .map(line => line.trim())

      const earlyResult =
        processHtml(
          'reducer: ',
          textResps,
          (obj: any) => obj.initialState,
          url,
        ) ??
        processHtml(
          '</script><script id="__R9_HYDRATE_DATA__" type="application/json">',
          textResps,
          (obj: any) => obj.serverData,
          url,
        )

      if (earlyResult) {
        return earlyResult
      }
    }

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

    ctx.close()
    return result
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
        departAirport: seg.departure.airport.code,
        arrivalLocalTimeIgnoreTz: new Date(seg.arrival.isoDateTimeLocal),
        arrivalAirport: seg.arrival.airport.code,
      })),
    }))

function processHtml(
  PREFIX: string,
  textResps: string[],
  jsonRespGetter: (obj: any) => any,
  url: string,
) {
  const filteredTextResps = textResps.filter(line => line.startsWith(PREFIX))
  for (const lineResp_ of filteredTextResps) {
    let lineResp = lineResp_.substring(PREFIX.length)
    while (!lineResp.endsWith('}'))
      lineResp = lineResp.substring(0, lineResp.length - 1)
    const jsonResp = jsonRespGetter(JSON.parse(lineResp))
    if (jsonResp.FlightResultsList) {
      return processResponse(jsonResp, url)
    }
  }
}
