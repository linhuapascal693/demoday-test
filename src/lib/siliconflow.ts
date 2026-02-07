import axios from 'axios'

// yunwu.ai API 配置
const API_KEY = process.env.YUNWU_API_KEY || 'sk-wyUoO0rFWLmIgy46u6TkYSG4rwF6qw5EbZ9VddbFEky2SHbt'
const API_URL = process.env.YUNWU_API_URL || 'https://yunwu.ai/v1'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`
  }
})

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export async function chatCompletion(
  messages: ChatMessage[],
  model: string = 'gpt-4o-mini',
  temperature: number = 0.7
) {
  try {
    const response = await api.post('/chat/completions', {
      model,
      messages,
      temperature,
      stream: false
    })
    return response.data.choices[0].message.content
  } catch (error: any) {
    console.error('Yunwu API Error:', error.response?.data || error.message)
    throw error
  }
}

export async function generateKnowledgeMap(topic: string) {
  const systemPrompt = `你是一个知识图谱生成专家。请为给定的学习主题生成一个结构化的层级知识图谱。

层级结构要求（重要：控制节点数量以避免重叠）：
1. 第0层（根节点）：主题本身，1个节点
2. 第1层（核心模块）：最多4个核心概念/模块，作为根节点的直接子节点
3. 第2层（具体知识点）：每个核心模块下包含2-3个具体知识点，作为模块的子节点
4. 第3层（细节概念）：某些知识点下可再细分1-2个细节概念

注意：严格控制每层节点数量，子节点越多需要的水平空间越大。建议总共不超过20个节点。

节点格式：
- id: 唯一标识（如 "root", "module1", "concept1-1"）
- label: 显示名称
- description: 简短描述
- level: 层级（0, 1, 2, 3）
- parentId: 父节点ID（根节点可为空）

边格式：
- source: 源节点ID（父节点）
- target: 目标节点ID（子节点）
- 必须体现层级关系：父节点 -> 子节点

布局要求（重要：必须严格遵守以避免节点重叠）：
- 返回的节点应包含 position 字段，用于可视化布局
- level 0: y=0, x=0（根节点居中）
- level 1: y=200, 子节点以父节点为中心，水平间距至少 300px
- level 2: y=400, 子节点以父节点为中心，水平间距至少 250px
- level 3: y=600, 子节点以父节点为中心，水平间距至少 200px
- 示例：如果父节点在 x=0，有3个子节点，则子节点应在 x=-250, x=0, x=250
- 同一父节点下的子节点数量不要超过4个，否则间距不够

请确保返回的是有效的JSON格式，包含 nodes 数组和 edges 数组。`

  const userPrompt = `请为"${topic}"生成知识图谱，返回JSON格式。`

  const content = await chatCompletion([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ])

  try {
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || 
                      content.match(/\{[\s\S]*\}/)
    const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content
    return JSON.parse(jsonStr.trim())
  } catch (error) {
    console.error('Failed to parse knowledge map JSON:', error)
    throw new Error('知识图谱生成失败')
  }
}

export async function generateConceptDecode(
  concept: string,
  profession: string
) {
  const systemPrompt = `你是一个擅长用通俗比喻解释复杂概念的专家。请使用5W1H方法解释给定的概念，并提供生动、贴切的类比。

重要：用户的职业背景是"${profession}"。

要求：
1. What: 是什么 - 简洁定义（2-3句话），要结合"${profession}"的工作场景来解释
2. Why: 为什么 - 重要性和用途（2-3句话），说明对"${profession}"有什么实际帮助
3. How: 怎么用 - 使用方法（2-3句话），举例说明"${profession}"如何在工作中应用
4. When: 何时用 - 应用场景（2-3句话），描述"${profession}"在什么情况下会用到
5. Where: 在哪用 - 使用环境（2-3句话），说明"${profession}"在哪些工具/平台中使用
6. Who: 谁在用 - 目标用户（2-3句话），重点说明"${profession}"为什么需要学习

7. Analogies: 必须提供2个类比，格式为数组，每个元素包含content和profession字段：

   数组第1个元素（通用类比）：
   - content: 使用日常生活场景的类比，简单易懂
   - profession: "通用"
   - 示例场景：做饭、整理房间、购物、交通、收纳、餐厅、超市等
   - 格式要求：用"就像...一样"或"可以想象成..."的句式
   - 示例："就像整理衣柜，把衣服按季节分类摆放，找的时候一目了然"
   - 要求：大白话，避免术语，一听就懂

   数组第2个元素（职业相关类比）：
   - content: 结合"${profession}"真实工作场景的类比
   - profession: "${profession}"
   - 要求：必须贴合"${profession}"的实际工作内容
   - 使用"${profession}"熟悉的业务流程、工具或场景
   - 让"${profession}"从业者一看就觉得"这就是我工作中遇到的情况"
   - 格式：自然口语化，像同事聊天
   - 示例（电商运营）："就像你管理爆款商品，需要实时监控库存，快断货时自动提醒补货"
   - 避免：生硬的套用，如"如同...管理商品库存"这种句式

   重要：analogies必须是包含2个元素的数组，不能省略任何一个！

8. Classics: 推荐2-3本相关的经典书籍，每本书包含以下字段：
   - title: 书名
   - author: 作者
   - description: 书籍简介（1-2句话）
   - reason: 推荐理由（说明这本书对理解"${concept}"这个知识点有什么帮助，重点讲与知识点的关联，而不是用户的职业背景）
   - difficulty: 难度等级（入门级/进阶级/专家级）

