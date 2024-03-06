import { strict, strictEqual } from 'assert'
import { Page, chromium as browser_ } from 'playwright-core'
import { env } from 'process'

import google from '@/google'
import kayak from '@/kayak'
import travelgo from '@/travelgo'
import { GenUrlInfo } from '@/util'

// async function google2(page: Page) {
//   await page.goto('https://www.google.com/travel/flights')

//   page.waitForSelector('input')
//   const inputs_ = await page.$$('input')
//   const inputs = inputs_.filter(async x => {
//     const box = await x.boundingBox()
//     return box != null && box.height > 0 && box.width > 0
//   })
// }

// async function ctrip(
//   page: Page,
//   isOneWay: boolean,
//   from: string,
//   to: string,
//   date: Date,
// ) {
//   strictEqual(isOneWay, true) //todo
//   await page.goto(
//     `https://flights.ctrip.com/online/list/${
//       isOneWay ? 'oneway' : ''
//     }-${from}-${to}?depdate=${date.getFullYear()}-${date.getMonth()}-${date.getDay()}`,
//   )
//   const responsePromises: Promise<{ k: object[]; v: number }[]>[] = []

//   page.on('response', resp => {
//     if (!resp.url().includes('/batchSearch?')) return
//     responsePromises.push(
//       new Promise(async resolve => {
//         const jsonResp = await resp.json()
//         console.log(jsonResp)

//         const flightList = jsonResp.data.flightItineraryList as {
//           flightSegments: { flightList: object[] }[]
//           priceList: { adultPrice: number }[]
//         }[]
//         strict(flightList.every(x => x.flightSegments.length === 1))

//         resolve(
//           flightList.map(x => ({
//             k: x.flightSegments[0].flightList,
//             v: x.priceList[0].adultPrice,
//           })),
//         )
//       }),
//     )
//   })
//   await page.waitForSelector(
//     'div.flight-list.root-flights > span > div:nth-child(1)',
//   )
//   await page.waitForTimeout(2000)
//   await page.waitForLoadState('networkidle')

//   const tickets = (await Promise.all(responsePromises)).flat()
//   console.log(tickets)
// }

const args: GenUrlInfo = {
  srcs: ['ATL'],
  dsts: ['CAN', 'HAK', 'SHA', 'XMN', 'FOC'],
  departDates: [new Date('2024-05-09')],
  carryOn: 1,
  checkedBags: 1,
}

export async function main() {
  if (env.CDP_PORT == null) throw new Error('CDP_PORT not set')

  const browser = await browser_.connectOverCDP(
    `http://127.0.0.1:${env.CDP_PORT}`,
  )
  const defaultBorwserCtx = await browser.newContext({
    viewport: { width: 1080, height: 1080 },
  })

  // google.run(await newContext(), args)
  // return

  const allTickets = (
    await Promise.all([
      ...kayak
        .gen_url(args)
        .map(async url => await kayak.run(defaultBorwserCtx, url)),
      // ...travelgo
      //   .gen_url(args)
      //   .map(async url => await travelgo.run(defaultBorwserCtx, url)),
    ])
  )
    .flat()
    .sort(x => x.priceWithUrl.usdPrice)

  console.dir(allTickets, {
    depth: null,
  })

  defaultBorwserCtx.close()
}

main()
