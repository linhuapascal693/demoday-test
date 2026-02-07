'use client'

import { useState, useEffect, Suspense } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  BookOpen, 
  Lightbulb, 
  Library, 
  ChevronLeft,
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
    window.location.href = `/feynman/${conceptId}?name=${encodeURIComponent(conceptName)}&topic=${encodeURIComponent(topic)}`
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
    } catch (error) {
      console.error('Error marking as mastered:', error)
      alert('标记失败，请重试')
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
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#e8a87c] to-[#85dcb8] opacity-20 animate-ping" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-[#e8a87c] animate-spin" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-white/90 mb-2">
            正在解码概念
          </h2>
          <p className="text-sm text-white/50">
            AI 正在生成「{conceptName}」的 5W1H 解析...
          </p>
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
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => window.history.back()}
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
                  className="w-full p-4 rounded-xl border-2 text-left transition-all border-[#85dcb8]/30 bg-gradient-to-r from-[#85dcb8]/10 to-transparent hover:border-[#85dcb8]/50 group"
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-[#85dcb8]/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-xl">👤</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium text-[#85dcb8]">基于您的{analogy.profession}背景</span>
                        <Sparkles className="w-3 h-3 text-[#e8a87c] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-gray-200">{analogy.content}</p>
                      <span className="text-xs text-gray-500 mt-2 flex items-center group-hover:text-[#e8a87c] transition-colors">
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
                  className="w-full p-4 rounded-xl border-2 text-left transition-all border-white/10 bg-white/5 hover:border-white/30 group"
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xl">🌍</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium text-gray-400">通用解释</span>
                        <Sparkles className="w-3 h-3 text-[#e8a87c] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-gray-300">{analogy.content}</p>
                      <span className="text-xs text-gray-500 mt-2 flex items-center group-hover:text-[#e8a87c] transition-colors">
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
            {conceptData.classics.map((book, index) => (
              <div
                key={index}
                className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">📖</span>
                    <h3 className="font-semibold text-white">{book.title}</h3>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    book.difficulty === '入门级' ? 'bg-green-500/20 text-green-400' :
                    book.difficulty === '进阶级' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {book.difficulty}
                  </span>
                </div>
                
                {book.author && (
                  <p className="text-sm text-gray-400 mb-2">
                    作者: {book.author}
                  </p>
                )}
                
                {book.description && (
                  <p className="text-sm text-gray-300 mb-2">
                    {book.description}
                  </p>
                )}
                
                {book.reason && (
                  <div className="mt-3 p-3 rounded bg-[#e8a87c]/10 border-l-2 border-[#e8a87c]">
                    <p className="text-sm text-[#e8a87c]">
                      <span className="font-medium">💡 推荐理由:</span> {book.reason}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <button
            onClick={handleStartFeynman}
            className="btn-primary flex items-center justify-center space-x-2 flex-1"
          >
            <GraduationCap className="w-5 h-5" />
            <span>进入费曼演练</span>
          </button>
          
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
            onClick={() => window.history.back()}
            className="btn-secondary flex items-center justify-center space-x-2"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>返回知识图</span>
          </button>
        </motion.div>

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
                        <Loader2 className="w-8 h-8 text-[#e8a87c] animate-spin mb-4" />
                        <p className="text-gray-400">AI 正在生成通俗解读...</p>
                        <p className="text-gray-500 text-sm mt-2">用大白话讲清楚这个概念</p>
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
