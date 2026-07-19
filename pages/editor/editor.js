const store = require('../../utils/store')
const compose = require('../../utils/compose')

const POSITIONS = ['tl', 'tc', 'tr', 'bl', 'bc', 'br']
const POS_LABEL = { tl: '↖', tc: '↑', tr: '↗', bl: '↙', bc: '↓', br: '↘' }

Page({
  data: {
    draft: null,
    presets: [],
    positions: POSITIONS.map(k => ({ key: k, label: POS_LABEL[k] })),
    colors: store.TAG_COLORS,
    newTag: '',
    ovClass: '',
    chipStyle: '',
    sliderVal: 38,
    saving: false
  },

  onLoad(options) {
    const photo = store.getPhotos().find(p => p.id === options.id)
    if (!photo) {
      wx.showToast({ title: '照片不存在', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 800)
      return
    }
    this.setData({
      draft: JSON.parse(JSON.stringify(photo)),
      presets: store.getPresets(),
      sliderVal: Math.round((photo.style.fontScale || 0.038) * 1000)
    })
    this.refreshOverlay()
  },

  refreshOverlay() {
    const d = this.data.draft
    if (!d) return
    const pos = d.style.position || 'bl'
    const v = pos.charAt(0) === 't' ? 'ov-t' : 'ov-b'
    const hMap = { l: 'ov-l', c: 'ov-c', r: 'ov-r' }
    this.setData({
      ovClass: 'ov ' + v + ' ' + hMap[pos.charAt(1)],
      chipStyle:
        'background:' + d.style.color +
        ';opacity:' + (d.style.opacity == null ? 0.92 : d.style.opacity) +
        ';font-size:' + Math.max(20, Math.round(d.style.fontScale * 1100)) + 'rpx;'
    })
  },

  setDraft(patch) {
    this.setData({ draft: Object.assign({}, this.data.draft, patch) })
  },

  setStyle(patch) {
    const style = Object.assign({}, this.data.draft.style, patch)
    this.setDraft({ style })
    this.refreshOverlay()
  },

  onNewTagInput(e) { this.setData({ newTag: e.detail.value }) },

  addTag(e) {
    const t = ((e && e.currentTarget.dataset.tag) || this.data.newTag || '').trim()
    if (!t) return
    const tags = this.data.draft.tags.slice()
    if (tags.indexOf(t) < 0) tags.push(t)
    this.setDraft({ tags })
    this.setData({ newTag: '' })
  },

  removeTag(e) {
    const t = e.currentTarget.dataset.tag
    this.setDraft({ tags: this.data.draft.tags.filter(x => x !== t) })
  },

  pickPosition(e) { this.setStyle({ position: e.currentTarget.dataset.pos }) },
  pickColor(e) { this.setStyle({ color: e.currentTarget.dataset.color }) },

  onSlider(e) {
    this.setStyle({ fontScale: e.detail.value / 1000 })
  },

  onNoteInput(e) { this.setDraft({ note: e.detail.value }) },

  save() {
    store.updatePhoto(this.data.draft)
    wx.showToast({ title: '已保存', icon: 'success' })
    setTimeout(() => wx.navigateBack(), 600)
  },

  exportOne() {
    if (this.data.saving) return
    this.setData({ saving: true })
    wx.showLoading({ title: '导出中…', mask: true })
    compose.composeToAlbum(this, this.data.draft)
      .then(() => {
        wx.hideLoading()
        this.setData({ saving: false })
        wx.showToast({ title: '已保存到相册', icon: 'success' })
      })
      .catch(() => {
        wx.hideLoading()
        this.setData({ saving: false })
        wx.showModal({
          title: '导出失败',
          content: '请检查是否已授权保存到相册',
          confirmText: '去设置',
          success: r => { if (r.confirm) wx.openSetting() }
        })
      })
  },

  remove() {
    wx.showModal({
      title: '删除这张照片？',
      content: '删除后无法恢复。',
      confirmColor: '#ef4444',
      success: r => {
        if (!r.confirm) return
        store.removePhotos([this.data.draft.id])
        wx.navigateBack()
      }
    })
  }
})
