const PHOTOS_KEY = 'photos'
const PRESETS_KEY = 'presets'
const ACTIVE_KEY = 'activeTags'

const DEFAULT_STYLE = {
  position: 'bl',   // tl tc tr bl bc br
  color: '#f97316',
  textColor: '#ffffff',
  fontScale: 0.038, // 字号相对图宽比例
  opacity: 0.92
}

const TAG_COLORS = [
  '#f97316', '#ef4444', '#eab308', '#22c55e', '#06b6d4',
  '#3b82f6', '#8b5cf6', '#ec4899', '#111827', '#6b7280'
]

function read(key, def) {
  try {
    const v = wx.getStorageSync(key)
    return v === '' || v == null ? def : v
  } catch (e) { return def }
}

function getPhotos() { return read(PHOTOS_KEY, []) }
function savePhotos(list) { wx.setStorageSync(PHOTOS_KEY, list) }

function addPhoto(p) {
  const list = getPhotos()
  list.unshift(p)
  savePhotos(list)
  return list.length
}

function updatePhoto(p) {
  savePhotos(getPhotos().map(x => (x.id === p.id ? p : x)))
}

function removePhotos(ids) {
  savePhotos(getPhotos().filter(x => ids.indexOf(x.id) < 0))
}

function getPresets() { return read(PRESETS_KEY, ['合格', '待检', '样品']) }
function savePresets(list) { wx.setStorageSync(PRESETS_KEY, list) }
function getActive() { return read(ACTIVE_KEY, []) }
function saveActive(list) { wx.setStorageSync(ACTIVE_KEY, list) }

module.exports = {
  DEFAULT_STYLE, TAG_COLORS,
  getPhotos, addPhoto, updatePhoto, removePhotos,
  getPresets, savePresets, getActive, saveActive
}
