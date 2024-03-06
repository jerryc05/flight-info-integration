import { HTMLElement, parse } from 'node-html-parser'
import { BrowserContext } from 'playwright-core'

import { GenUrlInfo, Service, Ticket2, getMyDate, parseHrMinText } from '@/util'

export default {
  gen_url(args: GenUrlInfo) {
    if (args.returnDates != null)
      // todo
      return []

    const ans: string[] = []
    for (const deptDate of args.departDates) {
      // for (const retnDate of args.returnDates) {
      {
        let url = `https://www.kayak.com/flights/${args.srcIatas.join(
          ',',
        )}-${args.dstIatas.join(',')}/${getMyDate(deptDate).year}-${getMyDate(
          deptDate,
        )
          .month.toString()
          .padStart(2, '0')}-${getMyDate(deptDate)
          .day.toString()
          .padStart(2, '0')}?sort=price_a&fs=`
        if (args.mostStops != null && args.mostStops !== true)
          url += `stops=${args.mostStops === 0 ? 0 : '-2'};`
        if (args.carryOn != null) url += `cfc=${args.carryOn};`
        if (args.checkedBags != null) url += `bfc=${args.checkedBags};`
        ans.push(url)
      }
    }

    return ans
  },
  async run(ctx: BrowserContext, url: string) {
    let html = ''
    let pageUrl = new URL(url)
    {
      const page = await ctx.newPage()
      console.log(url)
      await page.goto(url)

      try {
        for (let i = 0; i < 10; i++) {
          const loadMoreBtn = await page.waitForSelector(
            'div.show-more-button',
            {
              timeout: 2000,
            },
          )
          await loadMoreBtn.click()
        }
      } catch (e) {
        // console.error(e)
      }

      html = await page.content()
      pageUrl = new URL(page.url())
      page.close()
    }

    //
    //
    //
    //
    //

    const document = parse(html)

    const allEl = document.querySelectorAll('div[data-resultid].nrc6')

    function parseTicketEl(x: HTMLElement) {
      const priceText =
        x.querySelector('div[class$=-price-text]')?.innerText ?? NaN.toString()
      const usdPrice = parseFloat(priceText.replaceAll(/\$|,/g, ''))

      let url = ''
      const href = x.querySelector('a[class$=-fclink]')?.getAttribute('href')
      if (href) url = `${pageUrl.protocol}//${pageUrl.host}${href}`

      let departAirport = ''
      let arrivalAirport = ''
      const deptArriApEls = x.querySelectorAll('span[class$=-ap-info]')
      if (deptArriApEls.length >= 2) {
        departAirport = deptArriApEls[0].innerText
        arrivalAirport = deptArriApEls[1].innerText
      }

      const modVariantDefaultEls = x.querySelectorAll(
        'div[class$=-mod-variant-default]',
      )

      let stopAirports: string[] = []
      for (const el of modVariantDefaultEls) {
        const text = el.innerText
        if (/^[A-Z]{3}(?:, [A-Z]{3})*$/.test(text)) {
          stopAirports = text.split(', ')
          break
        }
      }

      let totalHrMin: Ticket2['totalHrMin'] = [NaN, NaN]
      for (const el of modVariantDefaultEls) {
        const text = el.innerText
        if (text.endsWith('m')) {
          totalHrMin = parseHrMinText(text)
          break
        }
      }

      const ticket: Ticket2 = {
        priceWithUrl: { usdPrice, url, respectBags: true },
        departAirport,
        arrivalAirport,
        stopAirports,
        totalHrMin: totalHrMin,
      }
      return ticket
    }

    return allEl.map(parseTicketEl)
  },
} as Service
