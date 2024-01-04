import { BrowserContext } from 'playwright-core'

export type Ticket = {
  priceWithUrl: {
    usdPrice: number
    url: string
  }[]
  steps: {
    airline: string
    departLocalTimeIgnoreTz: Date
    departAirport: string
    arrivalLocalTimeIgnoreTz: Date
    arrivalAirport: string
  }[]
}

export type GenUrlInfo = {
  srcs: string[]
  dsts: string[]
  departDate: Date
  returnDate?: Date
  carryOn?: number
  checkedBags?: number
  stops?: 0 | 1 | true
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
