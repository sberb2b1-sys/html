const DEMO_VIDEOS = [
  {
    id: 'overview',
    title: 'Обзор платформы IT Team',
    description: 'Регистрация, дашборд, проекты и бэклог за 5 минут',
    url: '#',
    status: 'Скоро',
  },
  {
    id: 'agents',
    title: 'Работа с AI-агентами',
    description: 'Чаты с агентами, системные промты и DeepSeek',
    url: '#',
    status: 'Скоро',
  },
  {
    id: 'sprints',
    title: 'Спринты и командная работа',
    description: 'Планирование спринтов, общий чат, статистика',
    url: '#',
    status: 'Скоро',
  },
]

export default function DemoPage() {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="px-4 md:px-8 py-4 md:py-5 border-b border-dark-border">
        <h1 className="text-lg md:text-xl font-inter-bold text-white">Демо-видео</h1>
        <p className="text-xs md:text-sm text-gray-500 mt-1">
          Материалы для пилотных клиентов и Product Owner
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col gap-4 md:gap-6 max-w-3xl">
        <div className="card-border p-4 md:p-5 flex flex-col gap-2">
          <p className="text-sm font-inter-semibold text-white">Как записать демо</p>
          <p className="text-sm text-gray-400 leading-relaxed">
            Используйте Loom, QuickTime (macOS) или OBS Studio. Покажите регистрацию,
            создание проекта, чат с агентом и общий чат команды. Длительность — 3–7 минут.
          </p>
          <p className="text-xs text-gray-500">
            Подробная инструкция — в разделе «Демо» файла README.md в репозитории.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {DEMO_VIDEOS.map((video) => (
            <div key={video.id} className="card-border p-4 md:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-inter-semibold text-white">{video.title}</p>
                <p className="text-xs text-gray-500 mt-1">{video.description}</p>
              </div>
              <span className="shrink-0 text-xs px-3 py-1.5 rounded-full bg-[rgba(124,58,237,0.15)] text-accent-violet self-start sm:self-center">
                {video.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
