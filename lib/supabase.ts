import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Only use this on the server for admin tasks (like uploading files)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function uploadSessionFile(purchaseId: string, filename: string, buffer: Buffer) {
  const filePath = `${purchaseId}/${filename}`
  const { data, error } = await supabaseAdmin.storage
    .from('session-files')
    .upload(filePath, buffer, {
      contentType: 'application/zip', // Adjust based on file
      upsert: true
    })
    
  if (error) {
    console.error('Supabase upload error:', error)
    return null
  }
  
  return filePath
}

export async function getSessionFileUrl(filePath: string) {
  const { data, error } = await supabaseAdmin.storage
    .from('session-files')
    .createSignedUrl(filePath, 3600) // Valid for 1 hour
    
  if (error) {
    console.error('Supabase url error:', error)
    return null
  }
  
  return data.signedUrl
}
