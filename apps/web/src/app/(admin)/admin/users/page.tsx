"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Card,
  Table,
  Tag,
  Space,
  Input,
  Select,
  Button,
  Typography,
  Tooltip,
  Popconfirm,
  Avatar,
  App,
} from "antd"
import {
  User as UserIcon,
  Search,
  Filter,
  Ban,
  CheckCircle2,
  XCircle,
  Trash2,
  Shield,
  Calendar,
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { useSession, authClient } from "@/lib/auth-client"
import { useQuery, useMutation } from "@tanstack/react-query"
import type { ColumnsType } from "antd/es/table"

const { Text } = Typography

export default function AdminUsersPage() {
  const { message } = App.useApp()
  const { data: session } = useSession()

  // Pagination & Search States
  const [searchValue, setSearchValue] = useState("")
  const [debouncedSearchValue, setDebouncedSearchValue] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Filters
  const [filterBanned, setFilterBanned] = useState<string | null>(null)
  const [filterVerified, setFilterVerified] = useState<string | null>(null)

  // Debounce search value
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchValue(searchValue)
      setPage(1) // Reset to first page on search
    }, 500)
    return () => clearTimeout(timer)
  }, [searchValue])

  // Fetch users with TanStack Query and authClient
  const {
    data: usersResponse,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: [
      "admin",
      "users",
      debouncedSearchValue,
      filterBanned,
      filterVerified,
      page,
      pageSize,
    ],
    queryFn: async () => {
      const response = await authClient.admin.listUsers({
        query: {
          searchValue: debouncedSearchValue || undefined,
          searchField: "name",
          filterField: filterBanned ? "banned" : filterVerified ? "emailVerified" : undefined,
          filterValue: filterBanned || filterVerified || undefined,
          limit: pageSize,
          offset: (page - 1) * pageSize,
        },
      })
      if (response.error) throw new Error(response.error.message)
      return response.data
    },
  })

  // Mutations with authClient
  const { mutate: banUser, isPending: isBanning } = useMutation({
    mutationFn: async ({ userId, banReason }: { userId: string; banReason: string }) => {
      const res = await authClient.admin.banUser({ userId, banReason })
      if (res.error) throw new Error(res.error.message)
      return res.data
    },
    onSuccess: () => {
      message.success("Utilisateur banni")
      refetch()
    },
    onError: (err) => message.error(err.message || "Erreur lors du bannissement"),
  })

  const { mutate: unbanUser, isPending: isUnbanning } = useMutation({
    mutationFn: async (userId: string) => {
      const res = await authClient.admin.unbanUser({ userId })
      if (res.error) throw new Error(res.error.message)
      return res.data
    },
    onSuccess: () => {
      message.success("Utilisateur débanni")
      refetch()
    },
    onError: (err) => message.error(err.message || "Erreur lors du débannissement"),
  })

  const { mutate: removeUser, isPending: isRemoving } = useMutation({
    mutationFn: async (userId: string) => {
      const res = await authClient.admin.removeUser({ userId })
      if (res.error) throw new Error(res.error.message)
      return res.data
    },
    onSuccess: () => {
      message.success("Utilisateur supprimé")
      refetch()
    },
    onError: (err) => message.error(err.message || "Erreur lors de la suppression"),
  })

  const users = useMemo(() => usersResponse?.users ?? [], [usersResponse])
  const total = usersResponse?.total ?? 0

  const handleBan = useCallback(
    (userId: string) => {
      banUser({ userId, banReason: "Violation des conditions d'utilisation" })
    },
    [banUser],
  )

  const handleUnban = useCallback(
    (userId: string) => {
      unbanUser(userId)
    },
    [unbanUser],
  )

  const handleRemove = useCallback(
    (userId: string) => {
      removeUser(userId)
    },
    [removeUser],
  )

  const columns = useMemo<ColumnsType>(
    () => [
      {
        title: "Utilisateur",
        key: "user",
        render: (_, record) => (
          <Space>
            <Avatar
              src={record.image ?? undefined}
              icon={!record.image && <UserIcon size={14} />}
            />
            <div className="flex flex-col">
              <span className="font-medium">
                {record.name}
                {record.id === session?.user.id && (
                  <Tag color="blue" className="ml-2">
                    Moi
                  </Tag>
                )}
              </span>
              <Text type="secondary" className="text-xs">
                {record.email}
              </Text>
            </div>
          </Space>
        ),
      },
      {
        title: "Rôle",
        dataIndex: "role",
        key: "role",
        render: (role) => (
          <Tag
            color={role === "admin" ? "gold" : "default"}
            icon={role === "admin" ? <Shield size={12} /> : null}
          >
            {role?.toUpperCase()}
          </Tag>
        ),
      },
      {
        title: "Email Vérifié",
        dataIndex: "emailVerified",
        key: "emailVerified",
        render: (verified) =>
          verified ? (
            <Tag color="success" icon={<CheckCircle2 size={12} />}>
              Oui
            </Tag>
          ) : (
            <Tag color="warning" icon={<XCircle size={12} />}>
              Non
            </Tag>
          ),
      },
      {
        title: "Inscription",
        dataIndex: "createdAt",
        key: "createdAt",
        render: (date) => (
          <Tooltip title={new Date(date).toLocaleString()}>
            <Space className="text-xs">
              <Calendar size={12} className="text-muted-foreground" />
              {new Date(date).toLocaleDateString("fr-BE")}
            </Space>
          </Tooltip>
        ),
      },
      {
        title: "Statut",
        key: "status",
        render: (_, record) => {
          if (record.banned) {
            return (
              <Tooltip title={`Motif: ${record.banReason || "Non spécifié"}`}>
                <Tag color="error" icon={<Ban size={12} />}>
                  Banni{" "}
                  {record.banExpires
                    ? `jusqu'au ${new Date(record.banExpires).toLocaleDateString()}`
                    : "définitivement"}
                </Tag>
              </Tooltip>
            )
          }
          return <Tag color="processing">Actif</Tag>
        },
      },
      {
        title: "Actions",
        key: "actions",
        render: (_, record) => {
          if (record.id === session?.user.id) return null

          return (
            <Space>
              {record.banned ? (
                <Button size="small" onClick={() => handleUnban(record.id)}>
                  Débannir
                </Button>
              ) : (
                <Popconfirm
                  title="Bannir l'utilisateur ?"
                  description="L'utilisateur ne pourra plus se connecter et ses sessions seront révoquées."
                  onConfirm={() => handleBan(record.id)}
                  okText="Bannir"
                  okButtonProps={{ danger: true }}
                >
                  <Button size="small" danger icon={<Ban size={14} />}>
                    Bannir
                  </Button>
                </Popconfirm>
              )}
              <Popconfirm
                title="Supprimer définitivement ?"
                description="Cette action est irréversible."
                onConfirm={() => handleRemove(record.id)}
                okText="Supprimer"
                okButtonProps={{ danger: true }}
              >
                <Button size="small" type="text" danger icon={<Trash2 size={14} />} />
              </Popconfirm>
            </Space>
          )
        },
      },
    ],
    [session?.user.id, handleBan, handleUnban, handleRemove],
  )

  return (
    <>
      <PageHeader
        title="Gestion des Utilisateurs"
        description="Consultez et gérez les comptes utilisateurs de la plateforme."
        icon={UserIcon}
      />

      <Card className="shadow-sm">
        <Space className="mb-6 w-full justify-between" wrap>
          <Space wrap>
            <Input
              placeholder="Rechercher par nom ou email..."
              prefix={<Search size={16} className="text-muted-foreground" />}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              style={{ width: 300 }}
              allowClear
            />
            <Select
              placeholder="Statut de bannissement"
              style={{ width: 180 }}
              allowClear
              onChange={(val) => {
                setFilterBanned(val)
                setPage(1)
              }}
              options={[
                { label: "Banni", value: "true" },
                { label: "Non banni", value: "false" },
              ]}
            />
            <Select
              placeholder="Vérification email"
              style={{ width: 180 }}
              allowClear
              onChange={(val) => {
                setFilterVerified(val)
                setPage(1)
              }}
              options={[
                { label: "Vérifié", value: "true" },
                { label: "Non vérifié", value: "false" },
              ]}
            />
          </Space>
          <Button icon={<Filter size={16} />} onClick={() => refetch()}>
            Actualiser
          </Button>
        </Space>

        <Table
          dataSource={users}
          loading={isLoading || isBanning || isUnbanning || isRemoving}
          rowKey="id"
          columns={columns}
          pagination={{
            current: page,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            onChange: (p, ps) => {
              setPage(p)
              setPageSize(ps)
            },
            showTotal: (total, range) => `${range[0]}-${range[1]} sur ${total} utilisateurs`,
          }}
          locale={{ emptyText: "Aucun utilisateur trouvé." }}
        />
      </Card>
    </>
  )
}
