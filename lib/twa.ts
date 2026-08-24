import crypto from 'crypto'

export function validateInitData(initData: string, botToken: string): boolean {
  if (!initData || !botToken) return false

  const urlParams = new URLSearchParams(initData)
  const hash = urlParams.get('hash')
  
  if (!hash) return false

  urlParams.delete('hash')
  
  // Sort parameters alphabetically
  const params: string[] = []
  urlParams.forEach((value, key) => {
    params.push(`${key}=${value}`)
  })
  params.sort()
  
  const dataCheckString = params.join('\n')

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest()
  const expectedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex')

  return hash === expectedHash
}

export function parseInitData(initData: string) {
  const urlParams = new URLSearchParams(initData)
  const userStr = urlParams.get('user')
  
  if (!userStr) return null

  try {
    const user = JSON.parse(decodeURIComponent(userStr))
    return {
      id: user.id,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
    }
  } catch (e) {
    return null
  }
}
