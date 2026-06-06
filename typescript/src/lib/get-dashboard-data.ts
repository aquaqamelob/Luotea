import type { DashboardData } from './dashboard-data'
import dashboardSnapshot from '@/generated/dashboard.json'

export function getDashboardData(): DashboardData {
  return dashboardSnapshot as DashboardData
}

export type { DashboardData } from './dashboard-data'
