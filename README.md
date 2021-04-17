# mac dns 插件

一个在 utools 上修改 dns 的插件

## 命令列表

1. 获取 DNS  
    命令：`["gedns", "getdns", "dns", "获取 DNS"]`
2. 获取上游 DNS（路由器分配给你的 DNS）  
    命令：`["updns", "上游 DNS"]`
3. 重置 DNS：取消自定义 DNS，重设为上游 DNS  
    命令：`["redns", "清除 DNS"]`
4. 设置 DNS  
    命令：`["sedns", "setdns"]`  
    这个命令有两种形式，一种是带参数的，一种是不带参数的。  
    第一种：`sedns 127.0.0.1`，就会把你指定的 DNS 设置好。  
    第二种：直接输入 `sedns`，会列出你设置过的 DNS 历史，回车即可设置。  

## 感谢

LOGO 截取自 <https://www.elegantthemes.com/blog/tips-tricks/an-introduction-to-the-domain-name-system-dns-and-how-it-works> 头图。
