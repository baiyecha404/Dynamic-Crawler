# Dynamic-Crawler

用Node.js ( puppeteer-cluster )实现的动态爬虫，参考了[LFY](https://github.com/LFYSec/CrawlerNode) dalao的思路。解决了一点bug,新增了一点功能。

## Procedure

- initPage ✔️
    - dom 构建前 hook js 
    - 开启interception 等配置
- hookNavigation ✔️
    - front-end redirect (使用[他人修改chromium源码的版本](https://github.com/myvyang/chromium_for_spider), 此处尝试204响应发现并不能拿到全部跳转url)
    - back-end redirect , 对于30x响应, 用`fetch`判断body是否为空, 从而修改相应。而location 的值通过response 入队。
    - 对于图片等资源返回自定义图片
- 收集链接 ✔️
    - 收集 src, href 等链接, 且根据base标签是否存在来parse url
    - 收集注释里的url(只支持绝对路径)。
- 事件触发 ✔️
    - dom event, 触发hook js里收集到的dom 事件
    - inline event, 查询整个DOM找出包含常见内联事件属性的节点, 对触发事件节点的子节点继续触发事件,将层数控制到三层，且对兄弟节点随机选择一个触发。
- 自动提交表单 ✔️
    - 对不同类型表单进行填充,根据name,id,class等等属性来推断填充合理的输入,并生成一个iframe接收表单提交结果。

## TODO

- url去重
- 确定url范围?
- 搭配被动扫描?


## References

https://github.com/LFYSec/CrawlerNode
https://github.com/Passer6y/CrawlerVuln
https://github.com/myvyang/chromium_for_spider
https://www.anquanke.com/post/id/178339
http://blog.fatezero.org/2018/04/09/web-scanner-crawler-02/

