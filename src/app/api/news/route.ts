import { NextRequest, NextResponse } from 'next/server'
import { generateNews } from '@/lib/siliconflow'
import { supabase } from '@/lib/supabase'

// 资讯主题分类
const NEWS_TOPICS = [
  'AI 人工智能',
  '编程开发',
  '数据科学',
  '产品设计',
  '职场技能',
  '学习方法',
  '行业趋势',
  '工具推荐'
]

// 根据职业背景推荐相关主题
const getTopicsByProfession = (profession: string): string[] => {
  const professionTopics: { [key: string]: string[] } = {
    '英语老师': ['AI 人工智能', '学习方法', '职场技能', '工具推荐'],
    '产品经理': ['产品设计', 'AI 人工智能', '行业趋势', '职场技能'],
    '数据分析师': ['数据科学', 'AI 人工智能', '编程开发', '工具推荐'],
    '程序员': ['编程开发', 'AI 人工智能', '工具推荐', '行业趋势'],
    '设计师': ['产品设计', 'AI 人工智能', '工具推荐', '行业趋势'],
    '运营': ['数据科学', 'AI 人工智能', '职场技能', '工具推荐'],
    '学生': ['学习方法', '编程开发', 'AI 人工智能', '职场技能'],
    '教师': ['AI 人工智能', '学习方法', '工具推荐', '职场技能'],
    '销售': ['职场技能', 'AI 人工智能', '工具推荐', '行业趋势'],
    '管理者': ['行业趋势', '职场技能', 'AI 人工智能', '管理方法']
  }
  
  return professionTopics[profession] || ['AI 人工智能', '学习方法', '职场技能', '工具推荐']
}

// 生成单条资讯
const generateSingleNews = async (
  topic: string,
  profession: string,
  index: number
): Promise<{
  id: string
  title: string
  summary: string
  reason: string
  key_takeaway: string
  source: string
  topic: string
}> => {
  const systemPrompt = `你是一个专业的科技资讯编辑。请为${profession}生成一条关于"${topic}"的精选资讯。

要求：
1. 标题：吸引人且信息明确（15-25字）
2. 摘要：简明扼要地说明核心内容（80-120字）
3. 推荐理由：从${profession}的角度说明为什么这条资讯有价值（50-80字）
4. Key Takeaway：一句话总结最重要的信息（20-30字）
5. 来源：模拟一个真实的科技媒体名称

返回JSON格式：
{
  "title": "标题",
  "summary": "摘要",
  "reason": "推荐理由",
  "key_takeaway": "核心要点",
  "source": "来源媒体"
}`

  const userPrompt = `请生成第${index + 1}条关于"${topic}"的资讯，针对${profession}职业背景。`

  try {
    const content = await generateNews(systemPrompt, userPrompt)
    
    // 解析 JSON
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || 
                      content.match(/\{[\s\S]*\}/)
    const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content
    const data = JSON.parse(jsonStr.trim())
    
    return {
      id: `news-${Date.now()}-${index}`,
      title: data.title || `${topic}最新动态`,
      summary: data.summary || '暂无摘要',
      reason: data.reason || `对${profession}有参考价值`,
      key_takeaway: data.key_takeaway || '关注该领域发展',
      source: data.source || '科技资讯精选',
      topic: topic
    }
  } catch (error) {
    console.error('Error generating news:', error)
    // 返回默认内容
    return {
      id: `news-${Date.now()}-${index}`,
      title: `${topic}：${profession}需要关注的新趋势`,
      summary: `本文介绍了${topic}领域的最新发展，以及${profession}如何从中受益。`,
      reason: `作为${profession}，了解${topic}有助于提升工作效率和竞争力。`,
      key_takeaway: `${topic}正在改变${profession}的工作方式。`,
      source: 'AI 资讯生成',
      topic: topic
    }
  }
}

// GET - 获取资讯列表
export async function GET(request: NextRequest) {
  try {
    // 获取用户认证信息
    const authHeader = request.headers.get('authorization')
    let userId = null
    let profession = '初学者'
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const { data: { user }, error } = await supabase.auth.getUser(token)
      
      if (!error && user) {
        userId = user.id
        
        // 获取用户职业背景
        const { data: profile } = await supabase
          .from('profiles')
          .select('profession')
          .eq('id', user.id)
          .single()
        
        if (profile?.profession) {
          profession = profile.profession
        }
      }
    }
    
    // 检查今天是否已经生成过资讯
    const today = new Date().toISOString().split('T')[0]
    
    if (userId) {
      const { data: existingNews } = await supabase
        .from('news')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', today)
        .order('created_at', { ascending: false })
        .limit(5)
      
      if (existingNews && existingNews.length >= 3) {
        // 返回已生成的资讯
        return NextResponse.json({
          success: true,
          data: existingNews.map(news => ({
            id: news.id,
            title: news.title,
            summary: news.summary,
            reason: news.reason,
            key_takeaway: news.key_takeaway,
            source: news.source,
            published_at: news.created_at,
            topic: news.topic,
            is_favorite: news.is_favorite || false,
            is_read: news.is_read || false
          })),
          generated_at: today,
          is_cached: true
        })
      }
    }
    
    // 生成新的资讯
    const topics = getTopicsByProfession(profession)
    const selectedTopics = topics.slice(0, 4) // 选择4个主题
    
    const newsPromises = selectedTopics.map((topic, index) => 
      generateSingleNews(topic, profession, index)
    )
    
    const generatedNews = await Promise.all(newsPromises)
    
    // 保存到数据库
    if (userId) {
      const newsToInsert = generatedNews.map(news => ({
        user_id: userId,
        title: news.title,
        summary: news.summary,
        reason: news.reason,
        key_takeaway: news.key_takeaway,
        source: news.source,
        topic: news.topic,
        is_favorite: false,
        is_read: false
      }))
      
      await supabase.from('news').insert(newsToInsert)
    }
    
    return NextResponse.json({
      success: true,
      data: generatedNews.map(news => ({
        ...news,
        published_at: new Date().toISOString(),
        is_favorite: false,
        is_read: false
      })),
      generated_at: today,
      is_cached: false,
      profession: profession
    })
    
  } catch (error: any) {
    console.error('News API Error:', error)
    return NextResponse.json(
      { error: error.message || '生成资讯失败' },
      { status: 500 }
    )
  }
}

// POST - 标记资讯为已读或收藏
export async function POST(request: NextRequest) {
  try {
    const { newsId, action, value } = await request.json()
    
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '未授权' },
        { status: 401 }
      )
    }
    
    const token = authHeader.substring(7)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: '未授权' },
        { status: 401 }
      )
    }
    
    if (action === 'mark_read') {
      const { error } = await supabase
        .from('news')
        .update({ is_read: value })
        .eq('id', newsId)
        .eq('user_id', user.id)
      
      if (error) throw error
      
      return NextResponse.json({ success: true, action: 'mark_read' })
    }
    
    if (action === 'toggle_favorite') {
      const { error } = await supabase
        .from('news')
        .update({ is_favorite: value })
        .eq('id', newsId)
        .eq('user_id', user.id)
      
      if (error) throw error
      
      return NextResponse.json({ success: true, action: 'toggle_favorite' })
    }
    
    return NextResponse.json(
      { error: '未知操作' },
      { status: 400 }
    )
    
  } catch (error: any) {
    console.error('News API Error:', error)
    return NextResponse.json(
      { error: error.message || '操作失败' },
      { status: 500 }
    )
  }
}
