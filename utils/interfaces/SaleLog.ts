export default interface SalesLog {
    id: number,
    idHash: string,
    created: Date,
    isPending: boolean,
    agent: {
        id: number,
        type: string,
        name: string
    },
    details: {
        id: number,
        name: string,
        type: string
    },
    currency: {
        amount: number,
        type: string
    }
}