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
      const mydeptDate = getMyDate(deptDate)
      const deptDateStr = `${(mydeptDate.year % 100)
        .toString()
        .padStart(2, '0')}${mydeptDate.month
        .toString()
        .padStart(2, '0')}${mydeptDate.day.toString().padStart(2, '0')}`

      // for (const retnDate of args.returnDates) {
      for (const srcIata of args.srcIatas) {
        for (const dstIata of args.dstIatas) {
          let url = `https://www.skyscanner.com/transport/flights/${srcIata}/${dstIata}/${deptDateStr}/?`
          if (args.mostStops != null || args.mostStops === true) {
            url += '&stops='
            if (args.mostStops === 0) url += '!oneStop,!twoPlusStops'
            else if (args.mostStops === 1) url += '!twoPlusStops'
          }
          ans.push(url)
        }
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
            'button[class*=BpkButton_bpk-button__][class*=BpkButton_bpk-button--secondary__]:not([class*=icon-only]):not([class*=Login]):not([class*=Flights]):not([class*=Culture])',
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

    const allEl = document.querySelectorAll(
      'div[class*=FlightsResults_dayViewItems__]>div:not([class])',
    )

    function parseTicketEl(x: HTMLElement) {
      let usdPrice = NaN
      const priceText = x.querySelector(
        'div[class^=Price_mainPriceContainer__]',
      )?.innerText
      if (priceText != null)
        usdPrice = parseFloat(priceText.replaceAll(/\$|,/g, ''))
      else {
        return null
      }

      let url = ''
      const href = x.querySelector('a')?.getAttribute('href')
      if (href) url = `${pageUrl.protocol}//${pageUrl.host}${href}`

      let [departAirport, arrivalAirport] = x
        .querySelectorAll('div[class^=LegInfo_routePartial]')
        .map(
          leg =>
            leg.querySelector('span[class*=LegInfo_routePartialCityTooltip]')
              ?.innerText,
        )
      departAirport = departAirport ?? ''
      arrivalAirport = arrivalAirport ?? ''

      const stopsContainerEl = x.querySelector(
        'div[class^=LegInfo_stopsContainer__]',
      )

      const stopAirports =
        stopsContainerEl
          ?.querySelectorAll(
            'span[class*=BpkText_bpk-text--xs__]:not([class*=Duration]):not([class*=LegInfo_stop])',
          )
          .map(x => x.innerText) ?? []

      const totalHrMin: Ticket2['totalHrMin'] = parseHrMinText(
        stopsContainerEl?.querySelector('span[class*=Duration_duration__]')
          ?.innerText,
      )

      const ticket: Ticket2 = {
        priceWithUrl: { usdPrice, url, respectBags: false },
        departAirport,
        arrivalAirport,
        stopAirports,
        totalHrMin: totalHrMin,
      }
      return ticket
    }

    return allEl.map(parseTicketEl).filter(x => x != null)
  },
} as Service
