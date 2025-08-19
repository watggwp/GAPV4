export type Status = "UNKNOWN" | "OFFLINE" | "ONLINE"

export interface Card {
    id: string,
    status: Status,
    time: string | null
}

export interface Column {
    id: string,
    title: string,
    cards: Card[]
}

