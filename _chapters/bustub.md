---
layout: template/page
title: "CMU 15445: Bustub 记录速览"
permalink: /pages/bustub
---

> **注意**
>
> - 本项目 Bustub 基于 **2023 Spring** 版本，而笔者发现，该版本的 **GradeScope** 现在已**下线**，因此读者在尝试前一定优先选择较新的可评测的版本。
> - 笔者曾在大二寒假（完成至 P1，于 P2 Quit）和大三上（完成至 P4 的全部）分两次时初次完成过此项目。由于曾经完成的版本过老已经下线无法参考，未来将挑选一个好的版本将此项目重写。
> - 官网仓库地址为：[https://github.com/cmu-db/bustub](https://github.com/cmu-db/bustub)。
{: .note}

CMU 15445: Bustub 虽然说是数据库系统项目，但这里确实是无脑推荐所有做系统或纯粹想练习 C++ 的同学都来尝试。该项目的完整度极高，代码，测试，文档，评测系统一应俱全，全方面检测 C++ 系统级编程，语法格式规范，调试能力等。用到的数据库系统知识其实要求不高，完全可以将这些知识点当作看业务的文档需求来看待，难点主要还是 C++ 系统级编程的语法熟练度能力与编写出正确代码和调试技巧能力。

## 前期准备

### Download & Docker

在真正的系统级项目开始之前，基础设施的搭建决定了后续开发的幸福指数。

Bustub 的环境搭建还是非常清楚的，但是看到官方给的 `packages.sh` 环境安装脚本，就打算直接开个 `Docker` 了。虽然 BusTub 提供了一个基础的 `Dockerfile`，但它仅包含了最基本的最小组件，甚至存在版本冲突（例如脚本里要求安装 `clang-14`，而 `Dockerfile` 写的却是 `clang-12`）。

重写了自动化下载脚本与分层优化的 `Dockerfile，具体的工具读者也可以自行添加，我这里给出一个仅供参考的资源获取脚本和本项目一切工作的 Docker 环境：

```sh
#!/bin/bash

set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
PROJECT_ROOT=$(cd "$SCRIPT_DIR/.." && pwd)
DOWNLOAD_DIR="$PROJECT_ROOT/.download"
URL="https://github.com/cmu-db/bustub/archive/refs/tags/v20230514-2023spring.tar.gz"
FILE_NAME="bustub-2023spring.tar.gz"
ARCHIVE_PATH="$DOWNLOAD_DIR/$FILE_NAME"
TEMP_SRC=$(mktemp -d "$DOWNLOAD_DIR/extract.XXXXXX")

cleanup() {
    rm -rf "$TEMP_SRC"
}

trap cleanup EXIT
mkdir -p "$DOWNLOAD_DIR"
echo "--- CMU 15-445 Source Download ---"

if [ ! -f "$ARCHIVE_PATH" ]; then
    echo "[1/3] Downloading source code..."
    curl -fL --retry 3 --retry-delay 1 "$URL" -o "$ARCHIVE_PATH"
else
    echo "[1/3] Source archive already exists, skipping download."
fi

echo "[2/3] Verifying archive..."
tar -tzf "$ARCHIVE_PATH" >/dev/null
echo "[3/3] Extracting to project root..."
tar -xzf "$ARCHIVE_PATH" -C "$TEMP_SRC" --strip-components=1
cp -a "$TEMP_SRC"/. "$PROJECT_ROOT"/
echo "BusTub source code is ready."

```

```Dockerfile
FROM ubuntu:22.04
CMD bash

# Install Ubuntu packages.
# Please add packages in alphabetical order.
ARG DEBIAN_FRONTEND=noninteractive
RUN apt-get -y update && \
    apt-get -y install \
    --no-install-recommends \
      build-essential \
      clang-14 \
      clang-format-14 \
      clang-tidy-14 \
      cmake \
      doxygen \
      git \
      g++-12 \
      pkg-config \
      zlib1g-dev \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

RUN apt-get -y update && \
    apt-get -y install \
    --no-install-recommends \
      python3 \
      ca-certificates \
      clangd-14 \
      curl \
      gdb \
      zip \
      && apt-get clean && rm -rf /var/lib/apt/lists/*

RUN ln -sf /usr/bin/clang-14 /usr/bin/clang && \
    ln -sf /usr/bin/clang++-14 /usr/bin/clang++ && \
    ln -sf /usr/bin/clang-format-14 /usr/bin/clang-format && \
    ln -sf /usr/bin/clang-tidy-14 /usr/bin/clang-tidy && \
    ln -sf /usr/bin/clangd-14 /usr/bin/clangd

WORKDIR /workspace

```

搭建好 Docker 后，自己再写了几套自动化发射器脚本，以能够在主机中快速使用镜像编译运行测试，同时，在 VSCode+WSL+Docker 开发环境中，不可避免地遇到开发环境无法识别与需要 Debug 的情况，这个时候需要使用 `Devcontainer` 并且写配置进入 container 中开发，具体就不展开了因为每个的开发习惯、插件安装、环境配置都有所不同。后续开发模式基本上都是这样在 container 中手写代码与调试，在外部 WSL 的 zsh 中使用终端操作，发射各个脚本等。

## Project 0: C++ Primer

P0 的目标是实现一个支持并发的写时复制字典树（Copy-On-Write Trie, **COW**）。虽然只是热身，但蕴含了最基础的极深的现代 C++ 系统编程哲学。

### Task 1: 单线程 Trie 

我们需要实现一个单线程的写时复制与拥有不可变性的前缀树，写时复制的核心准则是：**如果数据要被修改，绝对不可以在原地址上改，必须克隆一条全新的路径。**

仅仅“跑通测试”是很简单的。实现思路非常多，主要的难点可能就是对 `C++` 语法的不熟练了。

其中的 **`dynamic_cast`** 不仅仅是转型，它兼具了运行时的**类型安全检查**。如果节点没有值，或者值的类型与请求的 `T` 不匹配，优雅地返回 `nullptr`，这正是题目要求的行为。**移动语义 `std::move`** 则永远不拷贝对象，只把它的所有权转移，此处从 unique move 到 shared 的话也会转型，直接转移所有权避免拷贝，是非常常用与高频的语义。

<!-- 在实现 `Remove` 时，如果不处理 `root_ == nullptr` 且输入空字符串 `""` 的情况，实际上会直接跳过遍历循环，导致后续空指针解引用崩溃。令人惊讶的是，即使带有这个潜在的 Correctness Bug 也能满分通过官方测试。-->

一些许多值得思考的优化点：
- **彻底摒弃 `const_cast`**：
    是否为了图省事，使用了 `std::const_pointer_cast` 强行修改已有的节点？在 COW 设计中，这是一种极其危险的“作弊”行为。它破坏了数据结构对外的**不可变性（Immutability）**承诺，如果在多线程环境下发生，将引发灾难性的竞态条件。真正的解法是老老实实地利用 `Clone()` 生成新树。
- **零 `new`/`delete` 与移动语义**：
    官网提到你不应该使用 `new`/`delete`，故全程禁止手动 `new`。使用 `std::make_shared` 不仅代码更简洁，而且底层只会触发一次内存分配（控制块与对象同分），性能更优。手动 `new` 会产生两次内存分配（对象一次，控制块一次），且不符合异常安全准则。对于非拷贝类型（如 `std::unique_ptr`），熟练使用 `std::move` 来**转移对象的所有权**。
- **实现思路**：
    实现思路很多且思路各异，例如“递归式”与“过程式”与“结构式”的实现方法等。

### Task 2: 并发 Trie

此处则是用双锁机制封装 Trie，实现“一写多读”的并发存储。此处 Bustub 已经为我们提供了 `ValueGuard`：它在内部持有了一份当前 `Trie` 树的 `shared_ptr`，这就相当于对数据库打了一个**快照（Snapshot）**。只要 Guard 存活，那一刻的数据就永远不会被析构，完美避免了悬空指针问题。

`std::optional<T>` 则是非常好用的容器，用来替代以前那种“返回 `nullptr` 或者布尔值”的尴尬写法，其要么包含 `T` 类型对象，要么什么都不包含（`std::nullopt`）。

这里的系统级优化细节则有：

- **读写竞争的盲区**：
    官方的测试其实不够严苛。如果 `Put` 时只拿 `write_lock_` 而不拿 `root_lock_`，即使通过了测试，也会在生产环境中引发致命问题：因为对 `std::shared_ptr` 的赋值操作**不是原子的**！多个线程在 `Get`（读取 `root_`），同时一个线程在 `Put`（写入 `root_`），程序会发生数据竞争（Race Condition），是一个安全隐患，不过却能够通过官方的 GradeScope，值得注意。
- **缩小临界区（Minimize Critical Section）**：
    我使用了 C++17 的 `std::scoped_lock` 配合局部作用域 `{}` 来控制锁的生命周期（RAII）。`scoped_lock` 可以同时锁定多个互斥量且防止死锁，更符合工程实践。
- **RCU（Read-Copy-Update）**：
    根据伪代码要求，**仅在拷贝旧根和更新新根那一瞬间加 `root_lock_`**。最耗时的 COW 重建过程（即 `Trie::Put` 逻辑）完全在**锁外执行**，以便其他的读者（Get）完全不会被阻塞，。
- **老生常谈的 move**
    发布新根时可以考虑 move。这里 Trie 本身很轻，但语义上“发布新对象”用 move 更贴近意图，而且虽然少但确实是性能更优，时刻关注**对象所有权（Ownership）**，没人用了拿过来。

### Task 3: 调试

在 WSL + Docker + VSCode DevContainer 的“套娃”环境下调试，是一场不大不小的挑战。

在准备 debug 时结果一直 make 失败。在 CMake 项目里，build/ 是状态机，不只是缓存；一旦状态错乱，最省时间的做法往往不是继续猜，而是清空后重建。

也是重建后就正常能 make 能 debug 了，但更大的阻碍是：VSCode 的 cpptools 调试器对于**多态基类指针**（如 `map` 中存储的 `shared_ptr<const TrieNode>`）的解析非常死板，直接隐藏了子类 `TrieNodeWithValue` 中最重要的 `value_` 字段。结果 `CASE_3` 在嫌麻烦之下还是直接在 `Put` 里面 cout 了，利用 `if constexpr (std::is_same_v<T, uint32_t>)` 在 `Put` 内部直接注入 `std::cout` 打印日志。

### Task 4: SQL 字符串函数注入

这一步将我们带入了 BusTub 的执行引擎层（Expression & Planner）。我们需要将 SQL 语句中的 `upper` 和 `lower` 映射为具体的 C++ 算子。

逻辑虽然简单，唯一值得注意的规范就是`[](unsigned char ch`，如果直接传入普通的 `char`，遇到扩展 ASCII 或多字节字符时，负值会导致 `std::tolower` 触发**未定义行为（Undefined Behavior, UB）**。然后其他就是老生常谈的能 `move` 时就别拷贝吧之类的。这样Project 0也就完成了。

## Project 1: Waiting for updating ...





