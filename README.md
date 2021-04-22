# DNS 切换 for MacOS

[GitHub 地址](https://github.com/lengthmin/utools-dns)

一个修改 DNS 的 uTools 插件

![demo](https://cdn.jsdelivr.net/gh/riril/i@master/images/1619010171108-1619010171103.png)

## 命令列表

1. 获取 DNS  
    命令：`["gedns", "getdns", "dns", "获取 DNS"]`
    ![gedns](https://cdn.jsdelivr.net/gh/riril/i@master/images/1619010005637-1619010005633.png)
2. 获取上游 DNS（路由器分配给你的 DNS）  
    命令：`["updns", "上游 DNS"]`
    ![updns](https://cdn.jsdelivr.net/gh/riril/i@master/images/1619009981015-1619009981011.png)
3. 重置 DNS：取消自定义 DNS，重设为上游 DNS  
    命令：`["redns", "清除 DNS"]`
4. 设置 DNS  
    命令：`["sedns", "setdns"]`  
    这个命令有两种形式，一种是带参数的，一种是不带参数的。  
    第一种：`sedns 127.0.0.1`，就会把你指定的 DNS 设置好。  
    ![sedns1](https://cdn.jsdelivr.net/gh/riril/i@master/images/1619010386590-1619010386589.png)
    第二种：直接输入 `sedns`，会列出你设置过的 DNS 历史，回车即可设置。或者这一步你也可以手动输入想设置的 DNS。  
    ![sedns2](https://cdn.jsdelivr.net/gh/riril/i@master/images/1619010298081-1619010298079.png)
    ![sedns3](https://cdn.jsdelivr.net/gh/riril/i@master/images/1619010339306-1619010339305.png)

## 感谢

LOGO 截取自 <https://www.elegantthemes.com/blog/tips-tricks/an-introduction-to-the-domain-name-system-dns-and-how-it-works> 头图。
