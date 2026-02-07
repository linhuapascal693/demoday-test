import { NextRequest, NextResponse } from 'next/server'
import { chatCompletion } from '@/lib/siliconflow'

// 生成类比详细解释
export async function POST(request: NextRequest) {
  try {
    const { concept, analogyContent, profession, isPersonalized } = await request.json()

    if (!concept || !analogyContent) {
      return NextResponse.json(
        { error: '请提供概念名称和类比内容' },
        { status: 400 }
      )
    }

    let prompt: string

    if (isPersonalized && profession && profession !== '初学者') {
      // 基于用户职业背景的个性化解释
      prompt = `作为一位资深教育专家，请为「${profession}」背景的学员解释「${concept}」这个概念。

类比切入点：${analogyContent}

请基于「${profession}」的实际工作场景，用学员熟悉的工作经验来讲解这个概念：

1. **工作场景映射**：
   - 在「${profession}」的日常工作中，哪些场景会用到「${concept}」
   - 这个概念解决了工作中的什么具体问题
   - 不用这个概念会有哪些困扰

2. **用工作语言解释**：
   - 用「${profession}」熟悉的术语和流程来解释
   - 结合具体的工作案例或业务场景
   - 让学员感觉"这就是我工作中遇到的情况"

3. **实际工作应用**：
   - 在「${profession}」的岗位上，如何具体运用这个概念
   - 给出 2-3 个真实的工作场景例子
   - 说明掌握后能提升什么工作能力

4. **与现有知识的连接**：
   - 这个概念和「${profession}」已掌握的技能有什么关联
   - 如何基于现有经验快速理解这个概念

要求：
- 完全基于「${profession}」的工作视角来讲解
- 使用「${profession}」熟悉的业务场景和术语
- 让学员觉得"这说的就是我每天做的事"
- 语言要接地气，像同事之间的交流
- 总字数控制在 400-600 字
- 使用 Markdown 格式，适当使用加粗、列表等
- 开头用一句与「${profession}」工作相关的话吸引注意`
    } else {
      // 通用生活化解释（初学者或通用背景）
      prompt = `作为一位资深教育专家，请用通俗易懂的生活场景来解释「${concept}」这个概念。

类比切入点：${analogyContent}

请用日常生活中的场景来讲解，让完全不懂技术的人也能一听就懂：

1. **生活场景引入**：
   - 找一个大家日常生活中都会遇到的场景作为切入点
   - 比如：做饭、整理房间、购物、交通出行、收纳整理等
   - 让听众感觉"这就是我每天做的事"

2. **通俗解释核心概念**：
   - 用大白话解释，避免任何专业术语
   - 如果必须用术语，立即用生活化的比喻解释
   - 多用"就像...一样"、"你可以理解为..."这样的句式

3. **生活中的具体例子**：
   - 给出 2-3 个生活中真实的例子
   - 例子要具体、形象、有画面感
   - 让读者能立刻在脑海中浮现场景

4. **为什么这样理解**：
   - 解释这个生活场景和概念的对应关系
   - 说明这种理解方式的好处
   - 澄清容易误解的地方

要求：
- 完全用生活化的语言，像跟朋友聊天一样
- 多用具体的生活场景和例子
- 让完全外行的人也能秒懂
- 语言要生动有趣，避免说教
- 总字数控制在 400-600 字
- 使用 Markdown 格式，适当使用加粗、列表等
- 开头用一句生活化的场景描述吸引读者，比如"想象一下你正在..."`
    }

    // 调用 AI 生成内容
    const content = await chatCompletion([
      { 
        role: 'system', 
        content: isPersonalized && profession && profession !== '初学者'
          ? `你是一位擅长将技术概念与具体职业场景结合的教育专家。你善于用学员熟悉的工作经验来讲解新知识，让学员感觉"这就是在说我的工作"。`
          : `你是一位擅长用生活化语言解释复杂概念的教育专家。你善于用日常生活中的例子让抽象概念变得具体可感，让完全外行的人也能一听就懂。`
      },
      { role: 'user', content: prompt }
    ])

    return NextResponse.json({
      success: true,
      content,
      concept,
      profession: isPersonalized ? profession : '通用'
    })

  } catch (error: any) {
    console.error('Analogy API Error:', error)
    return NextResponse.json(
      { error: error.message || '生成解释失败' },
      { status: 500 }
    )
  }
}
