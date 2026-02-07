import { NextRequest, NextResponse } from 'next/server'
import { generateFeynmanQuestion, evaluateFeynmanAnswer } from '@/lib/siliconflow'

// 统一处理 POST 请求（生成问题或评估）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { concept, round, conversation, userAnswer, evaluate, isInitial } = body

    if (!concept) {
      return NextResponse.json(
        { error: '请提供概念名称' },
        { status: 400 }
      )
    }

    // 如果需要评估
    if (evaluate) {
      if (!conversation) {
        return NextResponse.json(
          { error: '请提供对话记录' },
          { status: 400 }
        )
      }

      // 调用 SiliconFlow API 评估答案
      const evaluation = await evaluateFeynmanAnswer(concept, conversation)

      return NextResponse.json({
        success: true,
        evaluation
      })
    }

    // 生成问题
    if (!round) {
      return NextResponse.json(
        { error: '请提供轮次' },
        { status: 400 }
      )
    }

    // 调用 SiliconFlow API 生成问题，传递用户回答用于判断困惑状态
    const question = await generateFeynmanQuestion(
      concept, 
      round, 
      conversation || '',
      userAnswer,
      isInitial
    )

    return NextResponse.json({
      success: true,
      question,
      round
    })
  } catch (error: any) {
    console.error('Feynman API Error:', error)
    return NextResponse.json(
      { error: error.message || '处理失败' },
      { status: 500 }
    )
  }
}

// 保持向后兼容的 GET 方法
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const concept = searchParams.get('concept')
    const round = parseInt(searchParams.get('round') || '1')
    const context = searchParams.get('context') || ''

    if (!concept) {
      return NextResponse.json(
        { error: '请提供概念名称' },
        { status: 400 }
      )
    }

    // 调用 SiliconFlow API 生成问题
    const question = await generateFeynmanQuestion(concept, round, context)

    return NextResponse.json({
      success: true,
      data: { question, round }
    })
  } catch (error: any) {
    console.error('Feynman Question API Error:', error)
    return NextResponse.json(
      { error: error.message || '生成问题失败' },
      { status: 500 }
    )
  }
}

// 保持向后兼容的 PUT 方法
export async function PUT(request: NextRequest) {
  try {
    const { concept, conversation } = await request.json()

    if (!concept || !conversation) {
      return NextResponse.json(
        { error: '请提供概念名称和对话记录' },
        { status: 400 }
      )
    }

    // 调用 SiliconFlow API 评估答案
    const evaluation = await evaluateFeynmanAnswer(concept, conversation)

    return NextResponse.json({
      success: true,
      data: evaluation
    })
  } catch (error: any) {
    console.error('Feynman Evaluation API Error:', error)
    return NextResponse.json(
      { error: error.message || '评估失败' },
      { status: 500 }
    )
  }
}