重要提示：
- 类比要生动、具体、有画面感
- 避免抽象的描述，多用具体场景
- 语言要像跟朋友聊天一样自然
- 不要出现"如同...管理商品库存"这种生硬的句式

返回JSON格式。`

  const userPrompt = `请解释"${concept}"概念。用户是"${profession}"职业背景。

请特别注意类比部分：
1. 通用类比要用日常生活场景，简单易懂
2. "${profession}"相关的类比要贴合这个职业的真实工作场景，让从业者一看就懂

返回JSON格式。`

  const content = await chatCompletion([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ])

  try {
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || 
                      content.match(/\{[\s\S]*\}/)
    const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content
    return JSON.parse(jsonStr.trim())
  } catch (error) {
    console.error('Failed to parse concept decode JSON:', error)
    throw new Error('概念解码生成失败')
  }
}

export async function generateFeynmanQuestion(
  concept: string,
  round: number,
  previousContext: string,
  userAnswer?: string,
  isInitial?: boolean
) {
  // 检测用户是否表示不理解
  const isConfused = userAnswer && (
    userAnswer.includes('不清楚') || 
    userAnswer.includes('不懂') || 
    userAnswer.includes('不明白') ||
    userAnswer.includes('不知道') ||
    userAnswer.includes('不会') ||
    userAnswer.length < 5
  )

  // 如果是初始问题（从概念页面点击进来），生成特定的开场白
  if (isInitial && round === 1 && !previousContext) {
    return `你好！我是刚学编程的小白。听说今天要学习「${concept}」这个概念，但我完全不知道这是什么意思...

老师，你能用简单的话给我讲讲什么是${concept}吗？最好举个例子让我理解一下～`
  }

  const systemPrompt = `你是一个费曼学习法的AI助手。你扮演一个初学者，通过提问来帮助用户验证他们对概念的理解。

重要规则：
1. 如果用户表示不理解（如说"不清楚"、"不懂"、回答太短），你要：
   - 不要继续问更难的问题
   - 换一种更简单的方式重新提问
   - 或者给出一个简单的提示/例子引导用户
   
2. 以初学者的口吻提问，语气友好、好奇
3. 根据轮次递进：第一轮基础理解，第二轮深入细节，第三轮应用验证
4. 问题要开放，不能是简单的是/否问题
5. 如果用户连续不理解，降低问题难度

当前状态：${isConfused ? '用户表示不理解，需要简化问题或给出提示' : '正常对话流程'}

请生成合适的回应。如果是简化版问题，请明确标注【简化版】`

  let userPrompt = `概念：${concept}\n`
  userPrompt += `轮次：${round}/3\n`
  
  if (previousContext) {
    userPrompt += `之前的对话：\n${previousContext}\n`
  }
  
  if (userAnswer) {
    userPrompt += `用户刚才回答："${userAnswer}"\n`
  }
  
  if (isConfused) {
    userPrompt += '\n用户表示不理解，请用更简单的方式提问，或者给出一个简单的例子引导他们。'
  } else {
    userPrompt += `\n请生成第${round}轮的提问。`
  }
  
  userPrompt += '\n\n请生成回应：'

  return await chatCompletion([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ])
}

export async function evaluateFeynmanAnswer(
  concept: string,
  conversation: string
) {
  const systemPrompt = `你是一个学习评估专家。请根据用户的费曼演练对话，评估他们对概念的理解程度。

评估维度（1-5分）：
1. 清晰度：表达是否清晰易懂
2. 准确性：概念理解是否正确
3. 完整性：是否涵盖关键要点

特殊检测：
- 如果用户多次表示"不清楚"、"不懂"、回答过短（少于5个字），请在evaluation中添加"needsReview": true
- 如果用户理解明显有误，请明确指出错误并给出正确解释

输出要求：
- 综合评分（平均分）
- 各维度得分和评价
- 优点列表
- 建议列表
- 薄弱点列表
- needsReview: 是否需要重新学习（布尔值）
- reviewSuggestion: 如果需要重新学习，给出具体建议

返回JSON格式。`

  const userPrompt = `概念：${concept}

对话记录：
${conversation}

请评估用户的理解程度，返回JSON格式。`

  const content = await chatCompletion([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ])

  try {
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || 
                      content.match(/\{[\s\S]*\}/)
    const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content
    return JSON.parse(jsonStr.trim())
  } catch (error) {
    console.error('Failed to parse evaluation JSON:', error)
    throw new Error('评估生成失败')
  }
}

export async function generateDailyNews(topics: string[]) {
  const systemPrompt = `你是一个教育内容策展人。请为给定的学习主题生成精选的学习资讯。

要求：
1. 生成3-5条资讯
2. 每条资讯包含：标题、摘要、推荐理由、Key Takeaway、来源
3. 内容要有价值，帮助学习者建立知识连接
4. 模拟真实的资讯来源

返回JSON数组格式。`

  const userPrompt = `请为以下主题生成学习资讯：${topics.join(', ')}

返回JSON格式，包含news数组。`

  const content = await chatCompletion([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ])

  try {
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || 
                      content.match(/\{[\s\S]*\}/)
    const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content
    return JSON.parse(jsonStr.trim())
  } catch (error) {
    console.error('Failed to parse news JSON:', error)
    throw new Error('资讯生成失败')
  }
}

// 通用的资讯生成函数
export async function generateNews(systemPrompt: string, userPrompt: string): Promise<string> {
  return await chatCompletion([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ])
}
