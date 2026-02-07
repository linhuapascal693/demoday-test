import { NextRequest, NextResponse } from 'next/server'
import { generateConceptDecode } from '@/lib/siliconflow'

export async function POST(request: NextRequest) {
  try {
    const { concept, profession } = await request.json()

    if (!concept) {
      return NextResponse.json(
        { error: '请提供概念名称' },
        { status: 400 }
      )
    }

    // 调用 SiliconFlow API 生成概念解码
    const decode = await generateConceptDecode(concept, profession || '初学者')

    return NextResponse.json({
      success: true,
      data: decode
    })
  } catch (error: any) {
    console.error('Concept Decode API Error:', error)
    return NextResponse.json(
      { error: error.message || '生成概念解码失败' },
      { status: 500 }
    )
  }
}
