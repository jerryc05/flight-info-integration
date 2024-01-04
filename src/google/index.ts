import * as assert from 'assert'
import { BrowserContext, Page } from 'playwright-core'
import { ElementHandleForTag } from 'playwright-core/types/structs'

import { GenUrlInfo, Service2, Ticket, getMyDate } from '@/util'

export default {
  async run(
    ctx: Parameters<Service2['run']>[0],
    args: Parameters<Service2['run']>[1],
  ) {
    const isOneway = args.returnDate == null
    ctx.setExtraHTTPHeaders({
      'Accept-Language': 'en-US',
    })
    const page = await ctx.newPage()
    await page.goto('https://www.google.com/travel/flights')
    await page.waitForLoadState('load')

    // one way or round trip
    {
      const allSpans = await page.$$('span[jsname]:not([id])')
      console.log('allSpans.length', allSpans.length)
      const onewayOrRoundtrip = isOneway ? 'One way' : 'Round trip'
      const spans = []
      for await (const x of allSpans)
        if ((await x.innerHTML()).trim() === onewayOrRoundtrip) spans.push(x)
      console.log(onewayOrRoundtrip, 'spans.length', spans.length)

      if (spans.length == 0 || spans.length >= 3)
        throw new Error(
          `Elements with text "${onewayOrRoundtrip}" has ${spans.length} elements`,
        )
      await Promise.all(
        spans.map(x =>
          // x.click({force: true})  // not working for invisible elements
          x.evaluate(e => e.click()),
        ),
      )
    }

    let inputs: ElementHandleForTag<any>[] = []
    {
      const waitStart = Date.now()
      while (inputs.length != (isOneway ? 3 : 4)) {
        if (Date.now() - waitStart > 10000)
          throw new Error('Waited for inputs.length too long!')
        inputs = await visibleElemHandles(
          await page.$$('div[jscontroller]>input'),
        )
        await page.waitForTimeout(100)
      }
    }
    console.log('inputs.length', inputs.length)

    // src, dst, date
    await srcDsrHelper(
      inputs[0],
      args.srcs[0], //todo
      page,
      'depart',
    )
    await srcDsrHelper(
      inputs[1],
      args.dsts[0], //todo
      page,
      'return',
    )

    // search
    let searchBtn: ElementHandleForTag<any> | null = null
    {
      const filteredButtons = []
      while (filteredButtons.length != 1) {
        const buttons = await visibleElemHandles(
          await page.$$('span[jsname][aria-hidden]'),
        )
        // console.log(
        //   'search buttons',
        //   await Promise.all(buttons.map(x => x.innerHTML())),
        // )
        filteredButtons.length = 0
        for await (const x of buttons)
          if ((await x.innerHTML()) === 'Search') filteredButtons.push(x)
        // console.log('filteredButtons.length', filteredButtons.length)
      }
      searchBtn = filteredButtons[0]
    }

    // date
    await dateHelper(args.departDate, inputs[2], page)
    if (!isOneway) await dateHelper(args.returnDate!, inputs[3], page)

    //search
    await searchBtn.click()

    // new page
    await page.waitForLoadState('load')

    // sort by
    

    return []
  },
} as Service2

async function visibleElemHandles(arr: ElementHandleForTag<any>[]) {
  // console.log('===== visibleElemHandles', arr.length)
  const filtered = []
  for await (const x of arr) {
    if (await x.isVisible()) filtered.push(x)
    const box = await x.boundingBox()
    // console.log(await x.isVisible(), box)
    // if (box && box.width != 0 && box.height != 0) filtered.push(x)
  }
  // console.log('##### visibleElemHandles', filtered.length)
  return filtered
}

async function srcDsrHelper(
  srcOrDstInput: ElementHandleForTag<any>,
  srcOrDstStr: string,
  page: Page,
  hint: 'depart' | 'return',
) {
  srcOrDstInput.fill(srcOrDstStr)
  let uls: ElementHandleForTag<any>[] = []
  {
    const waitStart = Date.now()
    while (uls.length != 1) {
      if (Date.now() - waitStart > 10000)
        throw new Error(`Waited too long for ${hint} dropdown list!`)
      uls = await visibleElemHandles(await page.$$('ul'))
    }
  }
  const lis = await visibleElemHandles(await uls[0].$$('li'))
  // console.log('lis', await Promise.all(lis.map(x => x.textContent())))
  await lis[0].click()
}

async function dateHelper(
  date: Date,
  input: ElementHandleForTag<any>,
  page: Page,
) {
  const myDate = getMyDate(date)
  await input.fill(`${myDate.year}-${myDate.month}-${myDate.day}`)
  await input.press('Enter')
  await page.waitForTimeout(1000) // important, must > 500
}
