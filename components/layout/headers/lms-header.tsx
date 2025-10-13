"use client";

import { useState } from "react";
import { 
  Search, 
  Bell, 
  User, 
  Menu,
  BookOpen,
  Calendar,
  Settings,
  HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { HeaderProps } from "../types";

interface LMSHeaderProps extends Omit<HeaderProps, 'config'> {
  title?: string;
  showSearch?: boolean;
  notificationCount?: number;
  userAvatar?: string;
  userName?: string;
  onMenuClick?: () => void;
  onNotificationClick?: () => void;
  onProfileClick?: () => void;
  onSearch?: (query: string) => void;
}

export function LMSHeader({
  title = "Learning Platform",
  showSearch = true,
  notificationCount = 0,
  userAvatar,
  userName = "User",
  onMenuClick,
  onNotificationClick,
  onProfileClick,
  onSearch,
  className = ""
}: LMSHeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearch?.(value);
  };

  const userInitials = userName
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className={`bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm ${className}`}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Mobile Menu + Title */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onMenuClick}
              className="md:hidden h-10 w-10 p-0"
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Platform Title/Logo */}
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <h1 className="text-lg font-semibold text-gray-900 hidden sm:block">
                {title}
              </h1>
            </div>
          </div>

          {/* Search Bar - Hidden on small mobile */}
          {showSearch && (
            <div className="flex-1 max-w-2xl hidden sm:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search courses, assignments, resources..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-4 h-10 bg-gray-50 border-gray-200 rounded-full focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>
          )}

          {/* Action Items */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Mobile Search Button */}
            {showSearch && (
              <Button
                variant="ghost"
                size="sm"
                className="sm:hidden h-10 w-10 p-0"
              >
                <Search className="h-5 w-5" />
              </Button>
            )}

            {/* Quick Actions - Hidden on mobile */}
            <div className="hidden md:flex items-center gap-1">
              <Button variant="ghost" size="sm" className="h-10 px-3">
                <Calendar className="h-4 w-4 mr-2" />
                <span className="hidden lg:inline">Calendar</span>
              </Button>
              
              <Button variant="ghost" size="sm" className="h-10 px-3">
                <HelpCircle className="h-4 w-4 mr-2" />
                <span className="hidden lg:inline">Help</span>
              </Button>
            </div>

            {/* Notifications */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onNotificationClick}
              className="relative h-10 w-10 p-0 hover:bg-gray-100 rounded-full"
            >
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs rounded-full"
                >
                  {notificationCount > 9 ? '9+' : notificationCount}
                </Badge>
              )}
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={userAvatar} alt={userName} />
                    <AvatarFallback className="text-xs">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium">{userName}</p>
                  <p className="text-xs text-muted-foreground">Learning Platform</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onProfileClick}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Help & Support
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600">
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}