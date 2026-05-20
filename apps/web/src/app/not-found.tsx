"use client"

import { Button, Result } from "antd"
import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Result
        status="404"
        title="404"
        subTitle="Désolé, la page que vous recherchez n'existe pas."
        extra={
          <Link href="/">
            <Button type="primary">Retour à l'accueil</Button>
          </Link>
        }
      />
    </div>
  )
}
