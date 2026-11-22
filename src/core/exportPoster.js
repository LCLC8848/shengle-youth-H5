import { nextTick } from 'vue'

async function decoded(img) {
  // The load/error listeners are installed before testing complete to avoid a race.
  if (!img.complete) await new Promise((resolve, reject) => {
    function finish(event) {
      img.removeEventListener('load', finish)
      img.removeEventListener('error', finish)
      if (event.type === 'load') resolve()
      else reject(new Error('海报图片加载失败。'))
    }
    img.addEventListener('load', finish)
    img.addEventListener('error', finish)
  })
  if (!img.naturalWidth) throw new Error('海报图片加载失败。')
  if (img.decode) await img.decode()
}
export async function exportPoster(root) {
  await nextTick()
  const [module] = await Promise.all([
    import('html2canvas'),
    Promise.all(Array.from(root.querySelectorAll('img'), decoded)),
    document.fonts?.ready,
  ])
  const canvas = await module.default(root, {
    // Fixed 320 × 568 layout gives a consistent 960 × 1704 PNG across phones.
    width: 320, height: 568, scale: 3, useCORS: true, allowTaint: false,
    backgroundColor: null, logging: false, imageTimeout: 10000,
    // The export target lives outside the animation/clip/scratch tree.
    onclone(doc) {
      const host = doc.querySelector('.export-host')
      if (host) Object.assign(host.style, { left: '0px', top: '0px' })
    },
  })
  return new Promise((resolve, reject) => canvas.toBlob(blob =>
    blob ? resolve(blob) : reject(new Error('PNG 编码失败。')), 'image/png'))
}

