import { Plus } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { createCompanyPolicy, createPolicyRule, listPolicyRules } from '@/api'
import { getApiErrorMessage } from '@/api/client'
import { DashboardLayout, adminNav } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { PageLoader } from '@/components/ui/spinner'
import type { PolicyRule } from '@/types'
import { formatCurrency } from '@/lib/utils'

export function PolicyPage() {
  const [rules, setRules] = useState<PolicyRule[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    category_name: '',
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

  const handleSubmit = async (e: FormEvent) => {
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

  if (loading) return <PageLoader />

  return (
    <DashboardLayout title="Expense Policy" subtitle="Set category spending limits" navItems={adminNav}>
      {message && (
        <div className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-3">
        <Button variant="outline" onClick={initPolicy} disabled={saving}>
          Initialize company policy
        </Button>
        <Button onClick={() => { setError(''); setOpen(true) }}>
          <Plus className="h-4 w-4" />
          Add policy rule
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active rules ({rules.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <p className="text-sm text-muted-foreground">No policy rules configured.</p>
          ) : (
            <div className="space-y-3">
              {rules.map((rule) => (
                <div key={rule.id} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium capitalize">
                      {rule.category_name.replace(/_/g, ' ')}
                    </span>
                    <span className="text-sm font-semibold text-primary">
                      {formatCurrency(rule.max_amount)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{rule.category_description}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add policy rule</DialogTitle>
            <DialogDescription>Set a spending limit for an expense category.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-2">
              <Label>Category name</Label>
              <Input
                value={form.category_name}
                onChange={(e) => setForm({ ...form, category_name: e.target.value })}
                placeholder="flight_ticket"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Max amount (INR)</Label>
              <Input
                type="number"
                value={form.max_amount}
                onChange={(e) => setForm({ ...form, max_amount: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.category_description}
                onChange={(e) => setForm({ ...form, category_description: e.target.value })}
                required
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Adding...' : 'Add rule'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
