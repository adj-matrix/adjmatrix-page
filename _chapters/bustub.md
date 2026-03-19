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
FROM ubuntu:22.04 AS base
RUN apt-get -y update && \
    apt-get -y install \
    --no-install-recommends \
      build-essential \
      ca-certificates \
      git \
      openssh-client \
      python3 \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

FROM base
CMD bash

# Install Ubuntu packages.
# Please add packages in alphabetical order.
ARG DEBIAN_FRONTEND=noninteractive
RUN apt-get -y update && \
    apt-get -y install \
    --no-install-recommends \
      clang-14 \
      clang-format-14 \
      clang-tidy-14 \
      cmake \
      doxygen \
      g++-12 \
      pkg-config \
      zlib1g-dev \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

RUN apt-get -y update && \
    apt-get -y install \
    --no-install-recommends \
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

ENV CC=/usr/bin/clang
ENV CXX=/usr/bin/clang++

WORKDIR /workspace

```

搭建好 Docker 后，自己再写了几套自动化发射器脚本，以能够在主机中快速使用镜像编译运行测试，同时，在 VSCode+WSL+Docker 开发环境中，不可避免地遇到开发环境无法识别与需要 Debug 的情况，这个时候需要使用 `Devcontainer` 并且写配置进入 container 中开发，具体就不展开了因为每个的开发习惯、插件安装、环境配置都有所不同。后续开发模式基本上都是这样在 container 中手写代码与调试，在外部 WSL 的 zsh 中使用终端操作，发射各个脚本等。

## Project 0: C++ Primer

P0 的目标是实现一个支持并发的写时复制字典树（Copy-On-Write Trie, **COW**）。虽然只是热身，但蕴含了最基础的极深的现代 C++ 系统编程哲学。

### 单线程 Trie

我们需要实现一个单线程的写时复制与拥有不可变性的前缀树，写时复制的核心准则是：**如果数据要被修改，绝对不可以在原地址上改，必须克隆一条全新的路径。**

仅仅“跑通测试”是很简单的。实现思路非常多，主要的难点可能就是对 `C++` 语法的不熟练了。

其中的 **`dynamic_cast`** 不仅仅是转型，它兼具了运行时的**类型安全检查**。如果节点没有值，或者值的类型与请求的 `T` 不匹配，优雅地返回 `nullptr`，但其实，在高性能系统中，频繁的 RTTI（运行时类型识别）是有开销的。不过在 BusTub 这种教学项目中，这是验证 TrieNodeWithValue<T> 类型安全稳妥的方法且是题目要求的行为。

**移动语义 `std::move`** 则永远不拷贝对象，只把它的所有权转移，此处从 unique move 到 shared 的话也会转型，直接转移所有权避免拷贝，是非常常用与高频的语义。

<!-- 在实现 `Remove` 时，如果不处理 `root_ == nullptr` 且输入空字符串 `""` 的情况，实际上会直接跳过遍历循环，导致后续空指针解引用崩溃。令人惊讶的是，即使带有这个潜在的 Correctness Bug 也能满分通过官方测试。-->

一些许多值得思考的优化点：
- **彻底摒弃 `const_cast`**：
    是否为了图省事，使用了 `std::const_pointer_cast` 强行修改已有的节点？在 COW 设计中，这是一种极其危险的“作弊”行为。它破坏了数据结构对外的**不可变性（Immutability）**承诺，如果在多线程环境下发生，将引发灾难性的竞态条件。真正的解法是老老实实地利用 `Clone()` 生成新树。
- **零 `new`/`delete` 与移动语义**：
    官网提到你不应该使用 `new`/`delete`，故全程禁止手动 `new`。使用 `std::make_shared` 不仅代码更简洁，而且底层只会触发一次内存分配（控制块与对象同分），性能更优。手动 `new` 会产生两次内存分配（对象一次，控制块一次），且不符合异常安全准则。对于非拷贝类型（如 `std::unique_ptr`），熟练使用 `std::move` 来**转移对象的所有权**。
- **实现思路**：
    实现思路很多且思路各异，例如“递归式”与“过程式”与“结构式”的实现方法等。

### 并发 Trie

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

### 调试

在 WSL + Docker + VSCode DevContainer 的“套娃”环境下调试，是一场不大不小的挑战。

在准备 debug 时结果一直 make 失败。在 CMake 项目里，build/ 是状态机，不只是缓存；一旦状态错乱，最省时间的做法往往不是继续猜，而是清空后重建。

也是重建后就正常能 make 能 debug 了，但更大的阻碍是：VSCode 的 cpptools 调试器对于**多态基类指针**（如 `map` 中存储的 `shared_ptr<const TrieNode>`）的解析非常死板，直接隐藏了子类 `TrieNodeWithValue` 中最重要的 `value_` 字段。结果 `CASE_3` 在嫌麻烦之下还是直接在 `Put` 里面 cout 了，利用 `if constexpr (std::is_same_v<T, uint32_t>)` 在 `Put` 内部直接注入 `std::cout` 打印日志。

### SQL 字符串函数注入

这一步将我们带入了 BusTub 的执行引擎层（Expression & Planner）。我们需要将 SQL 语句中的 `upper` 和 `lower` 映射为具体的 C++ 算子。

逻辑虽然简单，唯一值得注意的规范就是`[](unsigned char ch`，如果直接传入普通的 `char`，遇到扩展 ASCII 或多字节字符时，负值会导致 `std::tolower` 触发**未定义行为（Undefined Behavior, UB）**。然后其他就是老生常谈的能 `move` 时就别拷贝吧之类的。这样Project 0也就完成了。

---

## Project 1: Buffer Pool

P1 要手搓的是非常有意思且极为核心的底层组件 Buffer（缓冲池）。不仅仅是 Database 的 Buffer Pool，放眼整个计算机科学领域，到处都能看到它的影子：OS 的 Page Cache、文件系统的缓存、网络协议栈的缓冲区、编译器的符号表缓冲，甚至 MLSys 中的数据预取队列。Buffer 的核心哲学就是“欺骗”：将慢速的底层存储抽象为快速的内存，使得上层应用产生一种“数据全在内存中”的错觉，完全无需关心底层存储的换入换出细节。

并且从 P1 开始，我们将是非常自由的能够以自己的思想实现每个组件，有时我们可能会由于太过于自由而茫然，不清楚需求应该是怎么样的，这时你可以反复读读各个 test 的代码，看看上层是怎么调用的，我们需要实现怎么样的行为，这种测试驱动的切入口也许能够让你的开发更加高效。

### LRU-K 策略

LRU-K Replacer 写起来非常舒适。作为一个纯粹的算法组件，它不涉及复杂的底层物理交互，如果不追求极致优化，是可以快速拿下的。

> **为什么是 LRU-K 而不是 LRU？**
>
> 传统的 LRU 算法存在一个致命弱点：**扫描抗性（Scan Resistance）极差**。当执行一次全表顺序扫描（Sequential Scan）时，大量只会被访问一次的“冷数据”会瞬间涌入 Buffer Pool，把真正被高频访问的“热数据”全部挤出内存，导致缓存命中率断崖式下跌。LRU-K 通过记录前 $K$ 次的访问时间，完美过滤了这种偶发的单次访问，保护了真正的热点数据。

在实现过程中，有几个值得记录的系统级工程思考：

1. **并发与原子的权衡（`std::atomic` vs `std::mutex`）**：
   我曾纠结要不要给 `curr_size_` 套一个 `std::atomic`（并配上 `memory_order_relaxed`），以期在 `Size()` 函数中实现无锁的原子读取提升性能。但所有的写操作（`Evict`, `RecordAccess`）都已经处于全局 `mutex` 的保护下了。在有锁的情况下，混合使用原子操作反而会带来不必要的内存屏障开销，所以这是一个工程权衡而非优化。如果是 C++20 那确实是优化，可以用 `std::atomic_ref` 来做零成本的外部原子化映射，但这是 C++17 下，老老实实统一用 `mutex` 了，优化空间主要在数据结构的选择而非 Size 加锁的几纳秒开销。

2. **`std::pair` 逻辑比较**：
   题目要求 `Evict` 进行两级比较：访问少于 K 次的帧具有最高优先驱逐权，按 LRU 兜底；达到 K 次的帧按 Backward K-distance 驱逐，也是 LRU 作为 tie-breaker。此处思路很多。我的解法是将其抽象为一个**权值模型**，直接使用 `std::pair<size_t, size_t>`。通过 `current_timestamp_{0}` 改为 `current_timestamp_{1}`，把历史访问不足 K 次的节点的距离设为 `0` 作为第一关键字，历史最早时间戳作为第二关键字。利用 C++ `std::pair` 天生的字典序比较特性，瞬间消灭了所有分支判断。最大值则用`std::numeric_limits`就好。字典序比大小分支预测还友好，个人感觉挺不错。

3. **`try_emplace` 与 $O(N)$**：
   在 `RecordAccess` 中使用 `try_emplace` 可以做到一次查找完成“判断并插入”，虽然优雅，但目前的 `Evict` 实现是遍历了一次 `unordered_map`，时间复杂度为 $O(N)$。理论上可以通过维护额外的链表或有序集合将其优化到 $O(1)$ 或 $O(\log N)$，但考虑先完成 Compulsory，再考虑 Optional，留给以后再做，剩下的优化就是粗粒度锁优化至细粒度锁，稍微优化了几处最明显的地方就没敢继续优化了，锁优化太危险。

### Buffer Pool Manager

Buffer Pool Manager (BPM) 是整个 P1 的核心，也是一个极其复杂、细节繁多的状态机模块。

做此前，必须厘清三个核心组件的关系：
- **Page**：内存中真正存放 4KB 数据的物理容器，由 `frame_id` 索引。
- **Disk Manager**：负责把磁盘上的物理页搬进房间，或者把房间里的脏数据写回磁盘。
- **Buffer Pool Manager**：维护 `page_table_`，决定哪个 `page_id` 住进哪个 `frame_id`，并在满时呼叫 Replacer 踢人。

我一上来就按顺序开始第一个实现 NewPage，但实际上是很低效的且满是 bug，所以**不要一上来就按顺序写 `NewPage` 或 `FetchPage`！**，这两个函数包含了极度复杂的逻辑。我推荐一个**按认知负担递增**的可行的实现顺序：

1. **`UnpinPage`**：最小、最清晰的状态迁移函数。只需处理 `pin_count` 递减和脏页标记。
2. **`FlushPage` / `FlushAllPages`**：单纯的磁盘写出操作，逻辑单一。
4. **`FetchPage`**：BPM 核心的流入路径。
5. **`NewPage`**：当你写完 `FetchPage`，你会发现 `NewPage` 的骨架几乎一模一样，顺水推舟即可。
3. **`DeletePage`**：需要你对 Page 的生命周期有高度理解，涉及释放内存和清理映射。

这个顺序按认知负担递增，这样就不会像我一上来就在 `NewPage` 和 `FetchPage` 里同时处理：从 free list 找空、找 replacer 踢人、写回脏页、分配 page id、更新 page_table、触发 pin / unpin 语义。这些非常容易乱的地方，其中最恶心的就是后面几个 NewPage 和 FetchPage 往往写得非常冗长，包含了从空闲列表找帧、驱逐旧页、写回磁盘、重置内存的所有逻辑。细碎点非常多，实现各种烦人细节，一个都不能漏。建议**拆分辅助函数（Helper Functions）**，Buffer Pool Manager 本质上是一个复杂的状态机，将寻找牺牲帧、重置页面状态、物理 IO 加载，剥离成私有内联函数。每次开撸一个函数前，先把“语义边界”想清楚，再写代码，尤其是那两个最烦的。

在并发控制上，每函数一把大锁，暂时没有优化。其中按 value 找 key 用到了 `std::find_if`，比较慢可能是一个潜在的优化点。好在性能虽然不高，bug 不多，整个 Buffer 的实现过程还是没那么折磨。

### Page Guards

> 既然BufferPoolManager有锁管理了，PageGuard是干啥的？

BufferPoolManager 上的锁保护的是“BPM 自己的共享状态”，即**内部一致性**；PageGuard 保护的是“调用者拿到 page 之后，别忘了释放 page”，即**生命周期**。

PageGuard 相当于给 Page 一个保护套，核心价值是 **RAII**，析构时自动释放资源，防止 Page 的生命周期混乱。具体区别上：
- **`BasicPageGuard`**：持有一个已经 Pinned 的 Page，不管理读写锁。析构时 `Unpin`。
- **`ReadPageGuard`**：持有一个已经加了 Read Latch 的 Page。析构时负责释放读锁，并 `Unpin`。
- **`WritePageGuard`**：持有一个已经加了 Write Latch 的 Page。析构时负责释放写锁，并 `Unpin`。

既然如此？那么数据锁（Latch）的入口在哪里？回到 bufferpool，那几个 wrapper 就是答案，它们套 PageGuard，负责**获取资源并加锁**，而 Guard 负责在作用域结束时**自动解锁并释放资源**，职责边界极其清晰。

- **实现逻辑**：
    里面大多数逻辑都是可以写个内联复用的（但不能直接复用，不同的函数例如 `Drop` 行为不同），实现起来相对简单。每个 guard 最好都能处于两种状态，有效状态和空状态，这样 move、drop、析构，核心都是在这两种状态之间转换。
- **移动语义（Move Semantics）**：
    需要实现的 `BasicPageGuard &&that` 是移动语义，即遇到 `std::move` 时，PageGuard需要做的，`std::move` 的语义是“转移释放责任”，而不是“释放资源本身”。通过 `that.page_ = nullptr` 来抽干原对象，防止两个 Guard 在析构时对同一个 Page 进行 Double Unpin。
- **释放顺序**：
    最关键的问题可能是，在 `Read/WritePageGuard` 析构时，放锁和 Unpin 的顺序问题，锁是持有内部资源的，一个资源被持有且没锁，一个资源被释放却有锁，哪种情况危险，想必是先放锁还是先Unpin就很清楚了。

完成这个最后甜点，P1 也就结束了。项目还附带了一个 `bpm-bench` 的跑分测试程序，用于检验本地环境下的 QPS 吞吐量，通过本地测试以供查阅代码性能的进步如何。可见在保证正确性之后，如何打破全局锁的枷锁走向高并发 I/O，才是系统优化的无底洞。

### 优化

TODO: Waiting for updating

## Waiting for updating


