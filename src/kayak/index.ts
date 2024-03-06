import { HTMLElement, parse } from 'node-html-parser'
import { BrowserContext, ElementHandle } from 'playwright-core'

import { GenUrlInfo, Service, Ticket2, getMyDate } from '@/util'

export default {
  gen_url(args: GenUrlInfo) {
    const ans: string[] = []
    for (const deptDate of args.departDates) {
      // for (const retnDate of args.returnDates)
      {
        let url = `https://www.kayak.com/flights/${args.srcs.join(
          ',',
        )}-${args.dsts.join(',')}/${getMyDate(deptDate).year}-${getMyDate(
          deptDate,
        )
          .month.toString()
          .padStart(2, '0')}-${getMyDate(deptDate)
          .day.toString()
          .padStart(2, '0')}?sort=price_a&fs=`
        if (args.stops != null && args.stops !== true)
          url += `stops=${args.stops === 0 ? 0 : '-2'};`
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
    const result: Ticket2[] = []

    function parseTicketEl(x: HTMLElement) {
      let usdPrice = -1
      const price = x.querySelector('div[class$=-price-text]')
      if (!price) return null
      const priceText = price.innerText
      usdPrice = parseFloat(priceText.replaceAll(/\$|,/g, ''))

      let url = ''
      const urlEl = x.querySelector('a[class$=-fclink]')
      if (!urlEl) return null
      const href = urlEl.getAttribute('href')
      if (!href) return null
      url = `${pageUrl.protocol}//${pageUrl.host}${href}`

      let departAirport = ''
      let arrivalAirport = ''
      const deptArriApEls = x.querySelectorAll('span[class$=-ap-info]')
      if (deptArriApEls.length <= 1) return null
      departAirport = deptArriApEls[0].innerText
      arrivalAirport = deptArriApEls[1].innerText

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

      let totalHrMin: Ticket2['totalHrMin'] = [-1, -1]
      for (const el of modVariantDefaultEls) {
        let text = el.innerText
        if (text.endsWith('m')) {
          text = text.substring(0, text.length - 1)
          const mapped = text.split('h').map(parseFloat)
          if (mapped.length === 2) {
            totalHrMin = [mapped[0], mapped[1]]
          } else if (mapped.length === 1) {
            totalHrMin = [0, mapped[0]]
          }
          break
        }
      }
      if (Math.min(...totalHrMin) < 0) return null

      return {
        priceWithUrl: { usdPrice, url },
        departAirport,
        arrivalAirport,
        stopAirports,
        totalHrMin: totalHrMin,
      } as Ticket2
    }

    return allEl.map(parseTicketEl)
  },
} as Service
