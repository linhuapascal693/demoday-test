'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, Briefcase, Tag, Loader2 } from 'lucide-react'
import { PROFESSIONS, INTERESTS } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'

export default function AuthPage() {
  const router = useRouter()
  const { signIn, signUp } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Form states
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [profession, setProfession] = useState('')
  const [customProfession, setCustomProfession] = useState('')
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      if (isLogin) {
        // 登录
        const { error } = await signIn(email, password)
        if (error) {
          if (error.message === 'Invalid login credentials') {
            setError('邮箱或密码错误')
          } else {
            setError(error.message)
          }
          setIsLoading(false)
          return
        }
      } else {
        // 注册
        if (password !== confirmPassword) {
          setError('两次输入的密码不一致')
          setIsLoading(false)
          return
        }

        if (password.length < 6) {
          setError('密码长度至少为 6 位')
          setIsLoading(false)
          return
        }

        if (!profession) {
          setError('请选择职业背景')
          setIsLoading(false)
          return
        }

        const finalProfession = profession === '其他' ? customProfession : profession

        const { error } = await signUp(email, password, {
          profession: finalProfession,
          interests: selectedInterests,
        })

        if (error) {
          console.error('Registration error:', error)
          if (error.message === 'User already registered') {
            setError('该邮箱已被注册')
          } else if (error.message?.includes('Database error')) {
            setError(`数据库错误: ${error.message}. 请检查控制台获取详细信息。`)
          } else {
            setError(error.message || '注册失败，请重试')
          }
          setIsLoading(false)
          return
        }

        // 注册成功提示
        alert('注册成功！请检查邮箱验证邮件。')
      }

      // 跳转到首页
      router.push('/')
    } catch (err: any) {
      setError(err.message || '操作失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="glass-card p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <span className="text-4xl mb-4 block">🪐</span>
            <h1 className="text-2xl font-bold gradient-text mb-2">
              {isLogin ? '欢迎回来' : '创建账号'}
            </h1>
            <p className="text-gray-400 text-sm">
              {isLogin 
                ? '登录以继续你的学习之旅' 
                : '开启你的知识领航之旅'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-300">
                邮箱
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full h-11 pl-11 pr-4 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#e8a87c]/50 focus:ring-1 focus:ring-[#e8a87c]/20 transition-all"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-300">
                密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full h-11 pl-11 pr-12 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#e8a87c]/50 focus:ring-1 focus:ring-[#e8a87c]/20 transition-all"
                  placeholder={isLogin ? '输入密码' : '设置密码（至少6位）'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password - Only for Register */}
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-300">
                  确认密码
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full h-11 pl-11 pr-4 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#e8a87c]/50 focus:ring-1 focus:ring-[#e8a87c]/20 transition-all"
                    placeholder="再次输入密码"
                  />
                </div>
              </div>
            )}

            {/* Profession - Only for Register */}
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-300">
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4" />
                    职业背景
                  </span>
                </label>
                <select
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  required
                  className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#e8a87c]/50 focus:ring-1 focus:ring-[#e8a87c]/20 transition-all appearance-none cursor-pointer"
                  style={{ 
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    backgroundSize: '16px'
                  }}
                >
                  <option value="" className="bg-[#0f172a] text-gray-400">请选择职业背景</option>
                  {PROFESSIONS.map((prof) => (
                    <option key={prof} value={prof} className="bg-[#0f172a] text-white">
                      {prof}
                    </option>
                  ))}
                </select>

                {profession === '其他' && (
                  <input
                    type="text"
                    value={customProfession}
                    onChange={(e) => setCustomProfession(e.target.value)}
                    required
                    className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#e8a87c]/50 focus:ring-1 focus:ring-[#e8a87c]/20 transition-all mt-2"
                    placeholder="请输入您的职业"
                  />
                )}
              </div>
            )}

            {/* Interests - Only for Register */}
            {!isLogin && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  <span className="flex items-center gap-1.5">
                    <Tag className="w-4 h-4" />
                    兴趣标签（可选）
                  </span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map((interest) => (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                        selectedInterests.includes(interest)
                          ? 'bg-gradient-to-r from-[#e8a87c] to-[#c38d9e] text-slate-900 font-medium'
                          : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-[#e8a87c] to-[#c38d9e] text-slate-900 font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>处理中...</span>
                </>
              ) : (
                <span>{isLogin ? '登录' : '创建账号'}</span>
              )}
            </button>
          </form>

          {/* Toggle */}
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              {isLogin ? '还没有账号？' : '已有账号？'}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin)
                  setError('')
                }}
                className="ml-1 text-[#e8a87c] hover:underline font-medium"
              >
                {isLogin ? '立即注册' : '立即登录'}
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
