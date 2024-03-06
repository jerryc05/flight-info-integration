import { BrowserContext } from 'playwright-core'

export type Ticket1 = {
  priceWithUrl: {
    usdPrice: number
    url: string
  }
  steps: {
    airline: string
    departLocalTimeIgnoreTz: Date
    departAirport: string
    arrivalLocalTimeIgnoreTz: Date
    arrivalAirport: string
  }[]
}

export type Ticket2 = {
  priceWithUrl: {
    usdPrice: number
    url: string
    respectBags: boolean
  }
  departAirport: string
  arrivalAirport: string
  stopAirports: string[]
  totalHrMin: [number, number]
}

type Ticket = Ticket1 | Ticket2

export type GenUrlInfo = {
  srcIatas: string[]
  dstIatas: string[]
  departDates: Date[]
  returnDates?: Date[]
  carryOn?: number
  checkedBags?: number
  mostStops?: 0 | 1 | true
}

export type Service = {
  gen_url(args: GenUrlInfo): string[]
  run(ctx: BrowserContext, url: string): Promise<Ticket[]>
}

export type Service2 = {
  run(ctx: BrowserContext, args: Readonly<GenUrlInfo>): Promise<Ticket[]>
}

export const getMyDate = (date: Date) => ({
  year: date.getFullYear(),
  month: date.getUTCMonth() + 1,
  day: date.getUTCDate(),
})

export function parseHrMinText(
  text_: string | undefined | null,
): Ticket2['totalHrMin'] {
  if (text_ != null) {
    let text = text_
    if (text.endsWith('m')) text = text.substring(0, text.length - 1)
    const mapped = text.split('h').map(parseFloat)
    if (mapped.length === 2) {
      return [mapped[0], mapped[1]]
    }
    if (mapped.length === 1) {
      return [0, mapped[0]]
    }
  }
  return [NaN, NaN]
}
