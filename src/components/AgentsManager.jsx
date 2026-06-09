import { useState } from 'react'
import toast from 'react-hot-toast'
import Modal from './Modal'
import ConfirmDialog from './ConfirmDialog'

export default function AgentsManager({ agents, onCreate, onUpdate, onDelete }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [form, setForm] = useState({
    id: '',
    name: '',
    role: '',
    avatarUrl: '',
    systemPrompt: '',
  })

  const openCreate = () => {
    setEditing(null)
    setForm({ id: '', name: '', role: '', avatarUrl: '', systemPrompt: '' })
    setModalOpen(true)
  }

  const openEdit = (agent) => {
    setEditing(agent)
    setForm({
      id: agent.id,
      name: agent.name,
      role: agent.role,
      avatarUrl: agent.avatarUrl || '',
      systemPrompt: agent.systemPrompt || '',
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.role.trim()) {
      toast.error('Заполните имя и роль')
      return
    }
    if (editing) {
      await onUpdate(editing.id, form)
    } else {
      if (!form.id.trim()) {
        toast.error('Укажите ID агента (латиница, например: qa)')
        return
      }
      await onCreate(form)
    }
    setModalOpen(false)
  }

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-inter-bold text-white">Управление агентами</h1>
          <p className="text-sm text-gray-500 mt-1">Доступно только для Product Owner</p>
        </div>
        <button type="button" className="btn-primary" onClick={openCreate}>
          + Новый агент
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {agents.map((agent) => (
          <div key={agent.id} className="card-border p-4 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              {agent.avatarUrl ? (
                <img src={agent.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-inter-semibold text-white"
                  style={{ backgroundColor: agent.avatarColor }}
                >
                  {agent.name.charAt(0)}
                </div>
              )}
              <div>
                <p className="text-sm font-inter-semibold text-white">{agent.name}</p>
                <p className="text-xs text-gray-500">{agent.role} • {agent.id}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 line-clamp-2">{agent.systemPrompt || '—'}</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => openEdit(agent)} className="text-xs text-accent-violet hover:underline">
                Редактировать
              </button>
              <button type="button" onClick={() => setDeleteTarget(agent)} className="text-xs text-red-400 hover:underline">
                Удалить
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Редактировать агента' : 'Новый агент'}>
        <div className="flex flex-col gap-3">
          {!editing && (
            <input
              type="text"
              value={form.id}
              onChange={(e) => setForm({ ...form, id: e.target.value })}
              placeholder="ID (например: qa)"
              className="px-4 py-3 rounded-xl border border-dark-border bg-dark-card text-sm text-white outline-none"
            />
          )}
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Имя"
            className="px-4 py-3 rounded-xl border border-dark-border bg-dark-card text-sm text-white outline-none"
          />
          <input
            type="text"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            placeholder="Роль"
            className="px-4 py-3 rounded-xl border border-dark-border bg-dark-card text-sm text-white outline-none"
          />
          <input
            type="url"
            value={form.avatarUrl}
            onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })}
            placeholder="URL аватара (опционально)"
            className="px-4 py-3 rounded-xl border border-dark-border bg-dark-card text-sm text-white outline-none"
          />
          <textarea
            value={form.systemPrompt}
            onChange={(e) => setForm({ ...form, systemPrompt: e.target.value })}
            rows={4}
            placeholder="Системный промт для DeepSeek"
            className="px-4 py-3 rounded-xl border border-dark-border bg-dark-card text-sm text-white outline-none resize-none"
          />
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2.5 rounded-lg border border-dark-border text-sm text-gray-400">
              Отмена
            </button>
            <button type="button" onClick={handleSave} className="flex-1 btn-primary justify-center py-2.5">
              Сохранить
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Удалить агента?"
        message={`Агент «${deleteTarget?.name}» будет удалён.`}
        confirmLabel="Удалить"
        onConfirm={async () => {
          await onDelete(deleteTarget.id)
          setDeleteTarget(null)
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
