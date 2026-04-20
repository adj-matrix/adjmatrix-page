---
layout: template/page
title: "CMU 15445: Bustub 记录速览"
permalink: /pages/bustub
---

> **注意**
>
> - 本项目 Bustub 基于 **2023 Spring** 版本，而笔者发现，该版本的 **GradeScope** 现在已**下线**，因此读者在尝试前一定优先选择较新的可评测的版本。
> - 笔者曾在大一暑假了解到此项目，大二寒假（完成至 P1，于 P2 Quit）和大三上（完成至 P4 的全部）分两次时初次完成过此项目。由于曾经完成的版本过老已经下线无法参考，未来将挑选一个好的版本将此项目重写。
> - 官网仓库地址为：[https://github.com/cmu-db/bustub](https://github.com/cmu-db/bustub)。
{: .note}

CMU 15445: Bustub 虽然说是数据库系统项目，但这里确实是无脑推荐所有做系统或纯粹想练习 C++ 的同学都来尝试。该项目的完整度极高，代码，测试，文档，评测系统一应俱全，全方面检测 C++ 系统级编程，语法格式规范，调试能力等。用到的数据库系统知识其实要求不高，完全可以将这些知识点当作看业务的文档需求来看待，难点主要还是 C++ 系统级编程的语法熟练度能力与编写出正确代码和调试技巧能力。

> 而且说来有趣，机缘巧合之下 Bustub 是我的整个 C++ 生涯中第一个尝试的项目，可能注定了以后是搬砖工了，也是一段奇缘（当然第一个尝试不是第一个完成，谁的第一个完成的 C++ 项目是这种东西我给他磕一个😱）。

## 前期准备

### Download & Docker

在真正的系统级项目开始之前，基础设施的搭建决定了后续开发的幸福指数。

Bustub 的环境搭建还是非常清楚的，但是看到官方给的 `packages.sh` 环境安装脚本，就打算直接开个 `Docker` 了。虽然 BusTub 提供了一个基础的 `Dockerfile`，但它仅包含了最基本的最小组件，甚至存在版本冲突（例如脚本里要求安装 `clang-14`，而 `Dockerfile` 写的却是 `clang-12`）。

重写了自动化下载脚本与分层优化的 `Dockerfile`，具体的工具读者也可以自行添加，我这里给出一个仅供参考的资源获取脚本和本项目一切工作的 Docker 环境：

```bash
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

搭建好 Docker 后，自己再写了几套自动化发射器脚本，以能够在主机中快速使用镜像编译运行测试，同时，在 VSCode+WSL+Docker 开发环境中，不可避免地遇到开发环境无法识别与需要 Debug 的情况，这个时候需要使用 `Devcontainer` 并且写配置进入 container 中开发，具体就不展开了因为每个的开发习惯、插件安装、环境配置都有所不同。后续开发模式基本上都是这样在 container 中手写代码，测试与调试，在外部 WSL 的 zsh 中使用其他与项目环境不相关的提升效率的操作。

不过有一个巨大问题是，这一套 project 的 ASan 运行时和我当时 Docker/WSL 环境存在兼容问题，这种情况下我关闭了 ASan 再本地测试。即将 `cmake -DCMAKE_BUILD_TYPE=Debug ..` 改为 `cmake -DCMAKE_BUILD_TYPE=RelWithDebInfo ..` 进行编译。如介意则别用 Docker/WSL 就行老老实实用原生态 Linux（虽然我也不知道是和 Docker 不兼容还是和 WSL 不兼容）。

## Project 0: C++ Primer

P0 的目标是实现一个支持并发的写时复制字典树（Copy-On-Write Trie, **COW**）。虽然只是热身，但蕴含了最基础的极深的现代 C++ 系统编程哲学。

### 单线程 Trie

我们需要实现一个单线程的写时复制与拥有不可变性的前缀树，写时复制的核心准则是：**如果数据要被修改，绝对不可以在原地址上改，必须克隆一条全新的路径。**

仅仅“跑通测试”是很简单的。实现思路非常多，主要的难点可能就是对 `C++` 语法的不熟练了。

其中的 **`dynamic_cast`** 不仅仅是转型，它兼具了运行时的**类型安全检查**。如果节点没有值，或者值的类型与请求的 `T` 不匹配，优雅地返回 `nullptr`，但其实，在高性能系统中，频繁的 RTTI（运行时类型识别）是有开销的。不过在 BusTub 这种教学项目中，这是验证 TrieNodeWithValue<T> 类型安全稳妥的方法且是题目要求的行为。

**移动语义 `std::move`** 则永远不拷贝对象，只把它的所有权转移，此处从 unique move 到 shared 的话也会转型，直接转移所有权避免拷贝，是非常常用与高频的语义。

> 在实现 `Remove` 时，如果不处理 `root_ == nullptr` 且输入空字符串 `""` 的情况，实际上会直接跳过遍历循环，导致后续空指针解引用崩溃。令人惊讶的是，即使带有这个潜在的 Correctness Bug 也能满分通过官方测试。

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
    在 `RecordAccess` 中使用 `try_emplace` 可以做到一次查找完成“判断并插入”，虽然优雅，但目前的 `Evict` 实现是遍历了一次     `unordered_map`，时间复杂度为 $O(N)$。理论上可以通过维护额外的链表或有序集合将其优化到 $O(1)$ 或 $O(\log N)$，但考虑先完成 Compulsory，再考虑 Optional，留给以后再做，剩下的优化就是粗粒度锁优化至细粒度锁，稍微优化了几处最明显的地方就没敢继续优化了，锁优化太危险。

### Buffer Pool Manager

Buffer Pool Manager (BPM) 是整个 P1 的核心，也是一个极其复杂、细节繁多的状态机模块，是一个巨大难拆分的耦合系统。

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

## Project 2: B+Tree

P2 则是开始实现数据库的 index 层。也就是在表数据之外，再建一套按 key 快速找记录位置的辅助结构。在 P1 提供的 page/buffer 基础设施之上，实现数据库的索引层。

在数据库里，表存的是完整数据行；而 B+Tree 索引存的不是整行数据，它存的是：`key -> RID`。这里的 RID 就是这条记录在表里的位置。也就是说，B+Tree 本质上是一个“目录”或者“书的索引页”。

那为什么用 B+Tree？只有实现完后我们会发现：
- 查单点值很快，比如 WHERE id = 42
- 查范围也很快，比如 WHERE id BETWEEN 100 AND 200
- 按顺序扫描也很自然，比如 ORDER BY id

简而言之，我们需要实现一个真正能落在 page 上的磁盘友好的搜索树。

一进来就能看到 Project 2 的恶心之处了，如果看各个文件，会发现方法到处都是乱七八糟不知道从何看起，我们一个一个来，不要一上来看整段B+树逻辑，一个一个实现，把头文件读好，其他都迎刃而解，往往难写是难在对要实现的是什么不清楚，这个时候也就是只能继续堆阅读量了。

### B+Tree Page

这里面的 B+Tree Page 其实是比较水的，可以提一提的是这个柔性数组 `array_`。在 leaf 和 internal 中它是 `array_[0]`，那到底为什么这样写。

先让我们回顾，当你从 Buffer Pool 拿到一个页面时，它其实是一个普通的大数组。但是你通过 `reinterpret_cast` 强制把它看成了一个B+树的页对象。即：

| 偏移量 | 内容 | 属于谁 |
| :--- | :--- | :--- |
| 0 ~ 11 字节 | `page_type_`, `size_`, `max_size_` | `BPlusTreePage` (基类) |
| 12 ~ 15 字节 | `next_page_id_` | `BPlusTreeLeafPage` (子类) |
| **16 字节起** | **`array_` 的起点** | **`BPlusTreeLeafPage`** |
| 16 ~ 4095 字节 | **实际存储 Key-Value 对的地方** | 剩下的空白内存 |

其实这就是所谓的“**平铺**”布局：如果你的头文件里写的是 `std::vector<MappingType> array_`，那就全完了。
vector 是在**堆**上分配内存的。我们的 B+ 树页面必须是连续的物理内存，这样才能直接从内存写进磁盘，再从磁盘原封不动读回来。

所以，这种 `array_[0]` 的写法是保证了 KV 对紧紧地跟在元数据后面，中间没有任何指针跳转。

而如果是 internal，`next_page_id_` 都没有，`array_` 直接从 12 开始。

那 internal page 为什么也这么大？里面放的什么？里能放的是很多 key 和 child pointer。这样一个 internal page 就能把搜索空间切成很多段。类似于整棵树的路由表。

那为什么也是 `array_`？因为 page 本质上就是一块连续内存。不管是 leaf 还是 internal，最方便的组织方式都是前面固定 header，后面紧跟一个连续数组 `array_`，区别只是 `array_` 的元素类型不同：
- Leaf: `pair<KeyType, RID>`
- Internal: `pair<KeyType, page_id_t>`

### B+Tree

进入B+树整体部分，不熟悉B+树就随便找点动画视频看看马上就懂了，但真正开始代码，一看文档都快吓晕了，其实先不考虑删除，先只要做两件事：
1. `GetValue()`：给一个 key，能找到它对应的 value
2. `Insert()`：把一个新的 (key, value) 插进去，必要时分裂节点并维护 root

先不考虑删除、迭代器、并发。你在 Checkpoint 1 需要完成的是：
- 支持单点查询 `GetValue()`
- 支持插入 `Insert()`
- 实现 `GetRootPageId()` 等

其他文档中的细节，其实总结下来就是：
- 只支持 unique key，如果 key 已经存在，返回 `false`，不要重复插入
- 当插入导致页满了，要处理 split，或者自己的 redistribution 策略
- 如果 root 变了，要更新 header page 里的 `root_page_id_`
- 推荐用 P1 的 page guard
- 当前阶段可以主要用 FetchPageBasic
- `Transaction *txn` 先基本忽略
- `Context` 可用可不用，但插入时通常有帮助（别听官网的可用可不用，必须用，不然B+树难死你）

我们先分解成几个小目标。建议按这个顺序做：
1. page 类 helper
    - 这个是前面的 Task1
2. `GetRootPageId()`
    - root page id 不在树节点里，在 `b_plus_tree_header_page.h`
    - `GetRootPageId()` 本质上就是去 header page 里读 `root_page_id_`
    - 构造函数已经把它初始化成 `INVALID_PAGE_ID`
3. `IsEmpty()`
    - `IsEmpty()` 本质上就是看 root 是否无效
4. 实现“从 root 找到 leaf”的逻辑
    - 其实就是对于 internal 以及 leaf 的页柄类型转化与节点中的遍历，插入等操作的 helper，这种大规模使用的逻辑应该没人不单独拿出来吧。
5. `GetValue()`
    - 逻辑非常直观，直接出发一层层往下直到走到 leaf 后再找 key 就行了。
6. `Insert()` 的空树 case
7. `Insert()` 的 leaf 不分裂 case
8. `Insert()` 的 leaf 分裂 case
    - 分裂 leaf，产生一个新的右侧 leaf
    - 把一半元素挪过去
    - 维护 leaf sibling：next_page_id_
    - 把新 leaf 的最小 key插入 parent
9. `Insert()` 的 root 分裂 case + 更新 header
10. `Insert()` 的 internal 分裂 case
    - 这是 Task 2a 最难的部分，但也可以继续拆。
    - 向 parent 插入一条分隔信息
    - 如果 parent 也满了，parent 也 split
    - 这个过程可能一路向上
    - 检查是不是 root 分裂 case

这里面第一步容易卡住的可能是页的问题，B+树只有 `header_page_id_`，其是 `BPlusTreeHeaderPage` 的id，这是啥？是一个只存一个 `page_id_t` 却占着一个页的巨大浪费的头页，且只有它有 `root_page_id`，这怎么找？而且这么浪费，为什么不将 root id 存在树里面呢？一个B+树类竟然没有自己的 root id，这是因为 `BPlusTree` 类，是存在系统的堆里的。所有的物理对象，万物皆通过 Buffer Pool Manager 获取，这样才保证了持久化和统一页管理。并且其中，从 Buffer Pool Manager 中取得物理页后，还要把该页的 data 解释为 `BPlusTreeHeaderPage`，其中也有诸多方式，`reinterpret_cast` 文档中已经提醒过我们的，但更推荐的是直接用 `ReadPageGuard` 避免手动的 Pin 与 Unpin。

后面的实现中，有个语法的坑就是对于 `guard` 要获得节点，但不知道是 leaf 还是 internal 呢，那需要显式地说明是模板，即 `guard.template As<BPlusTreePage>();` 而非 `guard.As<BPlusTreePage>()`。

`GetValue()` 和 `Insert()` 的逻辑则相对直观，实现相对规整，需要注意一下很多小的实现里，有的是二分，有的的二分范围不一样，还有的是先二分找位置再线性挪窝，选择快速的方法好。而对于 `Insert()`，分支较多时需要分点逐个击破，其中分裂的逻辑确实是非常之恶心需要非常谨慎和仔细了，而且很容易写出意大利面代码，而且不知道为啥 clangd 在这里的很多地方都失效了导致我写出许多导致编译失败的代码，感觉先多开函数吧，这些B+树的分裂操作非常繁琐，本人重构了代码好多次了才勉强能看，最后写出了有点像是递归下降或函数式编程一样的都是卫函数的线性代码看起来才舒服了一点，嵌套最多一层写起来非常爽，最一开始的丑陋代码真的非常干扰思考。其次就是活用给出的 `Context`，用了之后才是真香啊。

其中还有些有关于 guard 的鲁棒性问题与类型问题也非常让人头疼，也是滚回 Project 1 的代码里面去打补丁了。我这里直接避开了 Project 1 的只返回 `BasicPageGuard` 的 `NewPageGuarded`，写了一个返回的是 `WritePageGuard` 的函数统一了 `write_set_`，方便管理，虽然这样似乎并不太好（回去动了上层，导致 `NewPageGuarded` 不会被调用一次🤣）。

分裂操作中，leaf 的逻辑非常容易理解，难理解的是 internal，leafPage 存的是 `key -> RID`，internalPage 存的是 `key -> child page id`。其中关键的是：`key[0]` 是无效的，或者可以理解是存储了一个虚拟的最小值 `-inf`，画成更像树的样子，例如下面这棵树：
```cpp
  [10 | 20 | 30]
 /    |    |    \
A     B    C     D
```

在 internal page 里则是存成：
```cpp
  value[0]=A
  key[1]=10, value[1]=B
  key[2]=20, value[2]=C
  key[3]=30, value[3]=D
```

即：
- A 对应 `< 10`
- B 对应 `[10, 20)`
- C 对应 `[20, 30)`
- D 对应 `[30, +inf)`

那么在 split 时，上传的是 `right->KeyAt(0)`，即父节点只需要知道右边那棵子树的最小边界是多少，这也就是区分左子树和右子树的分界线。

在理解了 leaf 的 split 之后，其实 internal 的 split 也是顺水推舟了，但这里难在重复的过程，这又体现了前面规整代码的重要性了，代码规整后就很好写了，也是写成了迭代式而非递归。

完成了 GetValue 和 Insert，我们再来考虑删除。

Waiting for updating

### Iterator

Waiting for updating

### 并发控制

Waiting for updating

## Waiting for updating


