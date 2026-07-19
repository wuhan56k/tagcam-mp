const store = require('../../utils/store')
const compose = require('../../utils/compose')

Page({
  data: {
    photos: [],
    selecting: false,
    selected: {},
    selectedCount: 0,
    saving: false
  },

  onShow() {
    this.load()
  },

  load() {
    const photos = store.getPhotos().map(p => this.decorate(p))
    this.setData({ photos, selecting: false, selected: {}, selectedCount: 0 })
  },

  // 计算标签浮层样式（展示用；导出时用 canvas 精确合成）
  decorate(p) {
    const pos = p.style.position || 'bl'
    const v = pos.charAt(0) === 't' ? 'ov-t' : 'ov-b'
    const hMap = { l: 'ov-l', c: 'ov-c', r: 'ov-r' }
    p.ovClass = 'ov ' + v + ' ' + hMap[pos.charAt(1)]
    p.chipStyle =
      'background:' + p.style.color +
      ';opacity:' + (p.style.opacity == null ? 0.92 : p.style.opacity) +
      ';font-size:' + Math.max(16, Math.round(p.style.fontScale * 640)) + 'rpx;'
    return p
  },

  toggleSelectMode() {
    this.setData({
      selecting: !this.data.selecting,
      selected: {},
      selectedCount: 0
    })
  },

  tapCell(e) {
    const id = e.currentTarget.dataset.id
    if (this.data.selecting) {
      const selected = Object.assign({}, this.data.selected)
      if (selected[id]) delete selected[id]
      else selected[id] = true
      this.setData({ selected, selectedCount: Object.keys(selected).length })
    } else {
      wx.navigateTo({ url: '/pages/editor/editor?id=' + id })
    }
  },

  toggleAll() {
    const all = this.data.photos.length > 0 &&
      this.data.selectedCount === this.data.photos.length
    const selected = {}
    if (!all) this.data.photos.forEach(p => { selected[p.id] = true })
    this.setData({ selected, selectedCount: Object.keys(selected).length })
  },

  deleteSelected() {
    const ids = Object.keys(this.data.selected)
    if (!ids.length) return
    wx.showModal({
      title: '删除所选照片？',
      content: '将删除 ' + ids.length + ' 张照片，删除后无法恢复。',
      confirmColor: '#ef4444',
      success: r => {
        if (!r.confirm) return
        store.removePhotos(ids)
        this.load()
        wx.showToast({ title: '已删除', icon: 'success' })
      }
    })
  },

  // 批量合成并保存到系统相册
  saveBatch() {
    const targets = this.data.selecting
      ? this.data.photos.filter(p => this.data.selected[p.id])
      : this.data.photos
    if (!targets.length) {
      wx.showToast({ title: '没有可导出的照片', icon: 'none' })
      return
    }
    if (this.data.saving) return
    this.setData({ saving: true })
    wx.showLoading({ title: '导出中 0/' + targets.length, mask: true })

    const run = i => {
      if (i >= targets.length) {
        wx.hideLoading()
        this.setData({ saving: false, selecting: false, selected: {}, selectedCount: 0 })
        wx.showToast({ title: '已保存' + targets.length + '张到相册', icon: 'success' })
        return
      }
      wx.showLoading({ title: '导出中 ' + (i + 1) + '/' + targets.length, mask: true })
      compose.composeToAlbum(this, targets[i])
        .then(() => run(i + 1))
        .catch(() => {
          wx.hideLoading()
          this.setData({ saving: false })
          wx.showModal({
            title: '导出中断',
            content: '请检查是否已授权保存到相册（可在设置中开启）',
            confirmText: '去设置',
            success: r => { if (r.confirm) wx.openSetting() }
          })
        })
    }
    run(0)
  }
})
