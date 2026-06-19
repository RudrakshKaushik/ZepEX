import { Plus, Power, PowerOff, Shield } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import {
  activatePolicyRule,
  createCompanyPolicy,
  createPolicyRule,
  deactivatePolicyRule,
  listPolicyRules,
  updatePolicyRule,
} from '@/api'
import { getApiErrorMessage } from '@/api/client'
import { AdminListPanel } from '@/components/admin/AdminListPanel'
import { AdminModalFooter } from '@/components/admin/AdminModalFooter'
import { AdminPolicyRuleCard } from '@/components/admin/AdminPolicyRuleCard'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAdminNav } from '@/hooks/useAdminNav'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { PageLoader } from '@/components/ui/spinner'
import type { PolicyRule } from '@/types'

export function PolicyPage() {
  const { navItems } = useAdminNav()
  const [rules, setRules] = useState<PolicyRule[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [open, setOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<PolicyRule | null>(null)
  const [form, setForm] = useState({
    category_name: '',
    max_amount: '',
    category_description: '',
  })
  const [editForm, setEditForm] = useState({
    max_amount: '',
    category_description: '',
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await listPolicyRules()
      setRules(data)
    } catch {
      setRules([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const activeRules = rules.filter((r) => r.is_active !== false)

  const initPolicy = async () => {
    setSaving(true)
    setError('')
    try {
      await createCompanyPolicy()
      setMessage('Company policy created. You can now add rules.')
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await createPolicyRule({
        category_name: form.category_name,
        max_amount: parseFloat(form.max_amount),
        category_description: form.category_description,
      })
      setForm({ category_name: '', max_amount: '', category_description: '' })
      setOpen(false)
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (rule: PolicyRule) => {
    setEditing(rule)
    setEditForm({
      max_amount: rule.max_amount,
      category_description: rule.category_description,
    })
    setError('')
    setEditOpen(true)
  }

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault()
    if (!editing) return
    setSaving(true)
    setError('')
    try {
      await updatePolicyRule(editing.id, {
        max_amount: parseFloat(editForm.max_amount),
        category_description: editForm.category_description,
      })
      setEditOpen(false)
      setEditing(null)
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const toggleRule = async (rule: PolicyRule) => {
    setSaving(true)
    setError('')
    try {
      if (rule.is_active === false) {
        await activatePolicyRule(rule.id)
      } else {
        await deactivatePolicyRule(rule.id)
      }
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <PageLoader />

  return (
    <DashboardLayout
      title="Expense Policy"
      subtitle="Set category spending limits"
      breadcrumb="Expense Policy"
      icon={Shield}
      navItems={navItems}
      headerAction={
        <>
          <Button variant="outline" onClick={initPolicy} disabled={saving}>
            Initialize Company Policy
          </Button>
          <Button onClick={() => { setError(''); setOpen(true) }}>
            Add Policy Rules
            <Plus className="h-4 w-4" />
          </Button>
        </>
      }
    >
      {message && (
        <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
          {message}
        </div>
      )}
      {error && !open && !editOpen && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <AdminListPanel
        title="Active Rules"
        count={activeRules.length}
        description="Manage active policies, approval rules, and automation settings in one place."
      >
        {activeRules.length === 0 ? (
          <p className="px-5 py-8 text-sm text-gray-400 sm:px-6">No policy rules configured.</p>
        ) : (
          <div>
            {activeRules.map((rule) => (
              <AdminPolicyRuleCard key={rule.id} rule={rule} onEdit={() => openEdit(rule)} />
            ))}
          </div>
        )}
      </AdminListPanel>

      {rules.some((r) => r.is_active === false) && (
        <div className="mt-6">
          <AdminListPanel
            title="Inactive Rules"
            count={rules.filter((r) => r.is_active === false).length}
          >
            {rules
              .filter((r) => r.is_active === false)
              .map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-center justify-between border-b border-[#e2e8f0] px-5 py-3 last:border-b-0 sm:px-6"
                >
                  <span className="text-sm capitalize text-gray-600">
                    {rule.category_name.replace(/_/g, ' ')}
                  </span>
                  <Button size="sm" variant="ghost" disabled={saving} onClick={() => toggleRule(rule)}>
                    <Power className="h-3.5 w-3.5 text-green-600" />
                    Activate
                  </Button>
                </div>
              ))}
          </AdminListPanel>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Policy Rule</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="space-y-2">
              <Label>Rule Name</Label>
              <Input
                value={form.category_name}
                onChange={(e) => setForm({ ...form, category_name: e.target.value })}
                placeholder="Flight Ticket"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.category_description}
                onChange={(e) => setForm({ ...form, category_description: e.target.value })}
                placeholder="This is just a small description for this section"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Limit Amount (INR)</Label>
              <Input
                type="number"
                value={form.max_amount}
                onChange={(e) => setForm({ ...form, max_amount: e.target.value })}
                required
              />
            </div>
            {error && open && <p className="text-sm text-red-600">{error}</p>}
            <AdminModalFooter onCancel={() => setOpen(false)} submitLabel="Add" submitting={saving} />
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="capitalize">
              Edit {editing?.category_name.replace(/_/g, ' ')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-3">
            <div className="space-y-2">
              <Label>Limit Amount (INR)</Label>
              <Input
                type="number"
                value={editForm.max_amount}
                onChange={(e) => setEditForm({ ...editForm, max_amount: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={editForm.category_description}
                onChange={(e) =>
                  setEditForm({ ...editForm, category_description: e.target.value })
                }
                required
              />
            </div>
            <div className="flex gap-2">
              {editing && editing.is_active !== false && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={saving}
                  onClick={() => {
                    toggleRule(editing)
                    setEditOpen(false)
                  }}
                >
                  <PowerOff className="h-4 w-4" />
                  Deactivate
                </Button>
              )}
            </div>
            {error && editOpen && <p className="text-sm text-red-600">{error}</p>}
            <AdminModalFooter onCancel={() => setEditOpen(false)} submitLabel="Save" submitting={saving} />
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
