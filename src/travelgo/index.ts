import { BrowserContext } from 'playwright-core'

import { GenUrlInfo, Service, Ticket } from '@/util'

import * as SampleResponse from './travelgo.json'

// 北美同程
export default {
  gen_url(args: GenUrlInfo) {
    const ans: string[] = []
    for (const src of args.srcs)
      for (const dst of args.dsts)
        ans.push(
          `https://www.travelgo.com/iflight/book1.html?para=0*${src}*${dst}*${args.departDate.getFullYear()}-${args.departDate
            .getMonth()
            .toString()
            .padStart(2, '0')}-${args.departDate
            .getDate()
            .toString()
            .padStart(2, '0')}**Y*1*0*`,
        )
    return ans
  },
  async run(ctx: BrowserContext, url: string) {
    ctx.addCookies([
      {
        name: 'currency',
        value: 'USD',
        domain: new URL(url).host,
        path: '/',
      },
    ])
    const page = await ctx.newPage()
    await page.goto(url)
    for (;;) {
      const resp = await page.waitForResponse(resp => {
        if (resp.url().includes('travelgo.com/pciflightapi'))
          console.log(resp.url(), resp.headers()['content-length'])
        return resp.url().endsWith('/pciflightapi/ts/list')
      })

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
} as Service

const processResponse = (
  jsonResp: typeof SampleResponse,
  url: string,
): Ticket[] =>
  jsonResp.data.res.map(ticket => ({
    priceWithUrl: [
      {
        usdPrice: ticket.avg,
        url,
      },
    ],
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
  }))
