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
  travelgo_gen_url(args: { src: string; dst: string; departDate: Date }) {
    return `https://www.travelgo.com/iflight/book1.html?para=0*${args.src}*${
      args.dst
    }*${args.departDate.getFullYear()}-${args.departDate.getMonth()}-${args.departDate.getDate()}**Y*1*0*`
  },
  async travelgo(page: Page, url: string) {
    await page.goto(url)
    for (;;) {
      const resp = await page.waitForResponse(resp =>
        resp.url().includes('/pciflightapi/ts/list'),
      )

      let jsonResp
      try {
        jsonResp = await resp.json()
      } catch (e) {
        console.log('error')
        break
      }
      return processResponse(jsonResp, url)
    }
    throw new Error('unreachable!')
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
/**
Type '{ airline: string; departLocalTimeIgnoreTz: Date; departAirport: string; returnLocalTimeIgnoreTz: Date; returnAirport: string; }' is missing the following properties from type
     '{ airline: string; departLocalTimeIgnoreTz: Date; departAirport: string; arrivalLocaTimeIgnoreTz: Date; arrivalAirport: string; }': arrivalLocaTimeIgnoreTz, arrivalAirport
 */
