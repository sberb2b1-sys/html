import { useOutletContext } from 'react-router-dom'

export default function ApprovalsPage() {
  const { project } = useOutletContext()

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="px-8 py-5 border-b border-dark-border">
        <h1 className="text-xl font-inter-bold text-white">Согласование</h1>
        <p className="text-sm text-gray-500 mt-1">{project?.name}</p>
      </div>
      <div className="flex-1 flex items-center justify-center p-8">
        <p className="text-sm text-gray-500">Раздел согласований в разработке</p>
      </div>
    </div>
  )
}
