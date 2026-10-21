---
title: 如何搭建个人博客
published: 2024-05-09
description: 利用 GitHub Pages 搭建博客 使用 Hexo 框架搭建博客
image: ''
tags: ["GitHub","Hexo"]
category: 技术分享
draft: false
lang: zh_CN
---

利用 GitHub Pages 搭建博客ㅤ\
使用 Hexo 框架搭建博客

## Windows 环境搭建博客

### 安装 environment

1. #### 安装 node.js

   下载地址：<https://nodejs.org/en/download/>

   建议下载 LTS 版本（即长期支持版本）
2. #### 安装 git 以及 git gui

   下载地址：<https://git-scm.com/download/win>

   git gui 建议下载 GitHub Desktop
3. #### 安装 Hexo

```bash
npm install -g hexo-cli
```

如果遇到 npm 源问题，可以执行以下命令，更换为国内镜像源

```bash
npm config set registry https://registry.npmmirror.com &&
npm update  &&
npm install -g hexo-cli
```

### 创建博客

```bash
mkdir <folder_name>         # 创建博客文件夹
cd <folder_name>            # 进入博客文件夹
hexo init                   # 初始化博客
```

### 本地配置

1. #### 配置GitHub

   - 注册GitHub账号
   - 创建一个仓库，仓库名称为<username>.github.io
2. #### 配置博客

   参考：<https://hexo.io/zh-cn/docs/configuration.html>

   具体配置见_config.yml

   以下为必填项：（只有填了此项，才能让他人访问博客）

```yaml
deploy:  
 type: git    
 repo: https://github.com/<username>/<username>.github.io.git
 branch: master
```

3. #### 运行博客

```bash
hexo clean                  # 清空博客
hexo generate               # 生成博客
hexo server                 # 启动博客
```

此时浏览器访问 <http://localhost:4000/> 即可访问博客了

再执行下面命令，即可将博客部署到 GitHub

```bash
hexo deploy                 # 部署博客
```

如果发现缺少deployer插件，执行以下命令即可

```bash
npm install hexo-deployer-git --save
```
