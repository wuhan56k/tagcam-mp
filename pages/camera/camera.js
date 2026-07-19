const store = require('../../utils/store')

Page({
  data: {
    presets: [],
    active: [],
    facing: 'back',
    photoCount: 0,
    camErr: false,
    showTagModal: false,
    newTag: '',
    tagColor: store.DEFAULT_STYLE.color
  },

  onShow() {
    this.setData({
      presets: store.getPresets(),
      active: store.getActive(),
      photoCount: store.getPhotos().length
    })
  },

  onCamError() {
    this.setData({ camErr: true })
  },

  switchFacing() {
    this.setData({ facing: this.data.facing === 'back' ? 'front' : 'back' })
  },

  toggleTag(e) {
    const t = e.currentTarget.dataset.tag
    const active = this.data.active.slice()
    const i = active.indexOf(t)
    if (i >= 0) active.splice(i, 1)
    else active.push(t)
    store.saveActive(active)
    this.setData({ active })
  },

  openTagModal() { this.setData({ showTagModal: true }) },
  closeTagModal() { this.setData({ showTagModal: false, newTag: '' }) },
  onNewTagInput(e) { this.setData({ newTag: e.detail.value }) },

  addPreset() {
    const t = (this.data.newTag || '').trim()
    if (!t) return
    const presets = this.data.presets.slice()
    if (presets.indexOf(t) < 0) presets.push(t)
    const active = this.data.active.slice()
    if (active.indexOf(t) < 0) active.push(t)
    store.savePresets(presets)
    store.saveActive(active)
    this.setData({ presets, active, newTag: '' })
  },

  removePreset(e) {
    const t = e.currentTarget.dataset.tag
    const presets = this.data.presets.filter(x => x !== t)
    const active = this.data.active.filter(x => x !== t)
    store.savePresets(presets)
    store.saveActive(active)
    this.setData({ presets, active })
  },

  // 拍照并保存（照片持久化到本地文件，标签记录到存储）
  capture() {
    const cam = wx.createCameraContext(this)
    cam.takePhoto({
      quality: 'high',
      success: res => this.persistPhoto(res.tempImagePath),
      fail: () => wx.showToast({ title: '拍摄失败', icon: 'none' })
    })
  },

  persistPhoto(tempPath) {
    wx.getFileSystemManager().saveFile({
      tempFilePath: tempPath,
      success: r => {
        const count = store.addPhoto({
          id: Date.now() + '-' + Math.random().toString(36).slice(2, 8),
          path: r.savedFilePath,
          tags: this.data.active.slice(),
          style: Object.assign({}, store.DEFAULT_STYLE),
          note: '',
          createdAt: Date.now()
        })
        this.setData({ photoCount: count })
        wx.showToast({ title: '已拍照并贴标', icon: 'success' })
      },
      fail: () => wx.showToast({ title: '保存失败', icon: 'none' })
    })
  },

  // 相机不可用时：从相册/系统相机导入
  importPhotos() {
    wx.chooseMedia({
      count: 9,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: res => {
        const files = res.tempFiles || []
        let done = 0
        if (!files.length) return
        files.forEach(f => {
          wx.getFileSystemManager().saveFile({
            tempFilePath: f.tempFilePath,
            success: r => {
              store.addPhoto({
                id: Date.now() + '-' + Math.random().toString(36).slice(2, 8),
                path: r.savedFilePath,
                tags: this.data.active.slice(),
                style: Object.assign({}, store.DEFAULT_STYLE),
                note: '',
                createdAt: Date.now()
              })
            },
            complete: () => {
              done++
              if (done === files.length) {
                this.setData({ photoCount: store.getPhotos().length })
                wx.showToast({ title: '已导入' + files.length + '张', icon: 'success' })
              }
            }
          })
        })
      }
    })
  },

  goAlbum() {
    wx.navigateTo({ url: '/pages/album/album' })
  }
})
