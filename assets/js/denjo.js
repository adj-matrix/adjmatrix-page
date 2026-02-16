const rawData = `电情
	电路
		直流电路
			电阻电路
				电阻等效
					并联等效
						10
				电阻功率
					15
				惠斯通电桥
					23E
				数模转换器 DAC
					权电阻网络 DAC
						10
						18
					R-2R 梯形网络 DAC
						10
						18
					DAC 输入信号
						18
					DAC 等效
						18
					灵敏度分析
						10
					不同实现的比较
						18
			电路定理
				方法论
					节点电压法
						21E
				替代定理
					10
				戴维南定理
					频域戴维南等效电路
						21E
					逐级戴维南等效电路
						10
			电器元件
				电感
					19
				电容
					电荷守恒
						24E
						12
					能量守恒
						12
						15
						19
					双电容悖论情况
						24E
						12
			非线性电阻
				等效
					12
		交流电路
			正弦稳态电路
				阻抗
					LC 并联电路
						20E
					RL-C 并联电路
						20E
					RL串联电路
						20
					复杂混联电路
						21E
				有效值
					电流
						20
						23
				复功率
					功率因数
						20
					RL 串联功率
						20
					RL-C 并联功率
						20
					最大传输功率
						24E
				谐振
					电阻的谐振条件
						20E
					LC 并联谐振
						20E
					RL-C 并联谐振
						20E
						20
					RLC 串联谐振
						23
				波特图
					20E
			耦合
				互感
					23E
				解耦
					23E
				变压器
					线圈匝数关系
						24
					变压器等效
						24
		暂态分析
			直流暂态电路
				二阶电路
					双电容电路
						12
					RLC 串联电路
						24E
					RCC 串联
						12
					RC 串联
						16
					LC 串联
						19
					复杂混联电路
						21E
					阻尼
						21E
						23E
						24E
						11
				三要素
					17
			正弦暂态电路
				复频域分析
					阻抗
						阻抗等效
							24
					电路
						RC 串联
							17
						RL 串联
							21
						RLC 串联
							23
						RC 并联
							23E
							24
					拉普拉斯变换
						17
						21
					拉普拉斯逆变换
						21
						23
						24
					传递函数
						11
					阶跃响应
						11
			电荷泵
				双电容电荷泵
					24E
			斩波电路
				降压斩波电路
					15
				升压斩波电路
					19
			开关电源电路
				开关频率
					15
				小纹波近似
					15
			离散化电路
				RC 串联
					17
				差分方程
					17
				稳态
					17
				通解
					17
			暂态响应曲线
				16
				21
		二端口网络
			方程
				22
			转移函数
				RL-C 并联
					22
				幅值特性
					22
			连接
				级联
					22
		均匀传输线
			传输线方程
				推导
					22E
			输入阻抗
				推导
					22E
		微电子电路
			运算放大器
				非理想运放
					13
					14
					18
				饱和电压
					16
				理想运放
					虚短
						18
				负反馈运放
					电压放大器
						跟随器
							11
							13
						同相放大器
							14
						反相放大器
							13
							14
							18
					积分器
						14
				正反馈运放
					多谐振荡器
						16
				转移函数
					幅值特性
						22
				输入阻抗
					14
			电子开关
				13
			滤波器
				13
			有限带宽
				14
	计算机体系结构
		汇编
			汇编代码
				代码补全
					15
		处理器
			流水线
				流水线周期
					15
				数据依赖
					11
					15
				冒险
					数据冒险
						阻塞
							15
					控制冒险
						分支预测
							15
				流水线 CPI
					15
		存储器
			多级存储
				不同实现的比较
					21
			Cache
				局部性
					13
				Cache Miss
					Compulsory miss
						10
					Capacity miss
						10
					Conflict miss
						10
				Cache 的容量
					10
				Cache CPI
					一级
						21
					多级
						21
				Cache 冲突
					10
				相联度
					10
				写策略
					写回
						21
			虚拟存储
				页表
					概念
						13
					页表的容量
						18
						21
					单级页表的缺陷
						18
					改进
						21
				缺页
					概念
						10
					行为
						10
						13
						18
				多级页表
					18
				TLB
					概念
						10
						13
					TLB 的缺失
						10
						13
						18
					TLB 的容量
						10
					TLB的访存次数
						18
				TLB 和 Cache
					10
		并行
			超标量
				Cache
					14
				硬件预取
					14
				非阻塞缓存
					14
				依赖
					依赖的检测
						11
					真依赖
						11
					假依赖
						11
					寄存器重命名
						11
	数字电路
		二进制
			数制
				补码
					19
					22
				溢位检测
					19
					22
			门电路
				NAND
					23E
				完备性
					23E
			门延迟
				24E
			逻辑表达式
				23E
				24
		组合逻辑
			卡诺图
				20E
				24E
				17
				20
				23
			真值表
				21E
				22
			加法器
				全加器
					22E
				行波进位加法器
					22E
					24E
				非等位加法器
					19
					22
				减法器
					24E
					19
					22
				加减运算器
					24E
				溢位检测
					19
					22
			乘法器
				阵列乘法器
					22E
			比较器
				21E
			多路选择器
				21E
			组合逻辑电路设计
				21E
		时序逻辑
			时序逻辑电路
				12
				20
				23
			触发器
				时序图
					16
			状态机
				Moore型
					17
					24
				Mealy型
					20
					23
				状态机的路径
					20E
				状态机的可达
					23E
				状态机的输出
					23
				状态机的化简
					20E
					20
					23
				状态转移表
					20E
					23E
					17
					20
					23
					24
			计数器
				升序
					12
					16
				十进制
					16
				可控制升降序
					16
				扭环形计数器
					23E
				循环发射器
					12
					24
			时序比较器
				21E
			时序逻辑电路设计
				20E
				12
				16
				17
				20
				23
			时序状态编码转换
				24
	算法分析
		基础算法
			数论算法
				GCD
					长除法
						运行
							14
						代码实现
							14
						停机证明
							14
					辗转相除法
						代码实现
							14
						迭代次数上界
							14
			斐波那契算法
				递归实现
					代码实现
						13
				非递归实现
					代码实现
						13
				通项公式实现
					优缺点
						13
				不同实现的比较
					13
		排序算法
			归并排序
				代码实现
					23E
				时间复杂度
					23E
				二路归并操作
					23E
					10
				多路归并操作
					10
			堆排序
				建堆堆排序
					20E
				堆排序
					20E
			快速排序
				运行
					24E
				代码实现
					24E
				最差/最优情况
					24E
				时间复杂度
					最差时间复杂度
						24E
					平均时间复杂度
						24E
		图算法
			图的性质
				有向图
					弱连通
						12
			图基本操作
				遍历
					DFS
						运行
							12
						环路检测
							12
						后序遍历
							17
				拓扑排序
					运行
						17
					应用
						17
					DFS-拓扑排序
						代码实现
							17
						时间复杂度
							17
					Kahn
						思路实现
							17
			最小生成树
				Prim
					正确性证明
						15
					运行
						15
					代码实现
						15
					时间复杂度
						15
					优化
						堆
							15
				基础实现
					代码实现
						24
					运行
						24
				次小生成树
					代码实现
						24
					运行
						24
			单源最短路径
				松弛
					18
				Bellman-Ford
					运行
						18
					路径
						18
					时间复杂度
						18
				Dijkstra
					代码实现
						18
			最大流
				Ford-Fulkerson 算法
					代码补全
						22
					求解
						22
					时间复杂度
						22
				应用
					22
			二分图
				二分图问题转化为最大流问题
					22
		数组与字符串算法
			众数
				摩尔投票
					运行
						16
					代码实现
						16
					正确性证明
						16
					循环不变式
						16
			数组
				子数组
					最大子数组和
						枚举法
							运行
								23
						滑动窗口
							代码实现
								23
						Kadane 算法
							代码实现
								23
						满足约束条件的最大子数组和
							代码实现
								23
						最大平均值子数组和
							代码实现
								23
			字符串
				子串
					最小覆盖子串
						枚举法
							代码实现
								19
							运行
								19
						滑动窗口
							代码实现
								19
							增量更新
								19
					模式匹配
						枚举法
							代码实现
								21
							运行
								21
							时间复杂度
								期望时间复杂度
									21
						Rabin-Karp
							代码实现
								21
		其他应用
			形式语言与自动机
				DFA
					21
			数据库系统
				DBMS
					11
				关系代数
					11
				SQL
					特性
						11
					连接操作
						11
				Schema
					Schema 变更
						11
			代码修复
				检查 Bug
					10
		数据结构
			树
				二叉树
					堆
						概念
							15
						建堆
							运行
								20E
							过程
								20E
							时间复杂度
								20E
					BST
						Create
							代码实现
								22E
							运行
								22E
						‌Retrieve
							代码实现
								22E
						Delete
							思路实现
								22E
						边界情况
							22E
						与数组的比较
							22E
				并查集
					运行
						20
					代码实现
						20
					时间复杂度
						20
					优化
						按大小合并
							20
						带时间戳
							20
			图
				邻接表
					12
				邻接矩阵
					12
			Hash 表
				模 n Hash
					Create
						代码实现
							21E
						运行
							21E
					‌Retrieve
						代码实现
							21E
					Delete
						思路实现
							21E
				Hash 映射
					10
				Hash 采样
					10
	机器学习
		最小二乘法
			误差平方和
				24
			正规方程
				24
			线性相关性
				24
			加权最小二乘法
				24
			计算
				24
	数字信号处理
		信号
			数理基础
				基础的对数运算法则
					11
				基础的复数运算法则
					11
			卷积
				10
			信号
				奇偶性
					22E
					20
				因果性
					22E
				Kramers-Kronig 关系
					22E
				幅度
					21
				对数幅度
					11
		系统
			系统的等效
				20E
			时域卷积
				24E
			冲激响应
				24E
		FS
			冲激串
				18
			吉布斯现象
				21
		CTFT
			存在性条件
				23E
			性质
				卷积性质
					11
					20
				时移性质
					21
				共轭性质
					21E
					22E
					15
				时域微分性质
					20
				奇偶虚实性
					22E
					20
				对偶性
					23E
			CTFT
				冲激函数
					21E
				冲激串
					21E
					11
					18
				门函数
					门函数的FT
						23E
						20
						21
					门函数的线性组合
						20
					门函数的卷积
						20
				Sa 函数
					21E
					23E
				Si 函数
					21
			帕塞瓦尔定理
				能量谱密度
					15
				能量守恒
					15
			传递函数
				21
			和 FS 的区别
				15
		DTFT
			乘积性质
				18
		采样
			滤波器性质
				20E
			采样定理
				21E
			混叠
				18
			抗混叠滤波器
				21
		调制
			双边带调制
				22E
			单边带调制
				22E
		拉普拉斯变换
			传递函数
				17
		Z 变换
			公式
				17
				22
			收敛域
				22
			性质
				时移性质
					10
				卷积性质
					10
			Z 变换
				几何级数
					21
					22
			传递函数
				传递函数
					20E
					10
					22
				逆传递函数
					24E
			 稳定性
				24E
				21
			方框图
				20E
				17
				22
			差分方程
				10
				17
				21
			变换
				双线性变换
					17
	信息论
		概率论
			全概率
				20E
				24E
			概率密度函数
				19
		熵
			信息量
				24E
			信息熵
				22E
				24E
				16
				19
			条件熵
				24E
			互信息
				22E
				23E
				24E
			马尔可夫链
				状态转移图
					21E
					12
					23
				稳态
					21E
					12
					14
					23
				状态转移计算
					12
					14
					23
				游程
					概率
						14
					期望
						14
				信源熵
					21E
					12
					14
					23
				记忆性
					14
		无损压缩编码
			二进制编码
				定长编码
					23
				哈夫曼编码
					22E
					12
					16
					19
					23
			平均码长
				定长编码
					23
				哈夫曼编码
					19
					23
			不同实现的比较
				23
		信源编码
			最大熵
				24E
				19
			编码效率
				21E
			线性预测
				16
			预测编码
				16
			冗余信息
				16
		信道容量
			无记忆信道
				Z 信道
					20E
					22E
				BSC
					23E
			有记忆信道
				块衰落信道
					20E
			独立信源
				23E
		信道编码
			有记忆信道
				20E
		模拟信源与模拟信道
			量子化
				最小均方误差
					推导
						19
					计算
						19
`;

