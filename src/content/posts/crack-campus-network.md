---
title: 如何破解校园网多设备限制
published: 2024-05-11
updated: 2024-10-03
description: 理解校园网检测多设备原理 使用 OpenWrt 破除校园网多设备限制
image: ''
tags: ["OpenWrt"]
category: 技术分享
draft: false
lang: zh_CN
---

理解校园网检测多设备原理ㅤ\
使用 OpenWrt 破除校园网多设备限制

## 前言

> 文章引用 <u>SunBK201</u> 大佬 [校园网共享上网检测机制的研究与解决方案](https://www.sunbk201.site/posts/crack-campus-network/)\
> <https://www.sunbk201.site/posts/crack-campus-network/>

> [!CAUTION]
> 本条推文非教程向，~~网络巨婴~~请自觉离开

校园网，禁止单一账号下多设备同时访问互联网。

## 本校校园网网络环境的说明

- 校园网网络硬件设备：锐捷三层交换机（目前已知）
- 校园网认证系统：Dr.com Web Portal 认证
- 校园网网络防火墙安全方案：深信服

# 校园网共享上网检测机制[^1]

目前已知的（可能）存在的有：

- 基于 IPv4 数据包包头内的 TTL 字段的检测
- 基于 HTTP 数据包请求头内的 User-Agent 字段的检测
- DPI (Deep Packet Inspection) 深度包检测技术
- 基于 IPv4 数据包包头内的 Identification 字段的检测
- 基于网络协议栈时钟偏移的检测技术
- Flash Cookie 检测技术

## 基于 IPv4 数据包包头内的 TTL 字段的检测

> 存活时间（Time To Live，TTL），指一个数据包在经过一个路由器时，可传递的最长距离（跃点数）。 每当数据包经过一个路由器时，其存活次数就会被减一。当其存活次数为0时，路由器便会取消该数据包转发，IP网络的话，会向原数据包的发出者发送一个ICMP TTL数据包以告知跃点数超限。其设计目的是防止数据包因不正确的路由表等原因造成的无限循环而无法送达及耗尽网络资源。

这是一个比较有效且合理的检测技术，IPv4数据包下存在 TTL（Time To Live）这一字段，数据包每经过一个路由器（即经过一个网段），该TTL值就会减一。

不同的操作系统的默认 TTL 值是不同的，Windows 是 128， macOS/iOS、Linux 是 64。

因此如果我们自己接入路由器到校园网，我们的通过路由器的数据包会变为 127 或 63，一旦校园网抓包检测到这种数据包TTL不是128或64，就会判定为用户接入了路由器。

## 基于 HTTP 数据包请求头内的 User-Agent 字段的检测

HTTP 数据包请求头存在一个叫做 User-Agent 的字段，该字段通常能够标识出操作系统类型，例如：

```apache
Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.72 Safari/537.36 Edg/89.0.774.45
Mozilla/5.0 (iPad; U; CPU OS 3_2_1 like Mac OS X; en-us) AppleWebKit/531.21.10 (KHTML, like Gecko) Mobile/7B405
```

校园网会通过多次抓包检测此字段，若发现同时出现例如Windows NT 10.0 iPad 的字段，则判定存在多设备上网。

## DPI (Deep Packet Inspection) 深度包检测技术

这个检测方案比较先进，检测系统会抓包分析应用层的流量，根据不同应用程序的数据包的特征值来判断出是否存在多设备上网。

具体可参考：[基于 DPI 技术的网络共享设备检测方法及系统](https://patents.google.com/patent/CN106411644A/zh)

此种方式已确认在锐捷相关设备上应用，当由于此项功能极耗费性能，因此有些学校可能不会开启此项功能。

## 基于 IPv4 数据包包头内的 Identification 字段的检测

IP 报文首部存在一个叫做 Identification 的字段，此字段用来唯一标识一个 IP 报文，在实际的应用中通常把它当做一个计数器，一台主机依次发送的IP数据包内的 Identification 字段会对应的依次递增，同一时间段内，而不同设备的 Identification 字段的递增区间一般是不同的，因此校园网可以根据一段时间内递增区间的不同判断出是否存在多设备共享上网。 具体可以参考此专利：[基于 IPID 和概率统计模型的 NAT 主机个数检测方法](https://patents.google.com/patent/CN104836700A/zh)

不过经过我的抓包分析，Windows 的 TCP/IP 协议栈对 Identification 字段的实现是递增，而 iOS 的实现是保持全 0，因此校园网是否使用了该检测机制有待商榷。

## 基于网络协议栈时钟偏移的检测技术

不同主机物理时钟偏移不同，网络协议栈时钟与物理时钟存在对应关系，不同主机发送报文频率与时钟存在统计对应关系，通过特定的频谱分析算法，发现不同的网络时钟偏移来确定不同主机。

具体可以参考此专利：[一种基于时钟偏移的加密流量共享检测方法与装置](https://patents.google.com/patent/CN111970173A/zh)

此种方式具有一定的实验性，因此我不认为此种方式投入了商用。

## Flash Cookie 检测技术

该技术已经用不到了，Flash 都凉了… 不过还是提一下。 Flash Cookie 会记录用户在访问 Flash 网页的时候保留的信息，只要当用户打开浏览器去上网，那么就能被 AC 记录到 Flash Cookie 的特征值，由于 Flash Cookie 不容易被清除，而且具有针对每个用户具有唯一，并且支持跨浏览器，所以被用于做防共享检测。

具体参考：[深信服防共享测试指导书](https://bbs.sangfor.com.cn/plugin.php?id=sangfor_databases:index&mod=viewdatabase&tid=6273)

# 防共享上网检测的解决方案

对于校园网重重的检测，我们似乎已经不可能从终端级提出一个完美的解决方案，因此，下面的解决方案都是基于网关级的。简单来说，我们需要在路由器上动手脚。

路由器固件我们选择 OpenWrt，这是一个开源的路由器系统，允许我们自定义其系统内核以及添加自定义插件。

## 针对基于 IPv4 数据包包头内的 TTL 字段的检测的解决方案

应对思路很简单：修改 TTL 为固定值。

```bash
# 在 OpenWrt 上安装必要的软件包
opkg update && opkg install iptables-mod-ipopt kmod-ipt-ipopt
```

```apache
# 加入以下防火墙规则
iptables -t mangle -A POSTROUTING -j TTL --ttl-set 64
```

## 针对基于 HTTP 数据包请求头内的 User-Agent 字段的检测的解决方案

应对思路：统一所有终端的 User-Agent

这一点实现起来有点困难，目前实测有三种解决方案。

### 方案一：使用 UA2F 修改 UA

UA2F 可以修改所有端口的数据包，而且性能不错，不过依旧需要编译。 具体参见：[Zxilly/UA2F](https://github.com/Zxilly/UA2F)。

验证方式：[UA 检测-HTTP](http://ua.233996.xyz/)

### 方案二：UA3F

[校园网防检测: UA3F - 新一代 UA 修改方法](https://blog.sunbk201.site/posts/ua3f/)

### 方案三：使用代理客户端将流量全加密

Clash 不支持 URL 重写，可以使用 Clash 走规则匹配，把 HTTP 流量全都加密。

如果不想在自己的终端上长时间开启代理，可以在 OpenWrt 中使用 OpenClash 或 ShellClash 进行网关级修改。

## 针对基于 IPv4 数据包包头内的 Identification 字段的检测的解决方案

应对思路：修改所有数据包的 ID 字段为递增。

我们使用 [rkp-ipid](https://github.com/CHN-beta/rkp-ipid) 这一内核模块进行修改。\
进入 OpenWrt 防火墙设置，在 自定义设置 中填入以下内容:

```apache
# 设置所有发出的数据包的 IPID 为递增
iptables -t mangle -N IPID_MOD
iptables -t mangle -A FORWARD -j IPID_MOD
iptables -t mangle -A OUTPUT -j IPID_MOD
iptables -t mangle -A IPID_MOD -d 0.0.0.0/8 -j RETURN
iptables -t mangle -A IPID_MOD -d 127.0.0.0/8 -j RETURN
# iptables -t mangle -A IPID_MOD -d 10.0.0.0/8 -j RETURN
iptables -t mangle -A IPID_MOD -d 172.16.0.0/12 -j RETURN
iptables -t mangle -A IPID_MOD -d 192.168.0.0/16 -j RETURN
iptables -t mangle -A IPID_MOD -d 255.0.0.0/8 -j RETURN
iptables -t mangle -A IPID_MOD -j MARK --set-xmark 0x10/0x10
```

## 针对基于网络协议栈时钟偏移的检测技术的解决方案

应对思路：在局域网中建立 NTP 服务器统一时间戳

进入 OpenWrt 系统设置, 勾选 Enable NTP client（启用 NTP 客户端）和 Provide NTP server（作为 NTP 服务器提供服务）

NTP server candidates（候选 NTP 服务器）四个框框分别填写:

```yaml
ntp1.aliyun.com, time1.cloud.tencent.com, stdtime.gov.hk, pool.ntp.org
```

进入 OpenWrt 防火墙设置，在 自定义设置 中填入以下内容:

```apache
# 防时钟偏移检测
iptables -t nat -N ntp_force_local
iptables -t nat -I PREROUTING -p udp --dport 123 -j ntp_force_local
iptables -t nat -A ntp_force_local -d 0.0.0.0/8 -j RETURN
iptables -t nat -A ntp_force_local -d 127.0.0.0/8 -j RETURN
iptables -t nat -A ntp_force_local -d 192.168.0.0/16 -j RETURN
iptables -t nat -A ntp_force_local -s 192.168.0.0/16 -j DNAT --to-destination 192.168.1.1
# 最后的 192.168.1.1 需要修改为路由器网关地址
```

## 针对 Flash Cookie 检测技术的解决方案

应对思路：iptables 拒绝 AC 进行 Flash 检测\
进入 OpenWrt 防火墙设置，在 自定义设置 中填入以下内容:

```apache
# iptables 拒绝 AC 进行 Flash 检测
iptables -I FORWARD -p tcp --sport 80 --tcp-flags ACK ACK -m string --algo bm --string " src=\"http://1.1.1." -j DROP
```

## 针对 DPI (Deep Packet Inspection) 深度包检测技术的解决方案

应对思路：加密数据包。

我们无法通过修改数据包来防止 DPI 检测，因此加密是最好的手段。

# 最后

对于认为修改 UA IPID 太过麻烦的同学，可以直接对自己的流量进行全加密，前提是你的有充足的加密解密代理服务器

下面我给出最终全部的配置脚本：

```apache
# @SunBK201 - https://blog.sunbk201.site
iptables -t nat -A PREROUTING -p udp --dport 53 -j REDIRECT --to-ports 53
iptables -t nat -A PREROUTING -p tcp --dport 53 -j REDIRECT --to-ports 53

# 通过 rkp-ipid 设置 IPID
iptables -t mangle -N IPID_MOD
iptables -t mangle -A FORWARD -j IPID_MOD
iptables -t mangle -A OUTPUT -j IPID_MOD
iptables -t mangle -A IPID_MOD -d 0.0.0.0/8 -j RETURN
iptables -t mangle -A IPID_MOD -d 127.0.0.0/8 -j RETURN
# 由于本校局域网是A类网，所以我将这一条注释掉了，具体要不要注释结合你所在的校园网
# iptables -t mangle -A IPID_MOD -d 10.0.0.0/8 -j RETURN
iptables -t mangle -A IPID_MOD -d 172.16.0.0/12 -j RETURN
iptables -t mangle -A IPID_MOD -d 192.168.0.0/16 -j RETURN
iptables -t mangle -A IPID_MOD -d 255.0.0.0/8 -j RETURN
iptables -t mangle -A IPID_MOD -j MARK --set-xmark 0x10/0x10

# ua2f 改UA
iptables -t mangle -N ua2f
# 由于本校局域网是A类网，所以我将这一条注释掉了，具体要不要注释结合你所在的校园网
# iptables -t mangle -A ua2f -d 10.0.0.0/8 -j RETURN
iptables -t mangle -A ua2f -d 127.0.0.0/8 -j RETURN
iptables -t mangle -A ua2f -d 192.168.0.0/16 -j RETURN # 不处理流向保留地址的包
iptables -t mangle -A ua2f -p tcp --dport 443 -j RETURN # 不处理 https
iptables -t mangle -A ua2f -p tcp --dport 22 -j RETURN # 不处理 SSH 
iptables -t mangle -A ua2f -p tcp --dport 80 -j CONNMARK --set-mark 44
iptables -t mangle -A ua2f -m connmark --mark 43 -j RETURN # 不处理标记为非 http 的流 (实验性)
iptables -t mangle -A ua2f -m set --set nohttp dst,dst -j RETURN
iptables -t mangle -A ua2f -j NFQUEUE --queue-num 10010
  
iptables -t mangle -A FORWARD -p tcp -m conntrack --ctdir ORIGINAL -j ua2f
iptables -t mangle -A FORWARD -p tcp -m conntrack --ctdir REPLY


# 防时钟偏移检测
iptables -t nat -N ntp_force_local
iptables -t nat -I PREROUTING -p udp --dport 123 -j ntp_force_local
iptables -t nat -A ntp_force_local -d 0.0.0.0/8 -j RETURN
iptables -t nat -A ntp_force_local -d 127.0.0.0/8 -j RETURN
iptables -t nat -A ntp_force_local -d 192.168.0.0/16 -j RETURN
iptables -t nat -A ntp_force_local -s 192.168.0.0/16 -j DNAT --to-destination 192.168.1.1

# 通过 iptables 修改 TTL 值
iptables -t mangle -A POSTROUTING -j TTL --ttl-set 64

# iptables 拒绝 AC 进行 Flash 检测
iptables -I FORWARD -p tcp --sport 80 --tcp-flags ACK ACK -m string --algo bm --string " src=\"http://1.1.1." -j DROP  
```

## 后记

具体操作见：[OpenWrt 编译与防检测部署教程](https://www.notion.so/OpenWrt-f59ae1a76741486092c27bc24dbadc59)

最后，感谢开发 OpenWrt 防检测模块的作者们 [Zxilly](https://github.com/Zxilly)、 [CHN-beta](https://github.com/CHN-beta) 、[SunBK201](https://github.com/SunBK201/UA3F)

[^1]: https://www.sunbk201.site/posts/crack-campus-network/
