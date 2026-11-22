export const maxPhotoBytes = 10 * 1024 * 1024
export const photoTypes = ['image/jpeg', 'image/png', 'image/webp']
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('图片无法读取，请换一张再试。'))
    image.src = url
  })
}
export async function preparePhoto(file) {
  if (!file || file.size > maxPhotoBytes) throw new Error('请选择 10 MB 以内的照片。')
  if (!photoTypes.includes(file.type)) throw new Error('请选择 JPG、PNG 或 WebP 格式的照片。')
  const url = URL.createObjectURL(file)
  try {
    const image = await loadImage(url)
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 640
    const side = Math.min(image.naturalWidth, image.naturalHeight)
    if (!side) throw new Error('图片尺寸无效。')
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('浏览器无法处理照片，请换一张或使用插画。')
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, 640, 640)
    ctx.drawImage(image, (image.naturalWidth - side) / 2, (image.naturalHeight - side) / 2,
      side, side, 0, 0, 640, 640)
    return canvas.toDataURL('image/jpeg', .85)
  } finally { URL.revokeObjectURL(url) }
}

