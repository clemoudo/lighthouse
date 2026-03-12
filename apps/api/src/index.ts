import { createServer } from "./server"
import { log } from "@repo/logger"

const port = process.env.API_PORT
const server = createServer()

server.listen(port, () => {
  log(`api running on ${port}`)
})
