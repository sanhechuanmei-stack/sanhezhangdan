import { createClient } from '@supabase/supabase-js';
import imageCompression from 'browser-image-compression';

const supabaseUrl = 'https://hzcinrzebmmvdiimmfuz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6Y2lucnplYm1tdmRpaW1tZnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzOTc5NzAsImV4cCI6MjA5MDk3Mzk3MH0.QBmy98uTubKm-LQWAj4vg_pNK9vofZIva024Wean018';

export const supabase = createClient(supabaseUrl, supabaseKey);

// 上传附件到 Supabase Storage，返回公开 URL（图片会自动压缩）
export async function uploadAttachment(file: File): Promise<string> {
  let fileToUpload: File | Blob = file;

  // 如果是图片，自动压缩
  if (file.type.startsWith('image/')) {
    try {
      fileToUpload = await imageCompression(file, {
        maxSizeMB: 0.5,          // 压缩到最大 500KB
        maxWidthOrHeight: 1920,  // 最大宽高 1920px
        useWebWorker: true,
      });
    } catch {
      // 压缩失败就用原文件
      fileToUpload = file;
    }
  }

  const ext = file.name.split('.').pop() || 'bin';
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from('attachments').upload(fileName, fileToUpload);
  if (error) throw error;
  const { data } = supabase.storage.from('attachments').getPublicUrl(fileName);
  return data.publicUrl;
}
