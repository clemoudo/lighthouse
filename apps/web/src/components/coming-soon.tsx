import Link from "next/link"
import { Result, Button } from "antd"
import { Construction } from "lucide-react"

export default function ComingSoon() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      <Result
        icon={<Construction className="w-20 h-20 text-primary mx-auto mb-4" />}
        title="Prochainement disponible"
        subTitle="Cette fonctionnalité est actuellement en cours de développement."
        extra={
          <Link href="/assistant">
            <Button type="primary">Retour à l&apos;Assistant</Button>
          </Link>
        }
      />
    </div>
  )
}
