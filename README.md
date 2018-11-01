# Pi Dashboard (Node.js版)
## 项目简介
Pi Dashboard (Pi 仪表盘) 是一个开源的 IoT 设备监控工具，目前主要针对树莓派平台，也尽可能兼容其他类树莓派硬件产品。你只需要在树莓派上安装好 Node.js 服务器环境，即可方便的部署一个 Pi 仪表盘，通过炫酷的 WebUI 来监控树莓派的状态！

目前已加入的监测项目有：
* CPU 基本信息、状态和使用率等实时数据
* 内存、缓存、SWAP分区使用的实时数据
* SD卡（磁盘）的占用情况
* 实时负载数据
* 实施进程数据
* 网络接口的实时数据
* 树莓派IP、运行时间、操作系统、HOST 等基础信息

## 网页预览
![preview](http://shumeipai.nxez.com/wp-content/uploads/2017/08/20170831005933963-0.jpg)

## 安装方法
安装共2步，首先安装 Node.js。然后通过 SFTP 或 GitHub 部署好本项目的程序。
1. 安装Node.js环境

访问[Node.js官网](https://nodejs.org/)，获取最新的安装包地址，然后在 Pi 的终端运行以下命令安装Node.js环境
```
wget https://nodejs.org/dist/v8.12.0/node-v8.12.0-linux-armv6l.tar.xz
tar -xvf node-v8.12.0-linux-armv6l.tar.xz 
mv node-v8.12.0-linux-armv6l /usr/local/node
sudo mv node-v8.12.0-linux-armv6l /usr/local/node
echo PATH=$PATH:/usr/local/node/bin >> ~/.bashrc
source ~/.bashrc
```
运行以下命令安装必要的工具包

```
npm install -g cross-env pm2
```

2. 部署 Pi Dashboard

这里介绍两种方法将 Pi Dashboard 部署在服务器上

1. SFTP 上传
在 GitHub 下载本项目源码。通过 [FileZilla 等 FTP 软件](http://shumeipai.nxez.com/2013/09/07/use-the-remote-sftp-file-transfer-raspberry-pi.html)将解压出来的目录上传到树莓派的 /data/www/pi-dashboard 目录下。

2. GitHub 部署
如果你了解过 GitHub 的基本操作，通过 GitHub 来下载本项目到 Pi 上会相当方便。
```
# 如果已安装过 git 客户端可以跳过下一行
sudo apt-get install git
sudo mkdir -p /data/www
sudo chmod 775 /data/www
cd /data/www
git clone git@github.com:kewell-tsao/pi-dashboard.git
```

在将源代码部署到本地后，运行以下命令安装项目
```
cd /data/www/pi-dashboard
npm install
npm run start:pm2 # 或者命令: cross-env NODE_ENV=production pm2 start app.js --name="pi-dashboard"
```

如果你想让网站开机自动启动，可以运行以下代码
```
pm2 save
pm2 startup
```

然后你就可以通过 http://树莓派IP:8091/ 访问部署好了的 Pi Dashboard。

## 本项目Fork自PHP项目pi-dashboard
* [原项目介绍](http://maker.quwj.com/project/10)
* [原项目代码](https://github.com/spoonysonny/pi-dashboard)
* Copyright 2017 NXEZ.com
* Licensed under the GPL v3.0 license.
