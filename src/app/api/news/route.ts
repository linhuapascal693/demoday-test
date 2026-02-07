import { NextRequest, NextResponse } from 'next/server'
import { generateDailyNews } from '@/lib/siliconflow'

export async function POST(request: NextRequest) {
  try {
    const { topics } = await request.json()

    if (!topics || !Array.isArray(topics) || topics.length === 0) {
      return NextResponse.json(
        { error: '请提供至少一个主题' },
        { status: 400 }
      )
    }

    // 调用 SiliconFlow API 生成资讯
    const news = await generateDailyNews(topics)

    return NextResponse.json({
      success: true,
      data: news
    })
  } catch (error: any) {
    console.error('News API Error:', error)
    return NextResponse.json(
      { error: error.message || '生成资讯失败' },
      { status: 500 }
    )
  }
}