const config = {
    vSpace: 40,
    hSpace: 250,
    duration: 400
};

function parseData(text) {
    const lines = text.split('\n');
    const root = { name: lines[0].trim(), children: [] };
    const stack = [{ node: root, depth: 0 }];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;
        const content = line.trim();
        const depth = line.match(/^\s*/)[0].replace(/\t/g, '    ').length / 4;
        const newNode = { name: content };
        while (stack.length > 0 && stack[stack.length - 1].depth >= depth) stack.pop();
        const parent = stack[stack.length - 1].node;
        if (!parent.children) parent.children = [];
        parent.children.push(newNode);
        stack.push({ node: newNode, depth: depth });
    }
    return root;
}

const svg = d3.select("#mindmap");
const gMain = svg.append("g");
const treeLayout = d3.tree().nodeSize([config.vSpace, config.hSpace]);

let dataRoot = d3.hierarchy(parseData(rawData));
const leafNodes = dataRoot.leaves();
dataRoot.x0 = window.innerHeight / 2;
dataRoot.y0 = 0;

svg.call(d3.zoom().on("zoom", (e) => gMain.attr("transform", e.transform)));
gMain.attr("transform", `translate(120, ${window.innerHeight / 2}) scale(0.8)`);

const allLeaves = Array.from(new Set(dataRoot.leaves().map(d => d.data.name))).sort();
const datalist = d3.select("#yearList");
allLeaves.forEach(name => datalist.append("option").attr("value", name));

