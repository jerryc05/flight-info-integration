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
  }
  departAirport: string
  arrivalAirport: string
  stopAirports: string[]
  totalHrMin: [number, number]
}

type Ticket = Ticket1 | Ticket2

export type GenUrlInfo = {
  srcs: string[]
  dsts: string[]
  departDates: Date[]
  returnDates?: Date[]
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
