'use client'

import { useState, useEffect, Suspense, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  NodeProps,
  BackgroundVariant,
  addEdge,
  Connection,
  MarkerType,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { Sparkles, AlertCircle, RefreshCw } from 'lucide-react'

// 父节点颜色映射（用于视觉分组）
const parentColorMap: { [key: string]: string } = {
  'root': '#e8a87c',
  'basics': '#85dcb8',
  'data-structures': '#c38d9e',
  'oop': '#7fb3d5',
  'shell-environment': '#f7b731',
  'command-syntax': '#5f27cd',
  'script-automation': '#10ac84',
  'tools-ecosystem': '#ee5a6f',
}

// Custom Node Component
const KnowledgeNode = ({ data, selected }: NodeProps) => {
  const statusColors = {
    not_started: 'border-slate-500/50 bg-slate-900/40 text-slate-300',
    learning: 'border-amber-500/60 bg-amber-950/30 text-amber-200',
    mastered: 'border-emerald-500/60 bg-emerald-950/30 text-emerald-200'
  }

  const statusIcons = {
    not_started: <div className="w-2 h-2 rounded-full bg-slate-500" />,
    learning: <div className="w-2 h-2 rounded-full bg-amber-500" />,
    mastered: <div className="w-2 h-2 rounded-full bg-emerald-500" />
  }

  // 获取父节点颜色（用于左边框标识）
  const parentColor = data.parentId ? (parentColorMap[data.parentId] || '#94a3b8') : '#e8a87c'
  const level = data.level || 0
  
  // 根据层级调整节点大小
  const nodeWidth = level === 0 ? 'w-40' : level === 1 ? 'w-36' : level === 2 ? 'w-32' : 'w-28'

  return (
    <div
      className={`${nodeWidth} px-3 py-2 rounded-xl border backdrop-blur-sm cursor-pointer transition-all duration-200 hover:scale-105 ${
        statusColors[data.status as keyof typeof statusColors]
      } ${selected ? 'ring-2 ring-[#e8a87c]/50 ring-offset-2 ring-offset-transparent shadow-lg shadow-[#e8a87c]/20' : 'shadow-lg shadow-black/20'}`}
      style={{ 
        borderLeftWidth: '4px', 
        borderLeftColor: parentColor,
        minWidth: level === 0 ? '160px' : level === 1 ? '140px' : level === 2 ? '120px' : '100px'
      }}
      onClick={data.onClick}
    >
      <div className="flex items-center gap-2">
        {statusIcons[data.status as keyof typeof statusIcons]}
        <span className="font-medium text-xs truncate">{data.label}</span>
      </div>
      {data.parentLabel && (
        <div className="text-[10px] text-white/40 mt-1 truncate">
          属于: {data.parentLabel}
        </div>
      )}
    </div>
  )
}

const nodeTypes = {
  knowledgeNode: KnowledgeNode
}

// 默认演示数据 - 层级结构（大间距避免重叠）
const defaultNodes: Node[] = [
  // Level 0: 根节点
  { id: 'root', type: 'knowledgeNode', position: { x: 0, y: 0 }, data: { label: 'Python 编程', status: 'learning', level: 0 } },
  
  // Level 1: 核心模块（间距 400）
  { id: 'basics', type: 'knowledgeNode', position: { x: -400, y: 180 }, data: { label: '基础语法', status: 'learning', level: 1 } },
  { id: 'data-structures', type: 'knowledgeNode', position: { x: 0, y: 180 }, data: { label: '数据结构', status: 'not_started', level: 1 } },
  { id: 'oop', type: 'knowledgeNode', position: { x: 400, y: 180 }, data: { label: '面向对象', status: 'not_started', level: 1 } },
  
  // Level 2: 基础语法下的知识点（间距 200，以-400为中心）
  { id: 'variables', type: 'knowledgeNode', position: { x: -500, y: 360 }, data: { label: '变量与类型', status: 'mastered', level: 2 } },
  { id: 'operators', type: 'knowledgeNode', position: { x: -400, y: 360 }, data: { label: '运算符', status: 'learning', level: 2 } },
  { id: 'control-flow', type: 'knowledgeNode', position: { x: -300, y: 360 }, data: { label: '控制流', status: 'not_started', level: 2 } },
  
  // Level 2: 数据结构下的知识点（间距 200，以0为中心）
  { id: 'list-dict', type: 'knowledgeNode', position: { x: -100, y: 360 }, data: { label: '列表与字典', status: 'not_started', level: 2 } },
  { id: 'tuple-set', type: 'knowledgeNode', position: { x: 0, y: 360 }, data: { label: '元组与集合', status: 'not_started', level: 2 } },
  { id: 'comprehension', type: 'knowledgeNode', position: { x: 100, y: 360 }, data: { label: '推导式', status: 'not_started', level: 2 } },
  
  // Level 2: 面向对象下的知识点（间距 200，以400为中心）
  { id: 'class-object', type: 'knowledgeNode', position: { x: 300, y: 360 }, data: { label: '类与对象', status: 'not_started', level: 2 } },
  { id: 'inheritance', type: 'knowledgeNode', position: { x: 400, y: 360 }, data: { label: '继承与多态', status: 'not_started', level: 2 } },
  { id: 'encapsulation', type: 'knowledgeNode', position: { x: 500, y: 360 }, data: { label: '封装', status: 'not_started', level: 2 } },
  
  // Level 3: 控制流下的细节（间距 200，以-300为中心）
  { id: 'functions', type: 'knowledgeNode', position: { x: -350, y: 540 }, data: { label: '函数定义', status: 'not_started', level: 3 } },
  { id: 'modules', type: 'knowledgeNode', position: { x: -250, y: 540 }, data: { label: '模块导入', status: 'not_started', level: 3 } },
  
  // Level 3: 列表与字典下的细节（间距 200，以-100为中心）
  { id: 'file-io', type: 'knowledgeNode', position: { x: -150, y: 540 }, data: { label: '文件操作', status: 'not_started', level: 3 } },
  { id: 'exception', type: 'knowledgeNode', position: { x: -50, y: 540 }, data: { label: '异常处理', status: 'not_started', level: 3 } }
]

const defaultEdges: Edge[] = [
  // Level 0 -> Level 1 (根节点到核心模块)
  { id: 'e1', source: 'root', target: 'basics', animated: true, style: { stroke: '#e8a87c', strokeWidth: 3 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#e8a87c' } },
  { id: 'e2', source: 'root', target: 'data-structures', animated: true, style: { stroke: '#e8a87c', strokeWidth: 3 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#e8a87c' } },
  { id: 'e3', source: 'root', target: 'oop', animated: true, style: { stroke: '#e8a87c', strokeWidth: 3 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#e8a87c' } },
  
  // Level 1 -> Level 2 (基础语法到知识点)
  { id: 'e4', source: 'basics', target: 'variables', style: { stroke: '#85dcb8', strokeWidth: 2.5 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#85dcb8' } },
  { id: 'e5', source: 'basics', target: 'operators', style: { stroke: '#85dcb8', strokeWidth: 2.5 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#85dcb8' } },
  { id: 'e6', source: 'basics', target: 'control-flow', style: { stroke: '#85dcb8', strokeWidth: 2.5 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#85dcb8' } },
  
  // Level 1 -> Level 2 (数据结构到知识点)
  { id: 'e7', source: 'data-structures', target: 'list-dict', style: { stroke: '#85dcb8', strokeWidth: 2.5 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#85dcb8' } },
  { id: 'e8', source: 'data-structures', target: 'tuple-set', style: { stroke: '#85dcb8', strokeWidth: 2.5 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#85dcb8' } },
  { id: 'e9', source: 'data-structures', target: 'comprehension', style: { stroke: '#85dcb8', strokeWidth: 2.5 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#85dcb8' } },
  
  // Level 1 -> Level 2 (面向对象到知识点)
  { id: 'e10', source: 'oop', target: 'class-object', style: { stroke: '#85dcb8', strokeWidth: 2.5 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#85dcb8' } },
  { id: 'e11', source: 'oop', target: 'inheritance', style: { stroke: '#85dcb8', strokeWidth: 2.5 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#85dcb8' } },
  { id: 'e12', source: 'oop', target: 'encapsulation', style: { stroke: '#85dcb8', strokeWidth: 2.5 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#85dcb8' } },
  
  // Level 2 -> Level 3 (控制流到细节)
  { id: 'e13', source: 'control-flow', target: 'functions', style: { stroke: '#94a3b8', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' } },
  { id: 'e14', source: 'control-flow', target: 'modules', style: { stroke: '#94a3b8', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' } },
  
  // Level 2 -> Level 3 (其他到细节)
  { id: 'e15', source: 'list-dict', target: 'file-io', style: { stroke: '#94a3b8', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' } },
  { id: 'e16', source: 'class-object', target: 'exception', style: { stroke: '#94a3b8', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' } }
]

function KnowledgeMapContent() {
  const searchParams = useSearchParams()
  const topic = searchParams.get('topic') || 'Python 编程'

  const [nodes, setNodes, onNodesChange] = useNodesState(defaultNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(defaultEdges)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  // 调用 AI API 生成知识图谱
  const generateMapWithAI = async () => {
    setIsGenerating(true)
    setError('')

    try {
      const response = await fetch('/api/knowledge-map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '生成失败')
      }

      // 解析 AI 返回的数据
      const { nodes: aiNodes, edges: aiEdges } = result.data

      if (aiNodes && aiNodes.length > 0) {
        // 构建树形结构
        const nodeMap = new Map()
        aiNodes.forEach((node: any) => {
          nodeMap.set(node.id, { ...node, children: [] })
        })
        
        // 建立父子关系
        let rootNode = null
        aiNodes.forEach((node: any) => {
          if (node.parentId && nodeMap.has(node.parentId)) {
            nodeMap.get(node.parentId).children.push(nodeMap.get(node.id))
          } else if (node.level === 0) {
            rootNode = nodeMap.get(node.id)
          }
        })

        // 树形布局参数
        const levelHeight = 160  // 每层高度（减小垂直间距）
        const nodeWidth = 120     // 节点实际宽度
        const siblingGap = 10     // 同一父节点的子节点间距（紧凑）
        const groupGap = 80       // 不同父节点的子节点组间距（分开）
        
        // 按层级分组节点
        const nodesByLevel = new Map<number, any[]>()
        const nodesByParent = new Map<string, any[]>()
        
        aiNodes.forEach((node: any) => {
          const level = node.level || 0
          if (!nodesByLevel.has(level)) {
            nodesByLevel.set(level, [])
          }
          nodesByLevel.get(level)!.push(node)
          
          if (node.parentId) {
            if (!nodesByParent.has(node.parentId)) {
              nodesByParent.set(node.parentId, [])
            }
            nodesByParent.get(node.parentId)!.push(node)
          }
        })
        
        // 计算每层的布局
        const levelPositions = new Map<string, { x: number; y: number }>()
        
        // 设置根节点位置
        if (rootNode) {
          levelPositions.set(rootNode.id, { x: 0, y: 0 })
        }
        
        // 按层级从上到下计算位置
        const maxLevel = Math.max(...Array.from(nodesByLevel.keys()))
        
        for (let level = 1; level <= maxLevel; level++) {
          const levelNodes = nodesByLevel.get(level) || []
          const y = level * levelHeight
          
          // 按父节点分组
          const groups = new Map<string, any[]>()
          levelNodes.forEach((node: any) => {
            const parentId = node.parentId || 'root'
            if (!groups.has(parentId)) {
              groups.set(parentId, [])
            }
            groups.get(parentId)!.push(node)
          })
          
          // 计算每个组的位置
          let currentX = 0
          const groupEntries = Array.from(groups.entries())
          
          // 先计算总宽度，以便居中
          let totalWidth = 0
          groupEntries.forEach(([parentId, children], index) => {
            const groupWidth = children.length * nodeWidth + (children.length - 1) * siblingGap
            totalWidth += groupWidth
            if (index < groupEntries.length - 1) {
              totalWidth += groupGap
            }
          })
          
          currentX = -totalWidth / 2
          
          // 放置每个组的节点
          groupEntries.forEach(([parentId, children], groupIndex) => {
            const parentPos = levelPositions.get(parentId)
            const groupWidth = children.length * nodeWidth + (children.length - 1) * siblingGap
            
            // 让组尽量靠近父节点
            let groupStartX = currentX
            if (parentPos) {
              // 如果父节点在这个组的范围内，微调位置让父节点居中
              const parentRelativeX = parentPos.x - groupStartX
              const groupCenterOffset = groupWidth / 2 - parentRelativeX
              if (Math.abs(groupCenterOffset) < groupWidth / 2) {
                groupStartX += groupCenterOffset * 0.3 // 轻微调整
              }
            }
            
            children.forEach((child: any, childIndex: number) => {
              const x = groupStartX + childIndex * (nodeWidth + siblingGap) + nodeWidth / 2
              levelPositions.set(child.id, { x, y })
            })
            
            currentX += groupWidth
            if (groupIndex < groupEntries.length - 1) {
              currentX += groupGap
            }
          })
        }
        
        // 将计算好的位置应用到节点
        aiNodes.forEach((node: any) => {
          const pos = levelPositions.get(node.id)
          if (pos) {
            node.position = pos
          }
        })

        // 转换 AI 返回的节点格式
        const formattedNodes: Node[] = aiNodes.map((node: any, index: number) => {
          const level = node.level || 0
          const parentId = node.parentId
          const position = levelPositions.get(node.id) || { x: 0, y: level * levelHeight }
          
          // 获取父节点标签
          const parentNode = parentId ? nodeMap.get(parentId) : null
          const parentLabel = parentNode?.label
          
          return {
            id: node.id || `node-${index}`,
            type: 'knowledgeNode',
            position,
            data: {
              label: node.label,
              status: node.status || 'not_started',
              description: node.description,
              level,
              parentId,
              parentLabel,
              onClick: () => setSelectedNode({
                id: node.id,
                type: 'knowledgeNode',
                position,
                data: {
                  label: node.label,
                  status: node.status || 'not_started',
                  description: node.description,
                  level,
                  parentId,
                  parentLabel
                }
              } as Node)
            }
          }
        })

        // 转换 AI 返回的边格式
        const formattedEdges: Edge[] = (aiEdges || []).map((edge: any, index: number) => ({
          id: edge.id || `edge-${index}`,
          source: edge.source,
          target: edge.target,
          animated: true,
          style: { stroke: '#e8a87c', strokeWidth: 2.5 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#e8a87c' }
        }))

        setNodes(formattedNodes)
        setEdges(formattedEdges)
      }
    } catch (err: any) {
      console.error('AI Generation Error:', err)
      setError(err.message || 'AI 生成失败，显示默认知识图谱')
      // 使用默认数据
      setNodes(defaultNodes)
      setEdges(defaultEdges)
    } finally {
      setIsGenerating(false)
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // 初始化时尝试调用 AI 生成
    generateMapWithAI()
  }, [topic])

  useEffect(() => {
    // 更新节点点击事件
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          onClick: () => setSelectedNode(node),
        },
      }))
    )
  }, [setNodes])

  const handleStartLearning = () => {
    if (selectedNode) {
      window.location.href = `/concept/${selectedNode.id}?name=${encodeURIComponent(selectedNode.data.label)}&topic=${encodeURIComponent(topic)}`
    }
  }

  if (isLoading || isGenerating) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#e8a87c] to-[#85dcb8] opacity-20 animate-ping" />
            <div className="absolute inset-2 rounded-full bg-gradient-to-r from-[#e8a87c] to-[#85dcb8] opacity-40" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-[#e8a87c] animate-pulse" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-white/90 mb-2">
            正在生成知识全景图
          </h2>
          <p className="text-sm text-white/50">
            AI 正在分析「{topic}」的知识结构...
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-64px)] relative">
      {/* Header */}
      <div className="absolute top-4 left-4 z-10">
        <div className="glass-card px-4 py-2.5 rounded-xl">
          <h1 className="text-base font-medium text-white/90">{topic}</h1>
          <p className="text-xs text-white/40">点击节点开始学习</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
          <div className="glass-card px-4 py-2.5 rounded-xl flex items-center gap-2 bg-red-500/10 border-red-500/30">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span className="text-sm text-red-400">{error}</span>
            <button
              onClick={generateMapWithAI}
              className="ml-2 p-1 hover:bg-white/10 rounded transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-red-400" />
            </button>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute top-4 right-4 z-10">
        <div className="glass-card px-4 py-2.5 rounded-xl">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-slate-500" />
              <span className="text-white/60">未学习</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-white/60">学习中</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-white/60">已掌握</span>
            </div>
          </div>
        </div>
      </div>

      {/* React Flow */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ 
          padding: 0.15,
          minZoom: 0.4,
          maxZoom: 1.2
        }}
        minZoom={0.3}
        maxZoom={2}
        className="bg-transparent"
      >
        <Background 
          variant={BackgroundVariant.Dots}
          color="rgba(255,255,255,0.05)" 
          gap={30} 
          size={1}
        />
        <Controls 
          className="!bg-slate-900/80 !border-white/10 !rounded-xl !shadow-xl"
          showInteractive={false}
        />
      </ReactFlow>

      {/* Selected Node Panel */}
      {selectedNode && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="absolute right-4 top-20 bottom-4 w-72 glass-card rounded-2xl overflow-hidden"
        >
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">{selectedNode.data.label}</h2>
              <button
                onClick={() => setSelectedNode(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-xs text-white/40 uppercase tracking-wider">状态</span>
                <div className="flex items-center gap-2 mt-1.5">
                  {selectedNode.data.status === 'mastered' && (
                    <>
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span className="text-emerald-400 text-sm">已掌握</span>
                    </>
                  )}
                  {selectedNode.data.status === 'learning' && (
                    <>
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <span className="text-amber-400 text-sm">学习中</span>
                    </>
                  )}
                  {selectedNode.data.status === 'not_started' && (
                    <>
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                      <span className="text-slate-400 text-sm">未学习</span>
                    </>
                  )}
                </div>
              </div>

              {selectedNode.data.description && (
                <div>
                  <span className="text-xs text-white/40 uppercase tracking-wider">描述</span>
                  <p className="text-white/70 text-sm mt-1.5 leading-relaxed">
                    {selectedNode.data.description}
                  </p>
                </div>
              )}

              <div className="pt-2 space-y-2">
                <button
                  onClick={handleStartLearning}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-[#e8a87c] to-[#c38d9e] text-slate-900 font-medium rounded-xl hover:opacity-90 transition-opacity text-sm"
                >
                  开始学习
                </button>
                {selectedNode.data.status !== 'mastered' && (
                  <button className="w-full py-2.5 px-4 bg-white/5 text-white/70 font-medium rounded-xl hover:bg-white/10 transition-colors text-sm border border-white/10">
                    标记为已掌握
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default function KnowledgeMapPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/10 border-t-[#e8a87c] rounded-full animate-spin" />
      </div>
    }>
      <KnowledgeMapContent />
    </Suspense>
  )
}