dataRoot.descendants().forEach(d => {
    if (d.depth >= 2 && d.children) {
        d._children = d.children;
        d.children = null;
    }
});

update(dataRoot);

function update(source) {
    const treeData = treeLayout(dataRoot);
    const nodes = treeData.descendants();
    const links = treeData.links();

    nodes.forEach(d => d.y = d.depth * config.hSpace);

    const node = gMain.selectAll("g.node")
        .data(nodes, d => d.id || (d.id = Math.random()));

    const nodeEnter = node.enter().append("g")
        .attr("class", d => `node ${d.depth === 0 ? 'node-root' : ''}`)
        .attr("transform", `translate(${source.y0},${source.x0})`)
        .on("click", (e, d) => {
            if (d.children) { d._children = d.children; d.children = null; }
            else { d.children = d._children; d._children = null; }
            update(d);
        });

    nodeEnter.append("circle").attr("r", 6);

    nodeEnter.append("text")
        .attr("dy", ".35em")
        .attr("x", d => d.children || d._children ? -15 : 15)
        .attr("text-anchor", d => d.children || d._children ? "end" : "start")
        .text(d => d.data.name);

    const nodeUpdate = nodeEnter.merge(node);

    nodeUpdate.transition().duration(config.duration)
        .attr("transform", d => `translate(${d.y},${d.x})`);

    nodeUpdate.select('circle')
        .style("fill", d => d._children ? "#38bdf8" : "#0b0f1a");

    node.exit().transition().duration(config.duration)
        .attr("transform", d => `translate(${source.y},${source.x})`).remove();

    const link = gMain.selectAll("path.link")
        .data(links, d => d.target.id);

    const linkEnter = link.enter().insert("path", "g")
        .attr("class", "link")
        .attr("d", d => {
            const o = { x: source.x0, y: source.y0 };
            return diagonal(o, o);
        });

    linkEnter.merge(link).transition().duration(config.duration)
        .attr("d", d => diagonal(d.source, d.target));

    link.exit().transition().duration(config.duration)
        .attr("d", d => {
            const o = { x: source.x, y: source.y };
            return diagonal(o, o);
        }).remove();

    nodes.forEach(d => { d.x0 = d.x; d.y0 = d.y; });
}

