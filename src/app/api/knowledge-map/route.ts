import { NextRequest, NextResponse } from 'next/server'
import { generateKnowledgeMap } from '@/lib/siliconflow'

export async function POST(request: NextRequest) {
  try {
    const { topic } = await request.json()

    if (!topic) {
      return NextResponse.json(
        { error: '请提供学习主题' },
        { status: 400 }
      )
    }

    // 调用 SiliconFlow API 生成知识图谱
    const knowledgeMap = await generateKnowledgeMap(topic)

    return NextResponse.json({
      success: true,
      data: knowledgeMap
    })
  } catch (error: any) {
    console.error('Knowledge Map API Error:', error)
    return NextResponse.json(
      { error: error.message || '生成知识图谱失败' },
      { status: 500 }
    )
  }
}
