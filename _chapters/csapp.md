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

    echo "[2/2] Extracting to $SRC_DIR..."
    mkdir -p "$SRC_DIR"
    tar -xf "$FILE_PATH" -C "$SRC_DIR"
    echo "Done!"
done

echo "-----------------------------------------------"
echo "All Labs Ready in '$SRC_DIR'."

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
ARG DEBIAN_FRONTEND=noninteractive
RUN apt-get -y update && \
    apt-get -y install \
    --no-install-recommends \
      gcc-multilib \
      gdb \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace

```

后续的一些可能涉及 Debug 之类的操作就直接进到 DevContainer 里面去手动 debug 就行了。

## Project 0: Datalab

原以为这只是简单的基础复习，没想到这是一个强迫你**把工程思维降维到 ALU 门级电路思维**的折磨过程，虽然是写 C 语言，但更像是搓数字电路与写汇编语言，可谓是用高级语言干机器语言的事。性质类似举重运动员练深蹲，练习的位级代码在高级语言的开发中其实用处是比较窄的。

大部分难题其实还是十分简单的，但有的需要提前知道一些二进制数的 feature，可以算是**前置知识**，同时也是个人感觉该 Project 的价值点所在了。

### 二进制知识

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

## Project 1: Bomb

如果说 Datalab 是强迫你把工程思维降维到 ALU 门级电路，那 Bomblab 就是强迫你**把思维降维到寄存器与内存布局**。虽然说未来在工作中纯手工 Debug 汇编代码的概率微乎其微，但你会去读屎山。这个 Project 的意义在于消除对二进制“屎山”的恐惧，并遇到 Segmentation Fault 时，脑子里能浮现出内存和栈。

不需要太多前置知识，工作性质类似于：对着极其丑陋、充满历史包袱的 x86 CISC 汇编指令，做纯 dirty work 体力活级别的阅读理解。

### GDB

常用的 GDB 指令速查表：

| 分类 | 指令 | 作用描述 | 拆弹实战场景 |
| :--- | :--- | :--- | :--- |
| **断点控制** | `break <func>` (或 `b`) | 在某函数或地址打断点 | 一开始必定先执行 `b explode_bomb`，剪断引信。 |
| **执行控制** | `run <file>` (或 `r`) | 开始运行程序（可带参数文件） | `run ans` 自动加载你已经写好的前面关卡的答案。 |
| | `stepi` (或 `si`) | 单步执行（进入函数） | 观察某个特定跳转或寄存器变化时使用。 |
| | `nexti` (或 `ni`) | 单步执行（跳过函数） | 遇到 `call sscanf` 时直接跳过库函数。 |
| **代码查看** | `disas <func>` | 反汇编某个函数 | `disas phase_1` 直接纵览整个关卡的逻辑。 |
| | `layout asm` / `layout reg` | 打开 TUI 图形模式 | 实时左右分屏看汇编指令和寄存器的变化。 |
| **内存/寄存器** | `info registers` (或 `i r`) | 查看所有寄存器当前的值 | 找规律时，看看 `%rax` 或 `%ebx` 里存了什么。 |
| | `x/s <addr>` | 以**字符串**格式查看内存 | 遇到 `cmp` 或 `strings_not_equal`，直接去读地址里的明文。 |
| | `x/wx <addr>` / `x/gx` | 以**十六进制字/长字**查看内存 | 分析跳转表。 |
| | `x/8d <addr>` | 以**十进制**查看连续 8 个内存单元（8改为其他同理） | 打印整数值。 |

### 汇编

前几个阶段的通关过程，基本上就是“找规律”的体力活：
*   **Phase 1（字符串比较）**：开胃菜。反汇编后找到 `mov $0x40xxxx,%esi`，直接用 `x/s` 查看该地址，答案就在脸上。
*   **Phase 2（循环与数组）**：观察寄存器的累加与移位操作（如 `add %eax, %eax`），推断出一个 $1, 2, 4, 8, 16, 32$ 的等比数列。
*   **Phase 3（Switch 跳转表）**：初见 CISC 寻址的丑陋。`jmp *0x40xxxx(,%rax,8)`，解法是用 `x/8gx` 把跳转表打印出来，顺藤摸瓜。

示例的第一阶段 debug 通关过程：

![phase1](/assets/img/csapp/phase1.png#w60)

后续写入答案后，假设文件名为 `ans`，可以直接在 GDB 中 `run ans` 加载进度，避免反复手敲。

phase 1~5 都是坚持着看屎山就都没什么问题的，不过 phase 6 看到最后是真放弃了，汇编语言的**链表节点重排**。在高级语言里极其简单的 `node->next->value` 逻辑，在汇编里变成了满篇的基于偏移量的间接寻址（`*(int **)(piVar1 + 2)`）。最后使用`pyelftools`写一个`python`脚本做控制流二进制分析或`Ghidra`反编译都行，用`pyelftools`的话只能跑出答案但不能直接得到反编译代码，愿意练汇编语言 Debug 的原教旨主义可以坚持看看。而且感觉其实可能直接看可能还更快只不过枯燥了点。

回过头看，这两个 Lab 极度推崇“知其所以然”的底层。虽然确实很酷，但感觉绝大多数情况下这种训练的边际效益正在递减。吃下了这坨 CISC 历史包袱的“屎”，体会过底层硬件执行的物理感，就足够了，只把它作为一次体能训练。

### 后续

之后才发现听说有隐藏关？我做的时候都完全没注意到，这里提一嘴让如果还没做的读者留个心眼注意一下吧。盲猜应该还是类似看汇编语言的脑筋急转弯但难度 plus 版本。

## Project 2: Attacklab

整体来看，Project 2 就是在 1 的基础上继续训练汇编，我对其的评价与 1 类似，不过这里更加轻松一点，调试的 dirty work 少得多，更多的问题还是不知道要实现的目标是什么而一直看汇编代码，`README` 非常简陋不知道在干什么。

一进去什么说明都没有，看都看不懂，最后研究了一下各个文件，其中，`target1/README.txt` 里提到：
- ctarget 是 “code-injection vulnerability”
- rtarget 是 “return-oriented programming vulnerability”

这两句不是普通的介绍，它实际上在告诉你：
- ctarget 里有一个可用于代码注入的漏洞
- rtarget 里有一个可用于 ROP 的漏洞

所以虽然意思就是“这两个程序就是带漏洞的实验目标”，我们要攻击这两个程序。即给程序一段特殊输入，让它在运行时把内存里的控制流走偏，达到我们需要的目的。

因此不管要做的是什么，先得到汇编代码然后分析肯定没错：

```bash
objdump -d ./ctarget > ctarget.asm
objdump -d ./rtarget > rtarget.asm
```

这个 project 的验证方法也没有细说，`README` 非常简短没提到这一点，需要自行分析：

1. target1/hex2raw 是“生成字节序列的工具”
2. ctarget -h 和 rtarget -h 说了它们支持两种喂输入方式：
    - -i <infile>
    - 或者直接从标准输入读

因此我们需要把 phase1 里写的十六进制 exploit 转成真实字节，再作为输入喂给 ctarget 做本地验证。简而言之：
- phaseN：我们手写的十六进制 payload
- hex2raw：翻译器
- ctarget / rtarget：验收器
- -q：本地模式

一个参考的测试脚本：

```bash
cd ./src/target1
./hex2raw < phase1 > /tmp/phase1.in
./ctarget -q -i /tmp/phase1.in
./hex2raw < phase2 > /tmp/phase2.in
./ctarget -q -i /tmp/phase2.in
./hex2raw < phase3 > /tmp/phase3.in
./ctarget -q -i /tmp/phase3.in
./hex2raw < phase4 > /tmp/phase4.in
./rtarget -q -i /tmp/phase4.in
./hex2raw < phase5 > /tmp/phase5.in
./rtarget -q -i /tmp/phase5.in
```

> 不过在此提一嘴**管道**问题，有的同学可能，包括我最一开始，会写出这样的测试脚本：
> 
> ```bash
> cd ./src/target1
> ./hex2raw < phase1 | ./ctarget -q
> ./hex2raw < phase2 | ./ctarget -q
> ./hex2raw < phase3 | ./ctarget -q
> ./hex2raw < phase4 | ./rtarget -q
> ./hex2raw < phase5 | ./rtarget -q
> ```
> 
> 这种直接管道传输在一些环境能蒙混过关，在另一些环境例如 Docker 中这种更严格的环境里会炸。
> 
> 按“输入字节相同”这个抽象层面看，这两段脚本本来应该等价。但我在 WSL 和 Dockers 中分别测试，结果不同。从 ctarget 反汇编里确认，原因为：
> 
> 1. **`-i` 和管道不是同一条启动路径**：
> 
> `ctarget` 的 `main` 默认先做：`infile = stdin`。但如果传 `-i xxx`，它会改成：`infile = fopen(xxx, "r")`。
> 然后在 `Gets` 里，不是写死读 `stdin`，而是读这个全局变量：
> 
> ```bash
> mov infile, %rdi
> call _IO_getc
> ```
> 
> 两种方式最终都会进同一个 Gets 循环，但底层流对象不同：
> - 管道版：`infile == stdin`，而且这个 `stdin` 是 pipe
> - -i 版：`infile` 是普通文件
> 
> 2. **程序在 `stdin` 模式下还会走额外分支**：
> 
> 在 `launch` 里有一段判断：如果 `infile == stdin`，先打印 `Type string:`；如果不是，就跳过。也就是说，程序自己就把“从 stdin 读”和“从文件读”当成两种模式处理。
> 
> 现在这题不是普通程序，而是一个故意触发未定义行为的漏洞实验。一旦在栈上改返回地址，程序已经离开“正常保证区”了。一般来说两种实现完全区别不要紧，但对于这种栈溢出实验，两种实现不一定等价。这里的程序本来就在刻意人为控制栈环境，这些题对运行时上下文的敏感度就比普通程序更高，导致了环境不同结果不同的离谱情况了。

### 代码注入漏洞

其实本质上还是读汇编代码，不同的 phase 就是要你跳到不同的`<touchN>`的函数入口，所以直接找到对应的地址然后通过注入代码使得程序能跳到对应位置即可。例如 `phase1`，看清 `getbuf` 的栈布局，然后把它的返回地址改成 touch1，其实就是这么简单的。

总览来看，三个 Phase 逐级增强：
- Phase 1：只控制程序“跳到哪”
- Phase 2：控制“跳到哪” + “第一个整数参数是什么”
- Phase 3：控制“跳到哪” + “第一个参数是个指针，而且它指向的字符串也得对”

**`phase1`**：

观察 `ctarget.asm`，可以发现跑一次 `ctarget`，会调用一次 `getbuf`，直接找到 `<getbuf>`，可见：

```asm
00000000004017a8 <getbuf>:
  4017a8:	48 83 ec 28          	sub    $0x28,%rsp
  4017ac:	48 89 e7             	mov    %rsp,%rdi
  4017af:	e8 8c 02 00 00       	call   401a40 <Gets>
  4017b4:	b8 01 00 00 00       	mov    $0x1,%eax
  4017b9:	48 83 c4 28          	add    $0x28,%rsp
  4017bd:	c3                   	ret
  4017be:	90                   	nop
  4017bf:	90                   	nop