function diagonal(s, t) {
    return `M ${s.y} ${s.x} C ${(s.y + t.y) / 2} ${s.x}, ${(s.y + t.y) / 2} ${t.x}, ${t.y} ${t.x}`;
}

function handleExpandAll() {
    function expand(d) {
        if (d._children) { d.children = d._children; d._children = null; }
        if (d.children) d.children.forEach(expand);
    }
    expand(dataRoot);
    update(dataRoot);
}

function handleCollapseAll() {
    function collapse(d) {
        if (d.children) { d._children = d.children; d.children = null; }
        if (d._children) d._children.forEach(collapse);
    }
    dataRoot.children.forEach(collapse);
    update(dataRoot);
}

function handleSearch() {
    const val = document.getElementById("searchInput").value.trim().toLowerCase();
    if (!val) return;

    handleCollapseAll();

    const matches = leafNodes.filter(d => 
        String(d.data.name).trim().toLowerCase() === val
    );

    if (matches.length === 0) {
        const fuzzyMatches = leafNodes.filter(d =>
            String(d.data.name).trim().toLowerCase().includes(val)
        );
        if (fuzzyMatches.length > 0) {
            alert(`未找到精确匹配，已为你展开包含 "${val}" 的知识点`);
            fuzzyMatches.forEach(expandPath);
        } else {
            alert("未找到该年份对应的知识点，请检查输入是否正确（例如：23E, 10）");
            return;
        }
    } else {
        matches.forEach(expandPath);
    }

    function expandPath(node) {
        let curr = node;
        while (curr.parent) {
            if (curr.parent._children) {
                curr.parent.children = curr.parent._children;
                curr.parent._children = null;
            }
            curr = curr.parent;
        }
    }

    update(dataRoot);
}

document.getElementById("searchInput").addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleSearch();
});

window.addEventListener('resize', () => {
    svg.attr("width", window.innerWidth).attr("height", window.innerHeight);
});

function handleExpandConcepts() {
    dataRoot.descendants().forEach(d => {
        if (d.height > 1) {
            if (d._children) {
                d.children = d._children;
                d._children = null;
            }
        } else if (d.height === 1) {
            if (d.children) {
                d._children = d.children;
                d.children = null;
            }
        }
    });
    update(dataRoot);
}