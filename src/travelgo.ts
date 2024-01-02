// 北美同程
import { Page } from 'playwright-core'

import * as jsfile from './travelgo.json'

export type Ticket = {
  usdPrice: number
  steps: {
    airline: string
    departLocalTimeIgnoreTz: Date
    departAirport: string
    returnLocaTimeIgnoreTz: Date
    returnAirport: string
  }[]
  link: string
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

const processResponse = (jsonResp: typeof jsfile, url: string) =>
  jsonResp.data.res.map(
    ticket =>
      ({
        usdPrice: ticket.avg,
        link: url,
        steps: (ticket.dants as any[]).map((dant, idx) => ({
          airline: ticket.acs[idx].an,
          departTime: new Date(`${ticket.fdate[idx]} ${ticket.ftime[idx]}`),
          departAirport: dant.an,
          returnTime: new Date(`${ticket.adate[idx]} ${ticket.atime[idx]}`),
          returnAirport: ticket.aants[idx].an,
        })),
      }) as Ticket,
  )

console.dir(processResponse(jsfile, ''), {
  depth: null,
})
