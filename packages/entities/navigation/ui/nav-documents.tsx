'use client';

import { MoreHorizontal, Plus, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@shared/ui/layout/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@shared/ui/navigation/dropdown-menu';
import { Role } from '@entities/users';

export function NavDocuments({
  items,
  userRole,
}: {
  items: {
    name: string;
    url: string;
    icon: LucideIcon;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
  userRole: Role;
}) {
  const { isMobile } = useSidebar();
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Справочники</SidebarGroupLabel>
      <SidebarMenu>
        {items.map(item => {
          const href = item.url;
          const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));

          return (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton asChild tooltip={item.name} isActive={isActive}>
                <Link href={href} prefetch>
                  <item.icon />
                  <span className='group-data-[collapsible=icon]:hidden'>{item.name}</span>
                </Link>
              </SidebarMenuButton>
              {
                userRole !== 'Partner' &&
                <DropdownMenu
                  modal={false}
                  onOpenChange={(open: boolean) => {
                    // Убираем focus когда dropdown закрывается
                    if (!open) {
                      setTimeout(() => {
                        const button = document.querySelector(
                          '[data-state="closed"][data-sidebar="menu-action"]',
                        ) as HTMLButtonElement;

                        if (button) {
                          button.blur();
                        }
                      }, 0);
                    }
                  }}
                >
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuAction
                      showOnHover
                      className='data-[state=open]:bg-accent rounded-sm focus-visible:ring-0 focus:ring-0'
                      onBlur={(e: React.FocusEvent<HTMLButtonElement>) => e.target.blur()}
                    >
                      <MoreHorizontal />
                      <span className='sr-only'>More</span>
                    </SidebarMenuAction>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className='w-48 rounded-lg'
                    side={isMobile ? 'bottom' : 'right'}
                    align={isMobile ? 'end' : 'start'}
                  >
                    {item.items ? (
                      // Если есть подменю, показываем его элементы
                      item.items.map((subItem) => (
                        <DropdownMenuItem key={subItem.url} asChild>
                          <Link href={subItem.url} className='w-full'>
                            {subItem.title.includes('Создать')}
                            <span>{subItem.title}</span>
                          </Link>
                        </DropdownMenuItem>
                      ))
                    ) : (
                      // Если нет подменю, показываем стандартную кнопку "Создать"
                      <DropdownMenuItem asChild>
                        <Link href={`${item.url}/create`} className='w-full'>
                          <Plus className='mr-2 h-4 w-4' />
                          <span>Создать</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              }
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