```

也就是说开辟了 40 字节的栈空间，根据我们能从汇编中找到 `touch1` 的地址，是假设 `0x<address>`。所以 Phase 1 的 payload 逻辑就是：前 40 字节随便填，接下来 8 字节写 touch1 地址，小端序。也就是：`[40 bytes padding] [0x<address>]`。

写入对应的文件 `phase1` 即可。也就是说，这里只需要认识栈溢出的最基本形式：覆盖返回地址，跳到目标函数。

**`phase2`**：

关键在于函数的不同，`touch1` 不要参数，但 `touch2` 和 `touch3` 要参数。

Phase 1 简单，是因为只要让 ret 跳过去，它自己就能执行成功，即 `touch1()`。

Phase 2 中，不能直接把地址改成 touch2，因为 touch2 是`touch2(unsigned val)`，会检查传进来的参数是不是你的 cookie。所以其实很简单，x86-64 里，函数第一个参数放在 `%rdi`，在 Phase 1 的基础上，直接多一步写入 cookie 值即可。简单来说即：

1. 利用溢出把返回地址改到自己输入的代码
2. 这段小代码负责把 cookie 放进 %rdi
3. 然后再 ret 到 touch2

也就是说，我们需要注入一段汇编代码使得 cookie 成为传递的参数，但问题来了，怎么注入？其实只需要写一小段汇编，然后让工具把它编成机器码即可。参考的提示如下：

```bash
gcc -c phase2.s -o temp.o
objdump -d temp.o
```

现在只需要把你需要的汇编 `phase2.s` 写入即可。而且我们也可想而知，`phase2` 里面的二进制代码则是稍微复杂些的 `[注入代码] [填充字节] [覆盖 getbuf 返回地址 = 注入代码地址] [给注入代码 ret 用的下一跳地址 = touch2]` 这种结构了。但这样的 “纯 ret 串链” 非常容易失败，因为需要多占 8 字节，导致 Gets 的自动终止符容易把上一层栈帧踩坏了，因此我当时也没有想怎么让后面放得下而是用了另一种方法。

更推荐而且更省栈空间的方法是将汇编 `phase2.s` 修改一下。让它在原来的基础上，跳板代码放在缓冲区开头的地址，再自己把 `touch2` 压栈并 `ret` 过去。这样只需要多加一行 `push`，即这样一个跳转逻辑："getbuf -> 跳到注入在栈里的跳板代码 -> 跳板代码再去 touch2"。

但现在遇到问题了，无论哪种方法，我们都还需要知道栈上注入代码的地址。如果不知道这个地址，就没法让 `getbuf` 的 `ret` 跳回我们自己的代码。

这个时候应该使用 gdb 自己调手动找，不过最一开始我想偷懒了，按理来说，其实能直接看汇编代码逻辑，就能避免手动的 gdb 搬砖。汇编代码里，复杂的就是返回地址的计算了，这个地址在缓冲区的最开头，自信地去 `launch` 找压栈逻辑，结果非常可怕，不是简单的结构，它故意加了层层包装，例如 `initialize_target`，`stable_launch`，`launch`，`buf_offset`，人工切换到新栈。导致“缓冲区开头是多少”变的非常复杂。😱

于是放弃了耍小聪明，不计算返回地址了，老老实实 gdb 调试了。😭

但其实最后这样调试，也只是一两个简单命令就好了，即在 `getbuf` 里看 `%rsp`，跳转到对应位置先走一步进入缓冲区，然后查看寄存器一个命令直接就解决了，不知道之前在想什么竟然还想手动算出返回地址。😅

**`phase3`**：

这里的 `touch3` 更麻烦，`touch3(char *s)` 要的是一个指针，这个指针得指向一个特定的字符串，即不能只是跳过去，还得保证：
- %rdi 里放的是某个内存地址
- 这个地址指向一段有效字符串
- 字符串内容正好满足要求

但其实，只是在 `phase2.asm` 上稍微修改一点点即可，使用当前地址寄存器 `%rip` 指向需要的地址。

在撰写汇编代码时，你可能写出这样的代码但是失败了：

```bash
    leaq cookie_str(%rip), %rdi
    pushq $0x4018fa
    ret
