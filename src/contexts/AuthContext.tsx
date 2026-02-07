'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  signUp: (email: string, password: string, metadata: { profession: string; interests: string[] }) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  updateProfile: (data: Partial<UserProfile>) => Promise<{ error: any }>
}

interface UserProfile {
  profession: string
  interests: string[]
  avatar_url?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 获取当前会话
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setIsLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (
    email: string, 
    password: string, 
    metadata: { profession: string; interests: string[] }
  ) => {
    console.log('Starting signUp with:', { email, metadata })
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          profession: metadata.profession,
          interests: metadata.interests,
        },
      },
    })
    
    console.log('SignUp response:', { data, error })
    
    if (error) {
      console.error('SignUp error:', error)
      return { error }
    }
    
    // 如果用户创建成功，手动创建用户资料（触发器可能失败时的备用方案）
    if (data.user) {
      console.log('User created successfully:', data.user.id)
      try {
        // 检查 profiles 表是否已有记录
        const { data: existingProfile, error: checkError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', data.user.id)
          .single()
        
        console.log('Existing profile check:', { existingProfile, checkError })
        
        // 如果没有记录，手动创建
        if (!existingProfile) {
          console.log('Creating new profile...')
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              email: email,
              profession: metadata.profession,
              interests: metadata.interests,
            })
          
          if (profileError) {
            console.error('Error creating profile:', profileError)
          } else {
            console.log('Profile created successfully')
          }
          
          // 创建学习统计记录（添加小延迟避免冲突）
          await new Promise(resolve => setTimeout(resolve, 100))
          
          const { data: existingStats } = await supabase
            .from('learning_stats')
            .select('id')
            .eq('user_id', data.user.id)
            .single()
          
          if (!existingStats) {
            const { error: statsError, data: statsData } = await supabase
              .from('learning_stats')
              .insert({
                user_id: data.user.id,
              })
              .select()
            
            if (statsError) {
              console.error('Error creating learning stats:', statsError)
              console.error('Error details:', JSON.stringify(statsError, null, 2))
            } else {
              console.log('Learning stats created successfully:', statsData)
            }
          } else {
            console.log('Learning stats already exists, skipping creation')
          }
        }
      } catch (err) {
        console.error('Error in post-signup:', err)
      }
    } else {
      console.log('No user data in response')
    }
    
    return { error: null }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const updateProfile = async (data: Partial<UserProfile>) => {
    const { error } = await supabase.auth.updateUser({
      data,
    })
    return { error }
  }

  const value = {
    user,
    session,
    isLoading,
    signUp,
    signIn,
    signOut,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
