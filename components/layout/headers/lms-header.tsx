"use client";

import { useState } from "react";
import {
  Search,
  Bell,
  User,
  BookOpen,
  Calendar,
  Settings,
  HelpCircle,
  ChevronUp,
  X
} from "lucide-react";
import { useRouter } from "next/navigation";
import { LayoutUtils } from "@/components/layout/config";
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
import type { HeaderProps, LayoutConfig } from "../types";

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
  config?: LayoutConfig;
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
  onNavigationClick,
  onSearch,
  className = "",
  config
}: LMSHeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const router = useRouter();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearch?.(value);
  };

  const handleSearchToggle = () => {
    setIsSearchExpanded(!isSearchExpanded);
    if (isSearchExpanded) {
      setSearchQuery(""); // Clear search when closing
      onSearch?.(""); // Notify parent
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle search submission if needed
    onSearch?.(searchQuery);
  };

  const userInitials = userName
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className={`bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm ${className}`}>
      {/* Expanded Search Bar (Mobile/Tablet) */}
      {isSearchExpanded && (
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search courses, assignments, resources..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 h-10 bg-gray-50 border-gray-200 rounded-full focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all"
                autoFocus
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleSearchToggle}
              className="h-10 w-10 p-0 shrink-0"
            >
              <ChevronUp className="h-5 w-5" />
            </Button>
          </form>
        </div>
      )}

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Title/Logo */}
          <div className="flex items-center gap-3 flex-shrink-0 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <BookOpen className="h-6 w-6 text-primary flex-shrink-0" />
              <div className="flex items-center gap-4 min-w-0">
                <h1
                  className="text-lg font-semibold text-gray-900 cursor-pointer truncate"
                  onClick={async () => {
                    const navItem = LayoutUtils.getNavigationItems('lms').find(i => i.id === 'dashboard');
                    if (onNavigationClick && navItem) {
                      try {
                        const res = await onNavigationClick(navItem);
                        if ((res as unknown as boolean) === false) return;
                      } catch (e) {
                        return;
                      }
                    }

                    if (navItem?.href) router.push(navItem.href);
                  }}
                >
                  {title}
                </h1>
              </div>
            </div>
          </div>

          {/* Desktop Search Bar */}
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
            {/* Mobile Search Toggle Button */}
            {showSearch && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSearchToggle}
                aria-label={isSearchExpanded ? "Close search" : "Open search"}
                title={isSearchExpanded ? "Close search" : "Open search"}
                className="lg:hidden h-10 w-10 p-0 flex items-center justify-center bg-blue-500 text-white hover:bg-blue-600 z-50"
              // Added background color to make it clearly visible for testing
              >
                {isSearchExpanded ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Search className="h-5 w-5" />
                )}
              </Button>
            )}

            {/* Desktop/Tablet navigation items */}
            <nav className="hidden lg:flex items-center gap-2 rounded-full">
              {LayoutUtils.filterNavigationItems(
                LayoutUtils.getNavigationItems('lms'),
                'lms',
                config?.device ?? LayoutUtils.getDeviceType()
              ).map((item) => {
                const Icon = item.icon as any;
                return (
                  <Button
                    key={item.id}
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      if (onNavigationClick) {
                        try {
                          const res = await onNavigationClick(item);
                          if ((res as unknown as boolean) === false) return;
                        } catch (e) {
                          return;
                        }
                      }

                      if (item.href) router.push(item.href);
                    }}
                    className="h-10 px-3 flex items-center gap-2 rounded-full"
                  >
                    {Icon && <Icon className="h-4 w-4 text-current" />}
                    <span>{item.label}</span>
                  </Button>
                );
              })}
            </nav>

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