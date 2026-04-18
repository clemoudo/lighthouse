import { auth } from "../lib/auth"

declare global {
  namespace Express {
    interface Request {
      user: typeof auth.$Infer.Session.user | null
      session: typeof auth.$Infer.Session.session | null
    }
  }
}
