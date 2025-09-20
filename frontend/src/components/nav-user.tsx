"use client"

import {
  BadgeCheck,
  ChevronsUpDown,
  LogOut,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

import axios from "axios"
import { useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"

export function NavUser() {
  const { isMobile } = useSidebar()
  const navigate = useNavigate()

  const [user, setUser] = useState<{
    profileImage: string | undefined
    name: string
    email: string
    avatar: string
  } | null>(null)


  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get("https://split-backend-02lh.onrender.com/api/getUser", {
          withCredentials: true,
        })
        setUser(res.data) 
        console.log("User fetched:", res.data)
      } catch (error) {
        console.error("Failed to fetch user:", error)
      }
    }
    fetchUser()
  }, [])

  const handleLogout = async () => {
    try {
      await axios.post("https://split-backend-02lh.onrender.com/api/logout", {}, { withCredentials: true })
      navigate("/login") 
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  const handleProfile = () => {
    navigate("/profile")
  }

  if (!user) {
    return null // or a loading spinner
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-full">
                <AvatarImage src={user.profileImage} alt={user.name} />
                <AvatarFallback className="rounded-full">
                  {user.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">
                    {user.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem onClick={handleProfile}>
                <BadgeCheck />
                Profile
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={handleLogout}>
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
