# 拍立签（微信小程序）

批量拍照、自动贴标签、相册编辑、批量导出到手机相册。

## 功能
- 自定义标签（可多个同时激活），拍照自动把标签合成到照片
- 批量连拍、批量导出到系统相册
- 编辑照片：增删标签、6 个位置、10 种颜色、大小调节、备注
- 数据仅存手机本地，不上传服务器

## 部署步骤
1. 注册小程序账号：https://mp.weixin.qq.com （个人主体免费）
2. 下载微信开发者工具：https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html
3. 下载本仓库代码：Code → Download ZIP，解压
4. 开发者工具 → 导入项目 → 选择解压目录，AppID 填你自己的（或先用测试号体验）
5. 点“预览”扫码在手机上真机测试
6. 点“上传”→ 到 mp.weixin.qq.com 提交审核 → 审核通过后点“发布”

## 注意
- 相机、保存相册权限会在首次使用时弹窗请求
- project.config.json 中 appid 为 touristappid（测试号），正式发布前换成自己的 AppID
