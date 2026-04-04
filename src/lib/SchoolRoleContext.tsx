'use client'
import { createContext, useContext } from 'react'
import type { SchoolRole } from './schoolRoles'

export const SchoolRoleContext = createContext<SchoolRole>('slt_admin')
export function useSchoolRole() { return useContext(SchoolRoleContext) }
