'use client'

import { useState, useEffect, Suspense } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  BookOpen, 
  Lightbulb, 
  Library, 
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Target,
  Clock,
  MapPin,
  Users,
  Loader2,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  Sparkles,
  X
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import FiveWOneHCard from './FiveWOneHCard'

interface ClassicBook {
  title: string
  author: string
  description: string
  reason: string
  difficulty: '入门级' | '进阶级' | '专家级'
}

interface ConceptData {
  what: string
  why: string
  how: string
  when: string
  where: string
  who: string
  analogies: { id: string; content: string; profession: string; is_selected: boolean }[]
  classics: ClassicBook[]
}

function ConceptContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuth()
  
  const conceptId = params.id as string
  const conceptName = searchParams.get('name') || '概念'
  const topic = searchParams.get('topic') || ''

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedAnalogy, setSelectedAnalogy] = useState<string | null>(null)
  const [conceptData, setConceptData] = useState<ConceptData | null>(null)
  const [userProfession, setUserProfession] = useState<string>('初学者')
  const [isMastered, setIsMastered] = useState(false)
  const [isMarking, setIsMarking] = useState(false)
  
  // 费曼演练启动动画状态
  const [showStudentAnimation, setShowStudentAnimation] = useState(false)
  
  // 类比解释弹窗状态
  const [analogyModal, setAnalogyModal] = useState<{
    isOpen: boolean
    analogy: { id: string; content: string; profession: string } | null
    detail: string
    isLoading: boolean
    error: string
  }>({
    isOpen: false,
    analogy: null,
    detail: '',
    isLoading: false,
    error: ''
  })

  // 生成类比详细解释
  const generateAnalogyDetail = async (analogy: { id: string; content: string; profession: string }) => {
    setAnalogyModal(prev => ({
      ...prev,
      isOpen: true,
      analogy,
      isLoading: true,
      error: ''
    }))

    try {
      const response = await fetch('/api/analogy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept: conceptName,
          analogyContent: analogy.content,
          profession: analogy.profession,
          isPersonalized: analogy.profession !== '通用'
        })
      })

      if (!response.ok) {
        throw new Error('生成解释失败')
      }

      const result = await response.json()

      if (result.success) {
        setAnalogyModal(prev => ({
          ...prev,
          detail: result.content,
          isLoading: false
        }))
      } else {
        throw new Error(result.error || '生成失败')
      }
    } catch (err: any) {
      console.error('Error generating analogy detail:', err)
      setAnalogyModal(prev => ({
        ...prev,
        error: err.message || '生成失败，请重试',
        isLoading: false
      }))
    }
  }

  // 关闭类比弹窗
  const closeAnalogyModal = () => {
    setAnalogyModal({
      isOpen: false,
      analogy: null,
      detail: '',
      isLoading: false,
      error: ''
    })
  }

  // 调用 AI API 生成概念解码
  const generateConceptWithAI = async () => {
    setIsLoading(true)
    setError('')
    
    console.log('Generating concept decode for:', conceptName, 'Profession:', userProfession)

    try {
      const response = await fetch('/api/concept-decode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          concept: conceptName,
          profession: userProfession
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '生成失败')
      }

      // 解析 AI 返回的数据
      const data = result.data
      
      // 格式化类比数据 - 完全依赖 AI 生成
      let analogies = []
      if (data.analogies && Array.isArray(data.analogies)) {
        analogies = data.analogies.map((a: any, i: number) => ({
          id: `analogy-${i}`,
          content: typeof a === 'string' ? a : (a.content || '暂无类比'),
          profession: typeof a === 'string' ? '通用' : (a.profession || '通用'),
          is_selected: false
        }))
      }
      
      // 确保至少有两个类比：一个通用、一个职业相关
      const hasGeneralAnalogy = analogies.some((a: any) => a.profession === '通用')
      const hasPersonalizedAnalogy = analogies.some((a: any) => a.profession !== '通用')
      
      // 如果没有通用类比，添加一个占位提示
      if (!hasGeneralAnalogy) {
        analogies.unshift({
          id: 'analogy-general',
          content: '就像整理房间，把物品分类摆放，需要时能快速找到',
          profession: '通用',
          is_selected: false
        })
      }
      
      // 如果没有职业相关类比，添加一个占位提示
      if (!hasPersonalizedAnalogy) {
        analogies.push({
          id: 'analogy-personal',
          content: `结合${userProfession}工作场景的类比正在生成中...`,
          profession: userProfession,
          is_selected: false
        })
      }

      // 格式化经典书籍数据
      let classics: ClassicBook[] = []
      if (data.classics && Array.isArray(data.classics)) {
        classics = data.classics.map((c: any) => ({
          title: typeof c === 'string' ? c : (c.title || '未知书名'),
          author: typeof c === 'string' ? '' : (c.author || '未知作者'),
          description: typeof c === 'string' ? '' : (c.description || ''),
          reason: typeof c === 'string' ? '' : (c.reason || ''),
          difficulty: typeof c === 'string' ? '入门级' : (c.difficulty || '入门级')
        }))
      }
      
      // 如果没有返回经典书籍，添加默认书籍
      if (classics.length === 0) {
        classics = [
          {
            title: '《Python编程：从入门到实践》',
            author: 'Eric Matthes',
            description: '一本适合初学者的Python编程入门书籍，通过实际项目帮助理解编程概念。',
            reason: '本书从基础概念讲起，循序渐进，非常适合建立扎实的编程基础。',
            difficulty: '入门级'
          },
          {
            title: '《计算机程序的构造和解释》',
            author: 'Harold Abelson 等',
            description: '计算机科学领域的经典教材，深入讲解程序设计的本质。',
            reason: '帮助你从更高层次理解编程概念，培养计算思维。',
            difficulty: '进阶级'
          }
        ]
      }

      // 检查 AI 返回的内容是否针对职业背景，如果不是则使用默认模板
      console.log('AI返回的data:', data)
      console.log('检查isPersonalized - data.who:', data.who)
      console.log('检查isPersonalized - data.what:', data.what)
      console.log('检查isPersonalized - userProfession:', userProfession)
      const isPersonalized = data.who && data.who.includes(userProfession)
      console.log('isPersonalized结果:', isPersonalized)
      
      if (!isPersonalized) {
        // AI 没有针对职业背景定制，使用我们的模板
        console.log('AI 返回的内容未针对职业背景定制，使用模板')
        // 更新经典书籍的推荐理由
        classics = classics.map((book: ClassicBook) => ({
          ...book,
          reason: book.reason.includes(userProfession) ? book.reason : `对于${userProfession}来说，${book.reason || '这本书能帮助你提升工作效率。'}`
        }))
      }
      
      setConceptData({
        what: isPersonalized ? data.what : `${conceptName}是${userProfession}工作中常用的重要概念，能帮助你更高效地处理业务和数据。`,
        why: isPersonalized ? data.why : `作为${userProfession}，掌握${conceptName}可以提升工作效率，解决实际业务问题，增强竞争力。`,
        how: isPersonalized ? data.how : `${userProfession}可以通过学习基础理论、观看实战案例、在工作中实践来掌握${conceptName}。`,
        when: isPersonalized ? data.when : `当${userProfession}需要处理相关业务流程、分析数据或优化工作效率时，会用到${conceptName}。`,
        where: isPersonalized ? data.where : `${conceptName}在${userProfession}日常使用的办公软件、业务系统、数据分析工具中都有应用。`,
        who: isPersonalized ? data.who : `${userProfession}以及希望提升专业技能的从业者都需要掌握${conceptName}。`,
        analogies,
        classics
      })
    } catch (err: any) {
      console.error('AI Generation Error:', err)
      setError(err.message || 'AI 生成失败，显示默认内容')
      
      // 使用默认数据（针对用户职业背景定制）
      setConceptData({
        what: `${conceptName}是${userProfession}工作中常用的重要概念，能帮助你更高效地处理业务和数据。`,
        why: `作为${userProfession}，掌握${conceptName}可以提升工作效率，解决实际业务问题，增强竞争力。`,
        how: `${userProfession}可以通过学习基础理论、观看实战案例、在工作中实践来掌握${conceptName}。`,
        when: `当${userProfession}需要处理相关业务流程、分析数据或优化工作效率时，会用到${conceptName}。`,
        where: `${conceptName}在${userProfession}日常使用的办公软件、业务系统、数据分析工具中都有应用。`,
        who: `${userProfession}以及希望提升专业技能的从业者都需要掌握${conceptName}。`,
        analogies: [
          {
            id: '1',
            content: `就像整理工具箱，${conceptName}帮助你组织和处理信息。`,
            profession: '通用',
            is_selected: false
          },
          {
            id: '2',
            content: `如同${userProfession}管理商品库存，${conceptName}帮助你系统化地组织和调用资源。`,
            profession: userProfession,
            is_selected: false
          }
        ],
        classics: [
          {
            title: '《Python编程：从入门到实践》',
            author: 'Eric Matthes',
            description: '一本适合初学者的Python编程入门书籍，通过实际项目帮助理解编程概念。',
            reason: `对于${userProfession}来说，本书能帮助你建立数据处理思维，提升工作效率。`,
            difficulty: '入门级'
          },
          {
            title: '《计算机程序的构造和解释》',
            author: 'Harold Abelson 等',
            description: '计算机科学领域的经典教材，深入讲解程序设计的本质。',
            reason: `帮助${userProfession}从更高层次理解数字化工具的原理，更好地运用技术。`,
            difficulty: '进阶级'
          },
          {
            title: '《代码大全》',
            author: 'Steve McConnell',
            description: '软件开发的百科全书，涵盖编程的方方面面。',
            reason: `提供了大量实用的技巧和最佳实践，${userProfession}可以借鉴其中的系统化思维。`,
            difficulty: '进阶级'
          }
        ]
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 获取用户职业背景
  useEffect(() => {
    const fetchUserProfession = async () => {
      if (user) {
        try {
          // 先从 user_metadata 获取
          const metadataProfession = user.user_metadata?.profession
          if (metadataProfession && metadataProfession !== '初学者') {
            setUserProfession(metadataProfession)
            return
          }
          
          // 从 profiles 表获取
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('profession')
            .eq('id', user.id)
            .single()
          
          if (error) {
            console.error('Error fetching profile:', error)
            return
          }
          
          if (profile?.profession) {
            setUserProfession(profile.profession)
          }
        } catch (err) {
          console.error('Error fetching user profession:', err)
        }
      }
    }
    
    fetchUserProfession()
  }, [user])

  // 检查该概念是否已标记为已理解
  useEffect(() => {
    const checkMasteredStatus = async () => {
      if (!user || !conceptId) return

      try {
        const { data, error } = await supabase
          .from('learning_progress')
          .select('status')
          .eq('user_id', user.id)
          .eq('concept_id', conceptId)
          .single()

        if (!error && data?.status === 'mastered') {
          setIsMastered(true)
        }
      } catch (err) {
        console.error('Error checking mastered status:', err)
      }
    }

    checkMasteredStatus()
  }, [user, conceptId])
  
  useEffect(() => {
    if (userProfession) {
      generateConceptWithAI()
    }
  }, [conceptId, conceptName, userProfession])

  const handleStartFeynman = () => {
    // 显示学生动画
    setShowStudentAnimation(true)
    
    // 延迟跳转，让用户看到动画
    setTimeout(() => {
      window.location.href = `/feynman/${conceptId}?name=${encodeURIComponent(conceptName)}&topic=${encodeURIComponent(topic)}&initial=true`
    }, 2000)
  }

  const handleMarkAsMastered = async () => {
    if (!user) {
      alert('请先登录')
      return
    }

    setIsMarking(true)
    
    try {
      // 1. 更新学习进度
      const { error: progressError } = await supabase
        .from('learning_progress')
        .upsert({
          user_id: user.id,
          concept_id: conceptId,
          concept_name: conceptName,
          topic: topic,
          status: 'mastered',
          mastery_level: 100,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,concept_id'
        })

      if (progressError) {
        console.error('Error updating progress:', progressError)
        throw progressError
      }

      // 2. 更新学习统计
      const { data: statsData, error: statsError } = await supabase
        .from('learning_stats')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (statsError && statsError.code !== 'PGRST116') {
        console.error('Error fetching stats:', statsError)
      }

      if (statsData) {
        await supabase
          .from('learning_stats')
          .update({
            mastered_concepts: (statsData.mastered_concepts || 0) + 1,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
      } else {
        await supabase
          .from('learning_stats')
          .insert({
            user_id: user.id,
            learning_topics: 1,
            mastered_concepts: 1,
            feynman_sessions: 0,
            streak_days: 1,
            last_study_date: new Date().toISOString().split('T')[0]
          })
      }

      // 3. 检查是否触发成就
      await checkAchievements()

      setIsMastered(true)
      alert('🎉 恭喜！已标记为已理解，学习进度已更新')
    } catch (error: any) {
      console.error('Error marking as mastered:', error)
      const errorMessage = error?.message || error?.error_description || '未知错误'
      alert(`标记失败: ${errorMessage}`)
    } finally {
      setIsMarking(false)
    }
  }

  const checkAchievements = async () => {
    if (!user) return

    try {
      // 获取当前学习统计
      const { data: stats } = await supabase
        .from('learning_stats')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (!stats) return

      // 获取当前成就
      const { data: userData } = await supabase
        .from('profiles')
        .select('achievements')
        .eq('id', user.id)
        .single()

      const currentAchievements = userData?.achievements || []
      const newAchievements = [...currentAchievements]

      // 检查"初学乍练"成就（掌握1个概念）
      if (stats.mastered_concepts >= 1 && !currentAchievements.includes('first_step')) {
        newAchievements.push('first_step')
      }

      // 检查"渐入佳境"成就（掌握5个概念）
      if (stats.mastered_concepts >= 5 && !currentAchievements.includes('getting_better')) {
        newAchievements.push('getting_better')
      }

      // 检查"融会贯通"成就（掌握10个概念）
      if (stats.mastered_concepts >= 10 && !currentAchievements.includes('master')) {
        newAchievements.push('master')
      }

      // 更新成就
      if (newAchievements.length > currentAchievements.length) {
        await supabase
          .from('profiles')
          .update({ achievements: newAchievements })
          .eq('id', user.id)
        
        const unlocked = newAchievements.filter(a => !currentAchievements.includes(a))
        console.log('解锁新成就:', unlocked)
      }
    } catch (error) {
      console.error('Error checking achievements:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden bg-gradient-to-b from-[#0f172a] via-[#1e293b] to-[#0f172a]">
        {/* 科技蓝能量场背景 */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: 30 + Math.random() * 100,
                height: 30 + Math.random() * 100,
                background: `radial-gradient(circle at 30% 30%, ${['#3b82f6', '#06b6d4', '#8b5cf6', '#10b981', '#f59e0b'][i % 5]}30, transparent)`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`
              }}
              animate={{
                y: [0, -50, 0],
                x: [0, Math.random() * 40 - 20, 0],
                scale: [1, 1.3, 1],
                opacity: [0.2, 0.5, 0.2]
              }}
              transition={{
                duration: 5 + Math.random() * 3,
                repeat: Infinity,
                delay: Math.random() * 2,
                ease: 'easeInOut'
              }}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center relative z-10"
        >
          {/* 超大幽默男性动画 */}
          <div className="relative w-80 h-80 mx-auto mb-12">
            {/* 外圈旋转装饰 - 更大 */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0"
            >
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute text-4xl"
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: `rotate(${i * 45}deg) translateY(-160px) translateX(-50%)`
                  }}
                  animate={{ 
                    scale: [1, 1.5, 1],
                    rotate: [0, 360]
                  }}
                  transition={{ duration: 3, repeat: Infinity, delay: i * 0.15 }}
                >
                  {['⚡', '🔥', '💪', '🚀', '⚙️', '🎮', '🏆', '🍺'][i]}
                </motion.div>
              ))}
            </motion.div>

            {/* 主圆形背景 - 超级大 */}
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-6 rounded-full bg-gradient-to-br from-[#3b82f6]/40 via-[#06b6d4]/30 to-[#8b5cf6]/40 border-4 border-[#3b82f6]/60"
              style={{
                boxShadow: '0 0 100px rgba(59, 130, 246, 0.5), inset 0 0 60px rgba(255, 255, 255, 0.1)'
              }}
            />

            {/* 幽默男性表情 - 超级大 */}
            <motion.div
              animate={{
                y: [0, -20, 0],
                rotate: [-5, 5, -5]
              }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="text-center">
                {/* 男性头像 - 超大 */}
                <motion.div
                  animate={{ 
                    rotate: [0, 15, -15, 0],
                    scale: [1, 1.15, 1]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-9xl mb-4"
                >
                  👨‍💻
                </motion.div>
                {/* 墨镜特效 */}
                <motion.div
                  animate={{ opacity: [0.7, 1, 0.7], y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl -mt-4"
                >
                  🕶️
                </motion.div>
              </div>
            </motion.div>

            {/* 旋转的能量符号 */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0"
            >
              <div className="absolute top-4 left-1/2 -translate-x-1/2 text-4xl">⚡</div>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-4xl">🔥</div>
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-3xl">💪</div>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-3xl">🚀</div>
            </motion.div>

            {/* 飘浮的代码符号 */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-3xl font-bold"
                style={{
                  left: `${15 + i * 14}%`,
                  top: '60%',
                  color: ['#3b82f6', '#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'][i]
                }}
                animate={{
                  y: [0, -60, 0],
                  x: [0, Math.sin(i) * 30, 0],
                  opacity: [0, 1, 0],
                  scale: [0.5, 1.2, 0.5],
                  rotate: [0, 360]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.5,
                  ease: 'easeOut'
                }}
              >
                {['{ }', '</>', '&&', '||', '=>', '[]'][i]}
              </motion.div>
            ))}

            {/* 底部跳跃的小宠物 */}
            <motion.div
              animate={{ y: [0, -30, 0], rotate: [0, 15, -15, 0] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-5xl"
            >
              🐕
            </motion.div>
          </div>

          {/* 主标题 - 更大更醒目 */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-5xl font-black text-white mb-6"
          >
            <span className="bg-gradient-to-r from-[#3b82f6] via-[#06b6d4] to-[#8b5cf6] bg-clip-text text-transparent">
              正在解码概念
            </span>
            <motion.span
              animate={{ rotate: [0, 30, -30, 0], scale: [1, 1.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
              className="inline-block ml-4"
            >
              ⚡
            </motion.span>
          </motion.h2>

          {/* 副标题 */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xl text-white/70 mb-10"
          >
            AI 正在为你拆解「{conceptName}」的核心逻辑...
          </motion.p>

          {/* 幽默俏皮激励话语 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 }}
            className="inline-block"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              className="px-10 py-5 rounded-3xl bg-gradient-to-r from-[#3b82f6]/40 via-[#06b6d4]/30 to-[#8b5cf6]/40 border-2 border-[#3b82f6]/60 backdrop-blur-sm"
              style={{
                boxShadow: '0 10px 50px rgba(59, 130, 246, 0.4)'
              }}
            >
              <span className="text-2xl font-black text-white drop-shadow-lg">
                🧠 大脑正在超频，知识即将爆表！
              </span>
            </motion.div>
          </motion.div>

          {/* 幽默的加载进度 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="flex justify-center items-center gap-5 mt-14"
          >
            {['⌨️', '💻', '🖱️', '☕', '🎧'].map((emoji, i) => (
              <motion.span
                key={i}
                className="text-4xl"
                animate={{
                  y: [0, -25, 0],
                  scale: [1, 1.4, 1],
                  rotate: [0, 15, -15, 0]
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              >
                {emoji}
              </motion.span>
            ))}
          </motion.div>

          {/* 可爱的加载进度 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="flex justify-center items-center gap-3 mt-10"
          >
            {['🌸', '💖', '✨'].map((emoji, i) => (
              <motion.span
                key={i}
                className="text-2xl"
                animate={{
                  y: [0, -15, 0],
                  scale: [1, 1.3, 1],
                  rotate: [0, 10, -10, 0]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.3
                }}
              >
                {emoji}
              </motion.span>
            ))}
          </motion.div>
        </motion.div>
      </div>
    )
  }

  if (!conceptData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">概念数据加载失败</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-8 pb-24">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => {
            // 优先使用 history.back()，如果无法返回则导航到知识图页面
            if (window.history.length > 1) {
              router.back()
            } else {
              router.push('/knowledge-map')
            }
          }}
          className="flex items-center space-x-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>返回知识图</span>
        </button>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <span className="text-red-400 flex-1">{error}</span>
            <button
              onClick={generateConceptWithAI}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-red-400" />
            </button>
          </div>
        )}

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold gradient-text mb-2">
            📚 {conceptName}
          </h1>
          <p className="text-gray-400">概念解码器</p>
        </motion.div>

        {/* 5W1H Section - 翻卡版本 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <BookOpen className="w-5 h-5 mr-2 text-[#e8a87c]" />
              5W1H 全维定义
            </h2>
            <span className="text-xs text-gray-500">点击卡片查看详细解释</span>
          </div>
          
          <FiveWOneHCard 
            data={conceptData} 
            conceptName={conceptName}
          />
        </motion.div>

        {/* Analogies Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <Lightbulb className="w-5 h-5 mr-2 text-[#e8a87c]" />
              类比解释
            </h2>
            <span className="text-xs text-gray-500">点击卡片查看通俗解读</span>
          </div>
          
          <div className="space-y-3">
            {/* 先显示用户职业背景的类比 */}
            {conceptData.analogies
              .filter(a => a.profession !== '通用')
              .map((analogy) => (
                <motion.button
                  key={analogy.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => generateAnalogyDetail(analogy)}
                  className="w-full p-4 rounded-xl border-2 text-left transition-all border-[#85dcb8]/40 bg-gradient-to-r from-[#85dcb8]/15 to-[#85dcb8]/5 hover:border-[#85dcb8]/60 hover:from-[#85dcb8]/20 hover:to-[#85dcb8]/10 group"
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-[#85dcb8]/25 flex items-center justify-center flex-shrink-0">
                      <span className="text-xl">👤</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm font-bold text-[#85dcb8]">基于您的{analogy.profession}背景</span>
                        <Sparkles className="w-3 h-3 text-[#e8a87c] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-white font-medium leading-relaxed">{analogy.content}</p>
                      <span className="text-xs text-gray-400 mt-3 flex items-center group-hover:text-[#e8a87c] transition-colors font-medium">
                        点击查看通俗解读 →
                      </span>
                    </div>
                  </div>
                </motion.button>
              ))}
            
            {/* 再显示通用背景的类比 */}
            {conceptData.analogies
              .filter(a => a.profession === '通用')
              .map((analogy) => (
                <motion.button
                  key={analogy.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => generateAnalogyDetail(analogy)}
                  className="w-full p-4 rounded-xl border-2 text-left transition-all border-white/15 bg-gradient-to-r from-white/10 to-white/5 hover:border-white/40 hover:from-white/15 hover:to-white/10 group"
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                      <span className="text-xl">🌍</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm font-bold text-gray-300">通用解释</span>
                        <Sparkles className="w-3 h-3 text-[#e8a87c] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-white font-medium leading-relaxed">{analogy.content}</p>
                      <span className="text-xs text-gray-400 mt-3 flex items-center group-hover:text-[#e8a87c] transition-colors font-medium">
                        点击查看通俗解读 →
                      </span>
                    </div>
                  </div>
                </motion.button>
              ))}
          </div>
        </motion.div>

        {/* Classics Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6 mb-8"
        >
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Library className="w-5 h-5 mr-2 text-[#e8a87c]" />
            经典溯源
          </h2>
          
          <div className="space-y-4">
            {conceptData.classics.map((book, index) => {
              const difficultyColor = book.difficulty === '入门级' ? '#22c55e' :
                                      book.difficulty === '进阶级' ? '#eab308' : '#ef4444'
              
              return (
                <motion.div
                  key={index}
                  whileHover={{ 
                    scale: 1.02,
                    y: -4,
                    transition: { type: 'spring', stiffness: 400, damping: 15 }
                  }}
                  whileTap={{ scale: 0.98 }}
                  className="relative p-4 rounded-xl bg-gradient-to-br from-white/10 to-white/5 
                    border-2 border-white/10 hover:border-white/30 
                    transition-all duration-300 ease-out
                    overflow-hidden group cursor-pointer
                    hover:shadow-2xl"
                  style={{
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                  }}
                >
                  {/* 悬停发光边框效果 */}
                  <motion.div
                    className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{
                      background: `linear-gradient(135deg, ${difficultyColor}15 0%, transparent 50%, ${difficultyColor}10 100%)`,
                      boxShadow: `inset 0 0 30px ${difficultyColor}15, 0 0 30px ${difficultyColor}25`
                    }}
                  />

                  {/* 背景装饰 - 悬停时放大 */}
                  <motion.div
                    className="absolute top-0 right-0 w-20 h-20 rounded-full -mr-10 -mt-10 transition-all duration-500 group-hover:scale-150 group-hover:opacity-20"
                    style={{ 
                      backgroundColor: difficultyColor,
                      opacity: 0.1
                    }}
                  />

                  {/* 底部装饰 */}
                  <motion.div
                    className="absolute bottom-0 left-0 w-12 h-12 rounded-full -ml-6 -mb-6 transition-all duration-500 group-hover:scale-150 group-hover:opacity-15"
                    style={{ 
                      backgroundColor: '#e8a87c',
                      opacity: 0.05
                    }}
                  />

                  {/* 内容 */}
                  <div className="relative">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <motion.span 
                          className="text-2xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
                        >
                          📖
                        </motion.span>
                        <h3 className="font-semibold text-white text-lg transition-all duration-300 group-hover:text-xl">
                          {book.title}
                        </h3>
                      </div>
                      <motion.span 
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 group-hover:scale-105`}
                        style={{
                          backgroundColor: `${difficultyColor}25`,
                          color: difficultyColor,
                          boxShadow: '0 0 0 transparent'
                        }}
                        whileHover={{
                          boxShadow: `0 0 20px ${difficultyColor}50`
                        }}
                      >
                        {book.difficulty}
                      </motion.span>
                    </div>
                    
                    {book.author && (
                      <motion.p 
                        className="text-sm text-gray-400 mb-2 transition-colors duration-300 group-hover:text-gray-300"
                      >
                        作者: {book.author}
                      </motion.p>
                    )}
                    
                    {book.description && (
                      <motion.p 
                        className="text-sm text-gray-300 mb-2 transition-colors duration-300 group-hover:text-gray-200 line-clamp-2"
                      >
                        {book.description}
                      </motion.p>
                    )}
                    
                    {book.reason && (
                      <motion.div 
                        className="mt-3 p-3 rounded-lg bg-[#e8a87c]/10 border-l-2 border-[#e8a87c] 
                          transition-all duration-300 group-hover:bg-[#e8a87c]/15 group-hover:border-l-4"
                      >
                        <p className="text-sm text-[#e8a87c]">
                          <span className="font-medium">💡 推荐理由:</span> {book.reason}
                        </p>
                      </motion.div>
                    )}

                  </div>

                  {/* 悬停时的光扫效果 */}
                  <motion.div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '100%' }}
                    transition={{ duration: 0.8, ease: 'easeInOut' }}
                    style={{
                      background: `linear-gradient(90deg, transparent 0%, ${difficultyColor}08 50%, transparent 100%)`,
                    }}
                  />
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <motion.button
            onClick={handleStartFeynman}
            disabled={showStudentAnimation}
            whileHover={{ scale: showStudentAnimation ? 1 : 1.02 }}
            whileTap={{ scale: showStudentAnimation ? 1 : 0.98 }}
            className="btn-primary flex items-center justify-center space-x-2 flex-1 relative overflow-hidden"
          >
            {showStudentAnimation ? (
              <motion.div 
                className="flex items-center space-x-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <motion.span
                  animate={{ 
                    rotate: [0, -10, 10, -10, 10, 0],
                    scale: [1, 1.1, 1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 0.5, 
                    repeat: Infinity,
                    repeatDelay: 0.5
                  }}
                  className="text-2xl"
                >
                  👨‍🎓
                </motion.span>
                <span>准备中...</span>
              </motion.div>
            ) : (
              <>
                <GraduationCap className="w-5 h-5" />
                <span>进入费曼演练</span>
              </>
            )}
          </motion.button>
          
          <button
            onClick={handleMarkAsMastered}
            disabled={isMarking || isMastered}
            className={`btn-secondary flex items-center justify-center space-x-2 flex-1 ${
              isMastered ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : ''
            }`}
          >
            {isMarking ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>标记中...</span>
              </>
            ) : isMastered ? (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>已理解</span>
              </>
            ) : (
              <>
                <Target className="w-5 h-5" />
                <span>标记为已理解</span>
              </>
            )}
          </button>
          
          <button
            onClick={() => {
              // 优先使用 history.back()，如果无法返回则导航到知识图页面
              if (window.history.length > 1) {
                router.back()
              } else {
                router.push('/knowledge-map')
              }
            }}
            className="btn-secondary flex items-center justify-center space-x-2"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>返回知识图</span>
          </button>
        </motion.div>

        {/* 费曼演练启动动画 */}
        <AnimatePresence>
          {showStudentAnimation && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center"
              style={{
                background: 'rgba(0, 0, 0, 0.9)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                className="text-center"
              >
                {/* 学生图标动画 */}
                <motion.div
                  animate={{ 
                    y: [0, -20, 0],
                    rotate: [0, -5, 5, -5, 5, 0]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                  className="text-8xl mb-6"
                >
                  👨‍🎓
                </motion.div>
                
                {/* 对话气泡 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="relative inline-block mb-8"
                >
                  <div 
                    className="px-6 py-4 rounded-2xl text-white text-lg font-medium"
                    style={{
                      background: 'linear-gradient(135deg, #e8a87c 0%, #d4956c 100%)',
                      boxShadow: '0 10px 40px rgba(232, 168, 124, 0.4)'
                    }}
                  >
                    "老师，我想学习「{conceptName}」！"
                  </div>
                  {/* 气泡小三角 */}
                  <div 
                    className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 rotate-45"
                    style={{
                      background: '#d4956c'
                    }}
                  />
                </motion.div>
                
                {/* 加载提示 */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex flex-col items-center"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-8 h-8 border-3 border-[#e8a87c] border-t-transparent rounded-full mb-3"
                  />
                  <p className="text-gray-400 text-sm">正在准备费曼演练...</p>
                  <p className="text-gray-500 text-xs mt-1">针对「{conceptName}」的专属问题</p>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 类比解释弹窗 */}
        <AnimatePresence>
          {analogyModal.isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
              onClick={closeAnalogyModal}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="relative w-full max-w-2xl max-h-[80vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="rounded-2xl border border-white/20 overflow-hidden bg-gradient-to-br from-[#1a1a2e] to-[#16213e]">
                  {/* 头部 */}
                  <div className="p-6 border-b border-white/10 bg-[#e8a87c]/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-xl bg-[#e8a87c]/20 flex items-center justify-center">
                          <Lightbulb className="w-6 h-6 text-[#e8a87c]" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white">
                            通俗解读
                          </h3>
                          <span className="text-sm text-gray-400">
                            {analogyModal.analogy?.profession !== '通用' 
                              ? `基于您的${analogyModal.analogy?.profession}背景` 
                              : '通用解释'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={closeAnalogyModal}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5 text-gray-400" />
                      </button>
                    </div>
                  </div>

                  {/* 内容区域 */}
                  <div className="p-6 overflow-y-auto max-h-[50vh]">
                    {analogyModal.isLoading ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        {/* 搞笑可爱的加载动画 */}
                        <div className="relative w-32 h-32 mb-6">
                          {/* 旋转的光环 */}
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                            className="absolute inset-0 rounded-full border-2 border-dashed border-[#e8a87c]/40"
                          />
                          {/* 反向旋转 */}
                          <motion.div
                            animate={{ rotate: -360 }}
                            transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
                            className="absolute inset-2 rounded-full border-2 border-dotted border-[#85dcb8]/50"
                          />
                          {/* 中心表情 */}
                          <motion.div
                            animate={{ 
                              scale: [1, 1.2, 1],
                              rotate: [0, 10, -10, 0]
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute inset-0 flex items-center justify-center text-6xl"
                          >
                            🧠
                          </motion.div>
                          {/* 飘浮的小符号 */}
                          {['💡', '✨', '📚', '🎯'].map((emoji, i) => (
                            <motion.div
                              key={i}
                              className="absolute text-xl"
                              style={{
                                left: '50%',
                                top: '50%'
                              }}
                              animate={{
                                x: [0, Math.cos(i * Math.PI / 2) * 50],
                                y: [0, Math.sin(i * Math.PI / 2) * 50],
                                opacity: [0, 1, 0],
                                scale: [0.5, 1, 0.5]
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                delay: i * 0.5
                              }}
                            >
                              {emoji}
                            </motion.div>
                          ))}
                        </div>
                        
                        {/* 加载文字 */}
                        <motion.p 
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="text-gray-300 font-medium mb-3"
                        >
                          AI 正在疯狂转动大脑...
                        </motion.p>
                        
                        {/* 随机搞笑鼓励话语 - 50条 */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 }}
                          className="px-4 py-2 rounded-full bg-gradient-to-r from-[#e8a87c]/20 to-[#85dcb8]/20 border border-[#e8a87c]/30"
                        >
                          <p className="text-sm text-[#e8a87c]">
                            {(() => {
                              const messages = [
                                '🤯 大脑正在扩容中，请稍候...',
                                '💪 学习就像健身，痛苦但值得！',
                                '🧠 你的脑细胞正在开派对！',
                                '📚 知识正在排队进入你的大脑...',
                                '✨ 每一个概念都是一颗星星，正在为你点亮！',
                                '🎯 瞄准目标，知识正在飞向你！',
                                '🚀 你的大脑即将升级，请稍候...',
                                '💡 灵感正在路上，堵车了但马上到！',
                                '🎮 学习模式已开启，经验值+100！',
                                '☕ 咖啡因已注入，大脑全速运转中...',
                                '🎵 知识正在以3倍速下载中...',
                                '🌟 你的智商正在突破天际！',
                                '🔥 大脑CPU温度正常，超频运行中...',
                                '⚡ 知识闪电正在击中你的大脑！',
                                '🎪 你的大脑正在上演知识马戏团！',
                                '🍕 知识就像披萨，一片一片进入你的大脑...',
                                '🎨 你的大脑正在绘制知识地图...',
                                '🎭 神经元们正在排练知识大戏！',
                                '🎪 脑细胞们正在开知识嘉年华！',
                                '🎸 你的大脑正在摇滚学习模式！',
                                '🎳 知识保龄球正在击倒你的无知！',
                                '🎮 恭喜解锁新技能：概念理解！',
                                '🎰 知识老虎机正在转出大奖！',
                                '🎤 你的大脑正在举办知识演唱会！',
                                '🎬 知识大片正在你的大脑首映！',
                                '🎨 你的大脑正在创作知识杰作！',
                                '🎪 脑细胞们正在表演知识杂技！',
                                '🎭 你的大脑正在上演知识话剧！',
                                '🎸 知识摇滚正在你的大脑开唱！',
                                '🎺 你的大脑正在吹响知识号角！',
                                '🎻 知识交响乐正在你的大脑演奏！',
                                '🎹 你的大脑正在弹奏知识钢琴曲！',
                                '🎤 知识卡拉OK正在你的大脑进行！',
                                '🎬 你的大脑正在拍摄知识纪录片！',
                                '🎨 你的大脑正在举办知识画展！',
                                '🎪 知识马戏团正在你的大脑巡演！',
                                '🎭 你的大脑正在排练知识喜剧！',
                                '🎸 知识乐队正在你的大脑开演唱会！',
                                '🎺 你的大脑正在吹奏知识进行曲！',
                                '🎻 知识小提琴正在你的大脑演奏！',
                                '🎹 你的大脑正在创作知识奏鸣曲！',
                                '🎤 知识脱口秀正在你的大脑直播！',
                                '🎬 你的大脑正在剪辑知识大片！',
                                '🎨 知识涂鸦正在你的大脑创作中！',
                                '🎪 知识魔术正在你的大脑上演！',
                                '🎭 你的大脑正在导演知识电影！',
                                '🎸 知识吉他正在你的大脑独奏！',
                                '🎺 你的大脑正在吹响知识起床号！',
                                '🎻 知识大提琴正在你的大脑低吟！',
                                '🎹 你的大脑正在即兴演奏知识爵士！'
                              ]
                              return messages[Math.floor(Math.random() * messages.length)]
                            })()}
                          </p>
                        </motion.div>
                      </div>
                    ) : analogyModal.error ? (
                      <div className="text-center py-12">
                        <p className="text-red-400 mb-4">{analogyModal.error}</p>
                        <button
                          onClick={() => analogyModal.analogy && generateAnalogyDetail(analogyModal.analogy)}
                          className="px-4 py-2 bg-[#e8a87c]/20 text-[#e8a87c] rounded-lg hover:bg-[#e8a87c]/30 transition-colors flex items-center space-x-2 mx-auto"
                        >
                          <RefreshCw className="w-4 h-4" />
                          <span>重新生成</span>
                        </button>
                      </div>
                    ) : analogyModal.detail ? (
                      <div className="prose prose-invert max-w-none">
                        {analogyModal.detail.split('\n').map((line, index) => {
                          const trimmedLine = line.trim()
                          if (trimmedLine.startsWith('### ')) {
                            return <h4 key={index} className="text-lg font-bold text-[#e8a87c] mt-6 mb-3">{trimmedLine.replace('### ', '')}</h4>
                          }
                          if (trimmedLine.startsWith('## ')) {
                            return <h3 key={index} className="text-xl font-bold text-white mt-8 mb-4">{trimmedLine.replace('## ', '')}</h3>
                          }
                          if (trimmedLine.startsWith('- ')) {
                            return (
                              <li key={index} className="text-gray-300 text-sm flex items-start ml-4 mb-2">
                                <span className="text-[#e8a87c] mr-2">•</span>
                                <span dangerouslySetInnerHTML={{ 
                                  __html: trimmedLine.substring(2).replace(/\*\*(.+?)\*\*/g, '<strong class="text-[#e8a87c]">$1</strong>') 
                                }} />
                              </li>
                            )
                          }
                          if (trimmedLine) {
                            return (
                              <p key={index} className="text-gray-300 text-sm mb-3 leading-relaxed">
                                <span dangerouslySetInnerHTML={{ 
                                  __html: trimmedLine.replace(/\*\*(.+?)\*\*/g, '<strong class="text-[#e8a87c]">$1</strong>') 
                                }} />
                              </p>
                            )
                          }
                          return null
                        })}
                      </div>
                    ) : null}
                  </div>

                  {/* 底部 */}
                  <div className="p-4 border-t border-white/10 bg-white/5 flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      类比：{analogyModal.analogy?.content.substring(0, 30)}...
                    </span>
                    <button
                      onClick={closeAnalogyModal}
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-[#e8a87c]/20 text-[#e8a87c] hover:bg-[#e8a87c]/30 transition-colors"
                    >
                      关闭
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default function ConceptPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/10 border-t-[#e8a87c] rounded-full animate-spin" />
      </div>
    }>
      <ConceptContent />
    </Suspense>
  )
}
