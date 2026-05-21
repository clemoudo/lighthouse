"use client"

import { Button, Result, Flex } from "antd"
import Link from "next/link"

const NotFound = () => {
  return (
    <Flex align="center" justify="center" className="min-h-screen p-4">
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
    </Flex>
  )
}

export default NotFound
