const EMAIL_REGEX = /[\w.+-]+@[\w.-]+\.[a-zA-Z\u0400-\u04FF]{2,}/g
const PHONE_REGEX = /(?:\+?\d[\d\s()-]{7,}\d)/g
const FIO_REGEX = /\b[А-ЯA-Z][а-яa-z]{2,}(?:\s+[А-ЯA-Z][а-яa-z]{2,})+\b/g

export function maskEmail(email) {
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return email
  }

  const [local, ...domainParts] = email.split('@')
  const domain = domainParts.join('@')
  if (!local || !domain) return email

  const visibleLength = local.length <= 1 ? 1 : 2
  const visible = local.slice(0, visibleLength)
  return `${visible}***@${domain}`
}

export function maskPhone(phone) {
  if (!phone || typeof phone !== 'string') return phone

  const digits = phone.replace(/\D/g, '')
  if (digits.length < 4) return phone

  const prefix = phone.trim().startsWith('+') ? `+${digits.slice(0, 1)}` : digits.slice(0, 1)
  const lastTwo = digits.slice(-2)
  return `${prefix}***${lastTwo}`
}

export function maskName(name) {
  if (!name || typeof name !== 'string') return name

  const trimmed = name.trim()
  if (trimmed.length < 4) return trimmed

  const parts = trimmed.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return parts
      .map((part) => `${part.charAt(0)}${'*'.repeat(Math.max(part.length - 1, 2))}`)
      .join(' ')
  }

  if (trimmed.length > 8) {
    return `${trimmed.charAt(0)}***${trimmed.slice(-1)}`
  }

  return `${trimmed.charAt(0)}***`
}

export function maskPersonalData(value, { enabled = true } = {}) {
  if (!enabled || value == null) return value

  if (typeof value !== 'string') {
    return maskPersonalData(String(value), { enabled })
  }

  let result = value
  result = result.replace(EMAIL_REGEX, (match) => maskEmail(match))
  result = result.replace(PHONE_REGEX, (match) => maskPhone(match))
  result = result.replace(FIO_REGEX, (match) => maskName(match))
  return result
}

function maskDeep(value, enabled) {
  if (!enabled) return value

  if (typeof value === 'string') {
    return maskPersonalData(value, { enabled })
  }

  if (Array.isArray(value)) {
    return value.map((item) => maskDeep(item, enabled))
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [key, maskDeep(nested, enabled)])
    )
  }

  return value
}

export function safeLog(label, payload, { enabled = true } = {}) {
  if (payload === undefined) {
    console.log(maskPersonalData(String(label), { enabled }))
    return
  }

  console.log(maskPersonalData(String(label), { enabled }), maskDeep(payload, enabled))
}

export function getDisplayUser(user, { enabled = true } = {}) {
  if (!user) {
    return { name: 'Владелец продукта', email: 'Product Owner' }
  }

  if (!enabled) {
    return {
      name: user.name || 'Пользователь',
      email: user.email || 'Product Owner',
    }
  }

  return {
    name: maskName(user.name || 'Пользователь'),
    email: user.email ? maskEmail(user.email) : 'Product Owner',
  }
}
