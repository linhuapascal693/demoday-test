'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Rocket, BookOpen, Newspaper, User, Menu, X, LogIn, LogOut } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'

const navItems = [
  { href: '/', label: '首页', icon: Rocket },
  { href: '/knowledge-map', label: '知识图', icon: BookOpen },
  { href: '/news', label: '资讯流', icon: Newspaper },
  { href: '/profile', label: '个人中心', icon: User },
]

export function Navigation() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/'
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card rounded-none border-t-0 border-x-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl">🪐</span>
            <span className="text-xl font-bold gradient-text hidden sm:block">
              知识领航员
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-1 px-4 py-2 rounded-lg transition-all duration-300',
                    isActive
                      ? 'bg-gradient-to-r from-[#e8a87c]/20 to-[#85dcb8]/20 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              )
            })}
            
            {/* Auth Button */}
            {user ? (
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-1 px-4 py-2 rounded-lg transition-all duration-300 ml-2 text-gray-300 hover:text-white hover:bg-white/5"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">退出</span>
              </button>
            ) : (
              <Link
                href="/auth"
                className={cn(
                  'flex items-center space-x-1 px-4 py-2 rounded-lg transition-all duration-300 ml-2',
                  pathname === '/auth'
                    ? 'bg-gradient-to-r from-[#e8a87c]/20 to-[#85dcb8]/20 text-white'
                    : 'bg-gradient-to-r from-[#e8a87c] to-[#c38d9e] text-slate-900 hover:opacity-90'
                )}
              >
                <LogIn className="w-4 h-4" />
                <span className="text-sm font-medium">登录 / 注册</span>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/5"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/10">
            <div className="flex flex-col space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={cn(
                      'flex items-center space-x-2 px-4 py-3 rounded-lg transition-all duration-300',
                      isActive
                        ? 'bg-gradient-to-r from-[#e8a87c]/20 to-[#85dcb8]/20 text-white'
                        : 'text-gray-300 hover:text-white hover:bg-white/5'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                )
              })}
              
              {/* Mobile Auth Button */}
              {user ? (
                <button
                  onClick={() => {
                    handleSignOut()
                    setIsMenuOpen(false)
                  }}
                  className="flex items-center space-x-2 px-4 py-3 rounded-lg transition-all duration-300 mt-2 text-gray-300 hover:text-white hover:bg-white/5"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">退出登录</span>
                </button>
              ) : (
                <Link
                  href="/auth"
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    'flex items-center space-x-2 px-4 py-3 rounded-lg transition-all duration-300 mt-2',
                    pathname === '/auth'
                      ? 'bg-gradient-to-r from-[#e8a87c]/20 to-[#85dcb8]/20 text-white'
                      : 'bg-gradient-to-r from-[#e8a87c] to-[#c38d9e] text-slate-900'
                  )}
                >
                  <LogIn className="w-5 h-5" />
                  <span className="font-medium">登录 / 注册</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
