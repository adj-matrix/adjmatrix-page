---
layout: template/page
title: "CMU 15213: CSAPP 记录速览"
permalink: /pages/csapp
---

...

## 前期准备

### Download & Docker

项目开始之前，首先还得是**基础设施的搭建**。

个人拒绝在干净的 WSL 里安装老旧的 32 位兼容库，而是手搓了一套舒适的自动化测试流，通过**Dockerfile**封装必要库保持宿主机纯净。并且通过脚本实现了一个聪明的 Task Runner 与各个自己 diy 的任务脚本，自动识别是否需要保持容器开启，与通过 `eval` 和 ANSI 转义序列，将任务脚本里的命令回显在宿主机终端上。

资源获取脚本和本项目一切工作的 Docker 环境参考如下，可直接参考使用：

```sh
#!/bin/bash

SCRIPT_DIR=$(cd "$(dirname "$0")"; pwd)
PROJECT_ROOT=$(cd "$SCRIPT_DIR/.." ; pwd)
DOWNLOAD_DIR="$PROJECT_ROOT/.download"
SRC_DIR="$PROJECT_ROOT/src"

mkdir -p "$DOWNLOAD_DIR"
mkdir -p "$SRC_DIR"

BASE_URL="http://csapp.cs.cmu.edu/3e"
LABS=(
    "datalab-handout.tar"
    "bomb.tar"
    "target1.tar"
    "archlab-handout.tar"
    "cachelab-handout.tar"
    "shlab-handout.tar"
    "malloclab-handout.tar"
    "proxylab-handout.tar"
)

echo "--- CS:APP Lab Setup Start ---"
echo "Project Root: $PROJECT_ROOT"

for lab in "${LABS[@]}"; do
    FILE_PATH="$DOWNLOAD_DIR/$lab"
    TARGET_SUBDIR="$SRC_DIR/${lab%.tar}"

    echo "-----------------------------------------------"
    echo "Processing: $lab"

    if [ ! -f "$FILE_PATH" ]; then
        echo "[1/2] Downloading..."
        wget --no-check-certificate -c "$BASE_URL/$lab" -O "$FILE_PATH"
        if [ $? -ne 0 ]; then
            echo "Error: Download failed for $lab"
            continue
        fi
    else
        echo "[1/2] $lab already exists, skipping download."
    fi

    if [ ! -d "$TARGET_SUBDIR" ]; then
        echo "[2/2] Extracting to $TARGET_SUBDIR..."
        mkdir -p "$TARGET_SUBDIR"
        tar -xf "$FILE_PATH" -C "$TARGET_SUBDIR"
        echo "Done!"
    else
        echo "[2/2] Target directory already exists, skipping."
    fi
done

echo "-----------------------------------------------"
echo "All Labs Ready in '$SRC_DIR'."

```

```Dockerfile
FROM ubuntu:22.04

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3 \
    gcc-multilib \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace

```

## Project 0: Datalab

原以为这只是简单的基础复习，没想到这是一个强迫你**把工程思维降维到 ALU 门级电路思维**的折磨过程，虽然是写 C 语言，但更像是搓数字电路与写汇编语言，可谓是用高级语言干机器语言的事。性质类似举重运动员练深蹲，练习的位级代码在高级语言的开发中其实用处是比较窄的。

大部分难题其实还是十分简单的，但有的需要提前知道一些二进制数的 feature，可以算是**前置知识**，同时也是个人感觉该 Project 的价值点所在了。

### 前置的二进制知识

**门级电路**
- 在进行 Datalab 之前，最基本的应该是 ALU 各个运算单元的电路实现了，如何使用与或非门实现各个运算单元与条件判断，这类属于数字电路的基础是该 Project 的前置，此外就是需要知道些掩码相关的常用技巧。

**二进制数相关**
- 最大的二进制补码正数（`TMax`）和负数均有一个运算性质，$\overline{T_{max}} = T_{max} + 1$，以八位二进制补码为例：
    - 127 ➜ `01111111`，取反或加一均为`10000000`。
    - -1 ➜ `11111111`，取反或加一均为`00000000`。
- 在排除`TMin`溢出的情况下，0是唯一的取反后符号不变的二进制数，也是常识了。怎么排除另一种情况（例如排除`TMin`只要0）呢？将异或改为或就好。

**C 语言的位运算技巧**
- 此外是一些 C 语言的位运算技巧，例如`!!x`看似是废话其实是一种规格化，将符合逻辑上的`0/1`转为纯的二进制数的`0/1`，这样就能不用麻烦的掩码操作了。

> **一个数需要几位二进制位表示？**
>
> 虽然是一个有着递归子结构的递归问题，但二进制电路上禁止递归，老老实实用分治吧，这个是整个 Project 的最后的大 Boss 问题了。

### 浮点数问题

需要复习的是 **IEEE 754** 规则：

```py
+-------+-------------------+--------------------------------+
| Sign  | Exponent          | Fraction                       |
| 1 bit | 8 bits            | 23 bits                        |
| 0: +  | 127: 2^127        | 1.0                            |
| 1: -  | 0: 2^-126         | 1.0                            |
+-------+-------------------+--------------------------------+
```

该 **IEEE 754** 规则同时也是该项目以及 C 语言默认采用的浮点数规则。

> **浮点数的指数运算？**
>
> **神秘的 Infinite Loop**：代码逻辑完美无缺，`btest` 却频频报 `Timed out (probably infinite loop)`。
>
> **原因**：
> - `btest` 内部是用一个叫 `SIGALRM` 的机制定了一个 10 秒的闹钟。只要 10 秒内所有的测试没跑完，它就直接强退并甩锅给“死循环”。那为什么 $O(1)$ 代码会跑超过 10 秒？
> - 有可能纯粹是因为我的测试脚本中用的是 Volume 挂载（`-v "$(pwd)":/src`），WSL+Docker 的微小开销导致执行时间超过了 CMU 设定的 10 秒硬编码阈值。
> - 当然如果读者有在正常的 Linux 环境中出现此问题，那原因可能更复杂，也有可能是在`tests.c`的`unsigned test_floatPower2(int x)`中，非规格化数乘法陷入了惩罚，正常的浮点数乘法在 CPU 硬件里很快。但是，x86 为了省事，没有在硅片上实现非规格化数的乘法电路，一旦 CPU 发现你在用非规格化数做乘法，它就会触发一个硬件异常（Microcode Assist），把计算交给 CPU 的微代码（Microcode）用纯软件的方式去算。导致单次乘法的耗时慢了百倍。`btest`为了测试边缘情况，代码在疯狂进行非规格化数乘法......
>
> **解法**：加时即可，例如在测试脚本中加入 `./btest -T 60` 提升阈值。或者如果希望在根源上解决这个问题，那需要修改`tests.c`的`unsigned test_floatPower2(int x)`中，在`while`循环的上一行加入下列短路代码。这两种方法均能修复此问题通过。
> ```c
>   if (!recip && x > 127) return 0x7F800000;
>   if (recip && x > 149) return 0;
> ```

## Project 1: Waiting for updating ...
