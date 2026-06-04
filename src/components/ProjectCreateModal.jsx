import { useState } from 'react'
import toast from 'react-hot-toast'
import Modal from './Modal'

export default function ProjectCreateModal({ open, onClose, onSave }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Введите название проекта')
      return
    }
    onSave({ name: name.trim(), description: description.trim() })
    setName('')
    setDescription('')
    onClose()
  }

  const handleClose = () => {
    setName('')
    setDescription('')
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Новый проект">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="project-name" className="text-sm text-gray-400">Название проекта</label>
          <input
            id="project-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Мой проект"
            className="px-4 py-3 rounded-xl border border-dark-border bg-dark-card text-sm text-white placeholder:text-gray-500 outline-none focus:border-accent-purple/50"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="project-desc" className="text-sm text-gray-400">Описание</label>
          <textarea
            id="project-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Краткое описание проекта"
            className="px-4 py-3 rounded-xl border border-dark-border bg-dark-card text-sm text-white placeholder:text-gray-500 outline-none focus:border-accent-purple/50 resize-none"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={handleClose} className="flex-1 px-4 py-2.5 rounded-lg border border-dark-border text-sm text-gray-400 hover:bg-dark-hover">
            Отмена
          </button>
          <button type="button" onClick={handleSave} className="flex-1 btn-primary justify-center py-2.5">
            Создать
          </button>
        </div>
      </div>
    </Modal>
  )
}