cookie_str:
    .asciz "59b997fa"
```

失败是因为字符串放得太低。被 touch3 -> hexmatch 的入栈过程给踩坏了。进入 touch3 以后，程序还会继续压栈：
1. touch3 先 push %rbx
2. 然后 call hexmatch
3. hexmatch 开头又会 push 几次

所以会看到：`Misfire: You called touch3("")`，加了 `nop` 甚至多个 `nop` 也没用，因为中间被覆盖的区域非常大。也就是说，Phase 3 反而不适合字符串放在中间。故代码只能改为用 `mov $0x????????, %edi` 来手动计算地址后直接赋值地址的情况，并且提前将 "59b997fa" 的机器码得到以便待会放进去

剩下如何写 `phase3` 也只是类似 `phase2` 的顺水推舟。

我最一开始写出上述的代码失败，是因为受到 `phase2` 的启发，误认为将字符串放在最后会容易把上一层栈帧踩坏了导致无法正确跳转，但实际上：
- Phase 2 失败版：多出来的字节是“下一跳地址”，会改变 `%rsp` 和对齐。
- Phase 3 成功版：多出来的字节是“字符串数据”，不会被 `ret` 消费。

所以长度不是核心，字节的角色才是核心。48 字节之前，控制 `getbuf` 的返回；48 字节之后：
- 如果放的是“还要被 ret 用的地址”，就很敏感。
- 如果放的是“普通数据字符串”，而且位置安全，就完全可以超过 48。

### 面向返回编程漏洞

README 说 `rtarget` 负责 phase 4-5，`rtarget` 里仍然有三个目标函数：`touch1`、`touch2`、`touch3`，但 `rtarget` 的存在意义是 ROP，也就是要考带参数调用的难点。所以这两个 phase 分别要导入的是 `touch2` 和 `touch3`，正好对应后两关要考的“整数参数”和“指针参数”。虽然和之前的代码绝大部分几乎完全一样，但由于 `rtarget` 将缓冲区地址随机化了，通过让栈上代码地址不再稳定，从而逼我们放弃代码注入，改用固定地址的 gadget。

总体来看这 5 个 phase：
1. 改返回地址
2. 改返回地址并带整数参数
3. 改返回地址并带字符串指针
4. 不能自己写代码，只能拼 gadget 来做第 2 步
5. 不能自己写代码，只能拼 gadget 来做第 3 步

因此现在的 phase 更像是：
```md
[40字节填充]
[第一跳去哪]
[中间插入要用的数据]
[第二跳去哪]
...
[最后跳去touch2]
...
```

也就是说我们要利用 `farm.c` 中的 gadget，但明显，点开 `farm.c`，里面根本不是人读的啊，这是反而汇编语言比高级语言易读（bushi）。不过我们也不需要继续编译了，在 `rtarget.asm` 中已经有，从 `start_farm` 到 `end_farm` 的这一段就是我们的 farm。虽然说如此，但里面的汇编指令也各个都不明不白的，明显不是按编译器给你的函数边界来跳，而是从现有字节流的任意偏移切进去，只要切进去后恰好解码成你想要的指令序列就行。

**Phase4**：

Phase 4 要做的是即之前的 `touch2`，但这一次不能跳到自己的代码中，所以大致思路就是：
- 从栈拿一个值
- 把它放进 %rdi
- 跳到 touch2

即如果你手头恰好有：
```asm
pop %rdi
ret
```
那最好，能直接用，否则如果只有中转，则只能：
```asm
pop ???
mov ??? %rdi
ret
```
如果还不行，可能要连续好几次 `ret`，即将它们拆开：
- 第一跳的：
```asm
pop ???
ret
```
- 叠加上第二跳的：
```asm
mov ??? %rdi
ret
```

但不管是什么，我们都需要机器码，所以没办法，我们到这里甚至还到了需要看看 opcode 的**超 dirty work** 了，感觉也没什么别的技巧，就多自己写写汇编然后看看机器码啥样子吧，至少也要先知道这些基本的编码：
- `ret` 是 `c3`
- `nop` 是 `90`
- `pop %rax` 到 `pop %rdi` 的这一组 `pop reg` 是 `58`~`5f`
- `mov reg %rdi` / `lea reg` 一般是 `4889xx` / `488dxx`

这样就已经够通关了。所以我们之前需要的机器码，就是 `5fc3` 或 `5x4889xxc3` 或跳两次 `5xc3` 加上 `4889xxc3`，中间都可以插入若干的 `90`，仔细寻找，也可以用正则表达式等，最后发现只能是选择跳两次了。也就是：

```asm
pop %rax
ret
```

```asm
mov %rax %rdi
ret
```

**Phase5**：

类似的，进入 `touch3` 时必须满足 `%rdi` = 某个地址，并且这个地址指向目标值，要同时准备两样东西：
1. %rdi 里有正确地址
2. 那个地址指向的字符串还活着

只是这次不能自己注入代码，而要靠 gadget 链完成。

同样拆解：
```md
[40字节填充]
[第一跳去哪]
[字符串地址]
[第二跳去哪]
...
[最后跳去touch3]
[字符串]
```

但这里的逻辑复杂的多，不像前一个，只有两种可能然后切割就好了，而这里其实完全可以是简单的：

```asm
mov $cookie的字符串地址, %rdi
ret
```

直接给 cookie 的地址后 `ret` 到 `touch3`，但问题是，这个地址非常复杂，一步一步来，先拆解为 `%rdi = base(%rsp) + offset`，也就是：

```asm
mov %rsp, %rdi  ; 获得 base
pop %rsi        ; 获得 offset，phase5 中到时候专门写一个取的 offset
add_xy          ; addr = base + offset
mov %rax, %rdi  ; 这里可以复用 Phase4 的 gadget
ret
```

其中，利用到的 `add_xy` 的逻辑是将 `%rax = %rdi + %rsi * 1`，当然找 `%esi` 去 `mov` 也行。其中，有的逻辑在 Phase4 中已经用过，可以来复用的，但即使这样，我们也仍然缺失大量的目标代码，在 gadget 翻垃圾后，能将第一行和第二行都拆出极其复杂的 `mov` 逻辑（这里也可见是题目故意走弯路的，目的就是让我们难受，去读很多汇编代码），即：

```asm
mov %rsp, %rax
mov %rax, %rdi

pop %rax
mov %eax, %edx
mov %edx, %ecx
mov %ecx, %esi

add_xy

mov %rax, %rdi

ret
```

然后就差 offset 就能写出 phase5 的机器码了。而 **offset** 其实就等于**字符串地址**减去**执行 `mov %rsp,%rax` 时的 `%rsp`**。因为，offset 不是从开头开始数，也不是从 `pop` 的那个位置开始数，而是**从保存 %rsp 的那一刻开始数**，因为我们存 base 的时候是这个位置的 base，同时还有一个比较坑的是 `%rsp` 指的是当前栈上的下一个位置，而非当前指令，知道了这个就很好办了。
