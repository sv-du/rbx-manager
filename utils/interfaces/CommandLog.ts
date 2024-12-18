export default interface CommandLog {
    username: string,
    status: "Success" | "Error" | "Cancelled",
    message?: string
}