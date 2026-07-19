// 标签合成：把标签以水印形式绘制到照片上（canvas 2d）

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function drawTags(ctx, w, h, tags, style) {
  if (!tags || !tags.length) return
  const fontSize = Math.max(14, Math.round(w * style.fontScale))
  const padX = fontSize * 0.7
  const padY = fontSize * 0.42
  const gap = fontSize * 0.45
  const margin = fontSize * 0.9
  ctx.font = '600 ' + fontSize + 'px sans-serif'
  ctx.textBaseline = 'middle'

  const chips = tags.map(t => ({
    text: t,
    w: ctx.measureText(t).width + padX * 2,
    h: fontSize + padY * 2
  }))
  const totalW = chips.reduce((s, c) => s + c.w, 0) + gap * (chips.length - 1)
  const chipH = chips[0].h

  let x = margin
  const pos = style.position
  if (pos === 'tc' || pos === 'bc') x = (w - totalW) / 2
  if (pos === 'tr' || pos === 'br') x = w - totalW - margin
  const y = pos.charAt(0) === 't' ? margin : h - chipH - margin

  ctx.save()
  ctx.globalAlpha = style.opacity == null ? 0.92 : style.opacity
  chips.forEach(c => {
    ctx.fillStyle = style.color
    roundRect(ctx, x, y, c.w, chipH, chipH / 2)
    ctx.fill()
    ctx.fillStyle = style.textColor || '#ffffff'
    ctx.fillText(c.text, x + padX, y + chipH / 2 + fontSize * 0.05)
    x += c.w + gap
  })
  ctx.restore()
}

/**
 * 合成照片，返回 Promise<临时文件路径>
 * @param {object} page 页面/组件实例（用于 SelectorQuery）
 * @param {object} photo { path, tags, style }
 */
function composeToTempFile(page, photo, quality) {
  return new Promise((resolve, reject) => {
    wx.createSelectorQuery()
      .in(page)
      .select('#composeCanvas')
      .fields({ node: true, size: true })
      .exec(res => {
        if (!res || !res[0] || !res[0].node) {
          reject(new Error('canvas not found'))
          return
        }
        const canvas = res[0].node
        const ctx = canvas.getContext('2d')
        const img = canvas.createImage()
        img.onload = () => {
          canvas.width = img.width
          canvas.height = img.height
          ctx.drawImage(img, 0, 0, img.width, img.height)
          drawTags(ctx, img.width, img.height, photo.tags, photo.style)
          wx.canvasToTempFilePath({
            canvas,
            fileType: 'jpg',
            quality: quality || 0.92,
            success: r => resolve(r.tempFilePath),
            fail: reject
          })
        }
        img.onerror = reject
        img.src = photo.path
      })
  })
}

/** 合成并保存到系统相册 */
function composeToAlbum(page, photo) {
  return composeToTempFile(page, photo).then(temp =>
    new Promise((resolve, reject) => {
      wx.saveImageToPhotosAlbum({
        filePath: temp,
        success: resolve,
        fail: reject
      })
    })
  )
}

module.exports = { drawTags, composeToTempFile, composeToAlbum }
