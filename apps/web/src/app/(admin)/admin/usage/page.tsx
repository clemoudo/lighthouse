"use client"

import { useState, useMemo, Suspense } from "react"
import { Card, Row, Col, Statistic, DatePicker, Select, Space, Button, Empty, Flex } from "antd"
import { Activity, Calendar, Zap, Cpu, RefreshCw, TrendingUp, User as UserIcon } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { useGetAdminStatsUsage } from "@/api/generated/lighthouse"
import type { DailyUsage, UsageByModel, UsageByIntent } from "@/api/generated/model"
import dynamicImport from "next/dynamic"
import dayjs from "dayjs"
import { useSearchParams } from "next/navigation"

// Dynamically import charts to avoid SSR issues
const Line = dynamicImport(() => import("@ant-design/plots").then((mod) => mod.Line), {
  ssr: false,
})
const Pie = dynamicImport(() => import("@ant-design/plots").then((mod) => mod.Pie), { ssr: false })

const { RangePicker } = DatePicker

const UsageDashboardContent = () => {
  const searchParams = useSearchParams()
  const initialUserId = searchParams.get("userId")

  // States for filters
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, "days"),
    dayjs(),
  ])
  const [selectedModel, setSelectedModel] = useState<string | undefined>(undefined)
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(
    initialUserId || undefined,
  )

  // Fetch usage stats
  const {
    data: response,
    isLoading,
    refetch,
    isFetching,
  } = useGetAdminStatsUsage(
    {
      from: dateRange[0].toISOString(),
      to: dateRange[1].toISOString(),
      userId: selectedUserId,
      model: selectedModel,
    },
    {
      query: {
        placeholderData: (previousData) => previousData,
      },
    },
  )

  const data = response?.status === 200 ? response.data : undefined

  // Chart configurations
  const lineConfig = useMemo(() => {
    if (!data?.dailyUsage) return null

    // We want to show both prompt and completion tokens
    const plotData = data.dailyUsage.flatMap((d: DailyUsage) => [
      { date: d.date, value: d.promptTokens, type: "Prompt" },
      { date: d.date, value: d.completionTokens, type: "Completion" },
    ])

    return {
      data: plotData,
      xField: "date",
      yField: "value",
      seriesField: "type",
      colorField: "type",
      stack: true,
      smooth: true,
      legend: { position: "top" as const },
    }
  }, [data])

  const modelPieConfig = useMemo(() => {
    if (!data?.byModel) return null
    return {
      data: data.byModel,
      angleField: "totalTokens",
      colorField: "model",
      radius: 0.8,
      label: {
        text: (d: UsageByModel) =>
          `${d.model}\n${((d.totalTokens / (data?.summary.totalTokens || 1)) * 100).toFixed(1)}%`,
        position: "outside",
      },
      legend: { position: "bottom" as const },
    }
  }, [data])

  const intentPieConfig = useMemo(() => {
    if (!data?.byIntent) return null
    return {
      data: data.byIntent,
      angleField: "totalTokens",
      colorField: "intent",
      radius: 0.8,
      innerRadius: 0.6,
      label: {
        text: (d: UsageByIntent) =>
          `${((d.totalTokens / (data?.summary.totalTokens || 1)) * 100).toFixed(0)}%`,
        position: "inside",
        style: { fontSize: 14, textAlign: "center" },
      },
      legend: { position: "bottom" as const },
    }
  }, [data])

  return (
    <div className="space-y-6">
      <PageHeader
        title={selectedUserId ? "Détail de consommation" : "Statistiques d'utilisation"}
        description={
          selectedUserId
            ? `Analyse de la consommation pour l'utilisateur sélectionné.`
            : "Suivez la consommation globale de tokens et les performances de l'IA."
        }
        icon={Activity}
      />

      {/* Filters */}
      <Card className="shadow-sm">
        <Flex justify="between" align="center" wrap="wrap" gap={16}>
          <Space wrap size="middle">
            <RangePicker
              value={dateRange}
              onChange={(dates) => dates && setDateRange([dates[0]!, dates[1]!])}
              allowClear={false}
              format="DD/MM/YYYY"
            />
            <Select
              placeholder="Tous les modèles"
              style={{ width: 180 }}
              allowClear
              onChange={setSelectedModel}
              options={[
                { label: "Mistral Small", value: "mistral-small-latest" },
                { label: "Mistral Large", value: "mistral-large-latest" },
                { label: "GPT-4o", value: "gpt-4o" },
              ]}
            />
            {selectedUserId && (
              <Button icon={<RefreshCw size={14} />} onClick={() => setSelectedUserId(undefined)}>
                Réinitialiser l'utilisateur
              </Button>
            )}
          </Space>
          <Button
            icon={<RefreshCw className={isFetching ? "animate-spin" : ""} size={16} />}
            onClick={() => refetch()}
            disabled={isFetching}
          >
            Actualiser
          </Button>
        </Flex>
      </Card>

      {/* KPI Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm" loading={isLoading}>
            <Statistic
              title="Tokens Totaux"
              value={data?.summary.totalTokens}
              prefix={<Zap size={18} className="text-amber-500 mr-2" />}
              groupSeparator=" "
            />
            <div className="mt-2 text-xs text-muted-foreground">
              {data?.summary.promptTokens.toLocaleString() ?? 0} prompt /{" "}
              {data?.summary.completionTokens.toLocaleString() ?? 0} completion
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm" loading={isLoading}>
            <Statistic
              title="Coût Estimé"
              value={data?.summary.estimatedCost}
              precision={2}
              suffix="€"
              prefix={<TrendingUp size={18} className="text-emerald-500 mr-2" />}
            />
            <div className="mt-2 text-xs text-muted-foreground">
              Basé sur $0.50 / 1M tokens (moyenne)
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm" loading={isLoading}>
            <Statistic
              title="Messages IA"
              value={data?.summary.totalMessages}
              prefix={<Cpu size={18} className="text-blue-500 mr-2" />}
            />
            <div className="mt-2 text-xs text-muted-foreground">Nombre de réponses générées</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm" loading={isLoading}>
            <Statistic
              title="Utilisateurs Actifs"
              value={data?.summary.activeUsers}
              prefix={<UserIcon size={18} className="text-purple-500 mr-2" />}
            />
            <div className="mt-2 text-xs text-muted-foreground">Sur la période sélectionnée</div>
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            title={
              <Space>
                <Calendar size={16} />
                <span>Évolution de la consommation</span>
              </Space>
            }
            className="shadow-sm h-full"
            loading={isLoading}
          >
            {data?.dailyUsage && data.dailyUsage.length > 0 ? (
              <div className="h-[300px]">{lineConfig && <Line {...lineConfig} />}</div>
            ) : (
              <Empty description="Aucune donnée sur cette période" className="py-10" />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Flex vertical gap={16} className="h-full">
            <Card title="Répartition par Modèle" className="shadow-sm flex-1" loading={isLoading}>
              {data?.byModel && data.byModel.length > 0 ? (
                <div className="h-[200px]">{modelPieConfig && <Pie {...modelPieConfig} />}</div>
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </Card>
            <Card
              title="Répartition par Intention"
              className="shadow-sm flex-1"
              loading={isLoading}
            >
              {data?.byIntent && data.byIntent.length > 0 ? (
                <div className="h-[200px]">{intentPieConfig && <Pie {...intentPieConfig} />}</div>
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </Card>
          </Flex>
        </Col>
      </Row>
    </div>
  )
}

const UsageDashboard = () => (
  <Suspense fallback={<div>Chargement des statistiques...</div>}>
    <UsageDashboardContent />
  </Suspense>
)

export default UsageDashboard
