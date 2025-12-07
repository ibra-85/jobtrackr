"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Briefcase, LayoutDashboard, FileText, User, LogOut } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSession } from "@/hooks/use-session"
import { authAdapter } from "@/lib/auth"
import { useRouter } from "next/navigation"

interface AppShellProps {
  children: React.ReactNode
}

const navigation = [
  { name: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
  { name: "Candidatures", href: "/applications", icon: FileText },
  { name: "CV & Lettres", href: "/documents", icon: FileText },
]

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { session, loading } = useSession()

  const handleSignOut = async () => {
    try {
      await authAdapter.signOut()
      router.push("/login")
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error)
    }
  }

  const getUserInitials = (name?: string, email?: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    }
    if (email) {
      return email[0].toUpperCase()
    }
    return "U"
  }

  return (
    <div className={cn("min-h-screen bg-background text-foreground flex")}>
      <aside className="hidden md:flex w-60 flex-col border-r border-border/60 bg-muted/20 px-4 py-6 gap-6">
        <Link href="/" className="flex items-center gap-2">
          <Briefcase className="h-5 w-5" />
          <span className="font-semibold">JobTrackr</span>
        </Link>
        <nav className="flex flex-col gap-1 text-sm">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-foreground/60 hover:text-foreground hover:bg-muted/50",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between border-b border-border/60 bg-background/80 backdrop-blur px-4 py-3">
          <div className="flex items-center gap-2 md:hidden">
            <Briefcase className="h-5 w-5" />
            <span className="font-semibold">JobTrackr</span>
          </div>
          <div className="flex-1" />
          {!loading && session && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-xs">
                      {getUserInitials(session.user.name, session.user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline">
                    {session.user.name || session.user.email.split("@")[0]}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">
                      {session.user.name || "Utilisateur"}
                    </p>
                    <p className="text-xs text-muted-foreground">{session.user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer">
                    <User className="h-4 w-4" />
                    Mon profil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-destructive focus:text-destructive cursor-pointer"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </header>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8 bg-gradient-to-b from-background to-background/80">
          {children}
        </main>
      </div>
    </div>
  )
}



