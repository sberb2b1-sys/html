export function isValidEmail(email) {
  return email.includes('@') && email.includes('.')
}

export function isValidPassword(password) {
  return password.length >= 3
}

const REGISTERED_USERS_KEY = 'registeredUsers'

export function getRegisteredUsers() {
  try {
    return JSON.parse(localStorage.getItem(REGISTERED_USERS_KEY) || '[]')
  } catch {
    return []
  }
}

export function isEmailRegistered(email) {
  const normalized = email.trim().toLowerCase()
  return getRegisteredUsers().some((u) => u.email.toLowerCase() === normalized)
}

export function saveUser(name, email) {
  const user = { name: name.trim(), email: email.trim(), provider: 'email' }
  localStorage.setItem('user', JSON.stringify(user))
  localStorage.setItem('isAuth', 'true')
  return user
}

export function registerUser(name, email, password) {
  const trimmedName = name.trim()
  const trimmedEmail = email.trim()

  if (isEmailRegistered(trimmedEmail)) {
    return { error: 'Пользователь с таким email уже существует' }
  }

  const users = getRegisteredUsers()
  users.push({ name: trimmedName, email: trimmedEmail, password })
  localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users))

  const user = saveUser(trimmedName, trimmedEmail)
  return { user }
}
