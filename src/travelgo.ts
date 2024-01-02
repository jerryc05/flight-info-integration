// 北美同程
import { Page } from 'playwright-core'

import * as SampleResponse from './travelgo.json'

export type Ticket = {
  usdPrice: number
  link: string
  steps: {
    airline: string
    departLocalTimeIgnoreTz: Date
    departAirport: string
    arrivalLocalTimeIgnoreTz: Date
    arrivalAirport: string
  }[]
}

export default {
  gen_url(args: { src: string; dst: string; departDate: Date }) {
    return `https://www.travelgo.com/iflight/book1.html?para=0*${args.src}*${
      args.dst
    }*${args.departDate.getFullYear()}-${args.departDate
      .getMonth()
      .toString()
      .padStart(2, '0')}-${args.departDate
      .getDate()
      .toString()
      .padStart(2, '0')}**Y*1*0*`
  },
  async run(page: Page, url: string) {
    await page.goto(url)
    for (;;) {
      const resp = await page.waitForResponse(resp =>
        resp.url().endsWith('/pciflightapi/ts/list'),
      )

      let jsonResp: typeof SampleResponse
      try {
        jsonResp = await resp.json()
        if (!jsonResp.data.res) continue
      } catch (e) {
        continue
      }
      return processResponse(jsonResp, url)
    }
  },
}

const processResponse = (jsonResp: typeof SampleResponse, url: string) =>
  jsonResp.data.res.map(
    ticket =>
      ({
        usdPrice: ticket.avg,
        link: url,
        steps: ticket.dants.map((dant, idx) => ({
          airline: ticket.acs[idx].an,
          departLocalTimeIgnoreTz: new Date(
            `${ticket.fdate[idx]} ${ticket.ftime[idx]}`,
          ),
          departAirport: dant.an,
          arrivalLocalTimeIgnoreTz: new Date(
            `${ticket.adate[idx]} ${ticket.atime[idx]}`,
          ),
          arrivalAirport: ticket.aants[idx].an,
        })),
      }) as Ticket,
  )