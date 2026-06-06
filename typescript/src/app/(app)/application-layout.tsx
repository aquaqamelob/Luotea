'use client'

import { Avatar } from '@/components/avatar'
import {
  Dropdown,
  DropdownButton,
  DropdownDivider,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
} from '@/components/dropdown'
import { Navbar, NavbarItem, NavbarSection, NavbarSpacer } from '@/components/navbar'
import {
  Sidebar,
  SidebarBody,
  SidebarFooter,
  SidebarHeader,
  SidebarItem,
  SidebarLabel,
  SidebarSection,
  SidebarSpacer,
} from '@/components/sidebar'
import { SidebarLayout } from '@/components/sidebar-layout'
import {
  ArrowRightStartOnRectangleIcon,
  ChevronUpIcon,
  LightBulbIcon,
  ShieldCheckIcon,
  UserCircleIcon,
} from '@heroicons/react/16/solid'
import {
  ChartBarIcon,
  ClipboardDocumentListIcon,
  HomeIcon,
  PresentationChartLineIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/20/solid'
import { usePathname } from 'next/navigation'

function AccountDropdownMenu({ anchor }: { anchor: 'top start' | 'bottom end' }) {
  return (
    <DropdownMenu className="min-w-64" anchor={anchor}>
      <DropdownItem href="#">
        <UserCircleIcon />
        <DropdownLabel>Luotea Hackathon</DropdownLabel>
      </DropdownItem>
      <DropdownDivider />
      <DropdownItem href="/pitch">
        <LightBulbIcon />
        <DropdownLabel>Pitch deck</DropdownLabel>
      </DropdownItem>
      <DropdownItem href="#">
        <ShieldCheckIcon />
        <DropdownLabel>Data sources</DropdownLabel>
      </DropdownItem>
      <DropdownDivider />
      <DropdownItem href="/login">
        <ArrowRightStartOnRectangleIcon />
        <DropdownLabel>Sign out</DropdownLabel>
      </DropdownItem>
    </DropdownMenu>
  )
}

export function ApplicationLayout({ children }: { children: React.ReactNode }) {
  let pathname = usePathname()

  return (
    <SidebarLayout
      navbar={
        <Navbar>
          <NavbarSpacer />
          <NavbarSection>
            <NavbarItem href="/pitch">
              <span className="text-sm font-semibold text-brand-pink">Jury pitch</span>
            </NavbarItem>
          </NavbarSection>
        </Navbar>
      }
      sidebar={
        <Sidebar>
          <SidebarHeader>
            <SidebarItem href="/">
              <Avatar
                initials="LP"
                className="bg-brand-teal-mid text-white"
              />
              <SidebarLabel>Luotea Prioritizer</SidebarLabel>
            </SidebarItem>
          </SidebarHeader>

          <SidebarBody>
            <SidebarSection>
              <SidebarItem href="/" current={pathname === '/'}>
                <HomeIcon />
                <SidebarLabel>Dashboard</SidebarLabel>
              </SidebarItem>
              <SidebarItem href="/cases" current={pathname.startsWith('/cases')}>
                <WrenchScrewdriverIcon />
                <SidebarLabel>Case Studies</SidebarLabel>
              </SidebarItem>
              <SidebarItem href="/recommendations" current={pathname.startsWith('/recommendations')}>
                <ClipboardDocumentListIcon />
                <SidebarLabel>Recommendations</SidebarLabel>
              </SidebarItem>
              <SidebarItem href="/pitch" current={pathname.startsWith('/pitch')}>
                <PresentationChartLineIcon />
                <SidebarLabel>Jury Pitch</SidebarLabel>
              </SidebarItem>
            </SidebarSection>

            <SidebarSpacer />

            <SidebarSection>
              <SidebarItem href="/recommendations">
                <ChartBarIcon />
                <SidebarLabel>IF/THEN Engine</SidebarLabel>
              </SidebarItem>
            </SidebarSection>
          </SidebarBody>

          <SidebarFooter className="max-lg:hidden">
            <Dropdown>
              <DropdownButton as={SidebarItem}>
                <span className="flex min-w-0 items-center gap-3">
                  <Avatar initials="LH" className="size-10 bg-zinc-900 text-white" square alt="" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm/5 font-medium text-zinc-950 dark:text-white">
                      Hackathon 2026
                    </span>
                    <span className="block truncate text-xs/5 font-normal text-zinc-500 dark:text-zinc-400">
                      Prioritization Engine
                    </span>
                  </span>
                </span>
                <ChevronUpIcon />
              </DropdownButton>
              <AccountDropdownMenu anchor="top start" />
            </Dropdown>
          </SidebarFooter>
        </Sidebar>
      }
    >
      {children}
    </SidebarLayout>
  )
}
