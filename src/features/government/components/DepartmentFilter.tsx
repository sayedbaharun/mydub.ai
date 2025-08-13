import { useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import * as Icons from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/shared/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/components/ui/popover'
import { Badge } from '@/shared/components/ui/badge'
import { GOVERNMENT_DEPARTMENTS } from '../data/departments'
import { Department } from '../types'
import { useTranslation } from 'react-i18next'

interface DepartmentFilterProps {
  selectedDepartments: string[]
  onDepartmentsChange: (departments: string[]) => void
}

export function DepartmentFilter({
  selectedDepartments,
  onDepartmentsChange,
}: DepartmentFilterProps) {
  const [open, setOpen] = useState(false)
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar' || i18n.language === 'ur'

  const toggleDepartment = (departmentId: string) => {
    if (selectedDepartments.includes(departmentId)) {
      onDepartmentsChange(selectedDepartments.filter(id => id !== departmentId))
    } else {
      onDepartmentsChange([...selectedDepartments, departmentId])
    }
  }

  const clearAll = () => {
    onDepartmentsChange([])
    setOpen(false)
  }

  const selectAll = () => {
    onDepartmentsChange(GOVERNMENT_DEPARTMENTS.map(dept => dept.id))
    setOpen(false)
  }

  const getSelectedDepartments = (): Department[] => {
    return GOVERNMENT_DEPARTMENTS.filter(dept => 
      selectedDepartments.includes(dept.id)
    )
  }

  const renderIcon = (iconName: string) => {
    const Icon = Icons[iconName as keyof typeof Icons] as any
    return Icon ? <Icon className="h-4 w-4" /> : null
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <span className="truncate">
            {selectedDepartments.length === 0
              ? t('filters.allDepartments')
              : selectedDepartments.length === 1
              ? getSelectedDepartments()[0][isRTL ? 'nameAr' : 'name']
              : t('filters.departmentsSelected', { count: selectedDepartments.length })}
          </span>
          <ChevronDown className={cn(
            "ml-2 h-4 w-4 shrink-0 opacity-50",
            isRTL && "ml-0 mr-2"
          )} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align={isRTL ? "end" : "start"}>
        <Command>
          <CommandInput 
            placeholder={t('filters.searchDepartments')}
            className={isRTL ? "text-right" : ""}
          />
          <CommandEmpty>{t('filters.noDepartmentsFound')}</CommandEmpty>
          <CommandGroup>
            <div className="flex justify-between p-2 border-b">
              <Button
                variant="ghost"
                size="sm"
                onClick={selectAll}
                className="h-8 text-xs"
              >
                {t('common.selectAll')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="h-8 text-xs"
              >
                {t('common.clearAll')}
              </Button>
            </div>
            {GOVERNMENT_DEPARTMENTS.map((department) => (
              <CommandItem
                key={department.id}
                value={department.name}
                onSelect={() => toggleDepartment(department.id)}
                className="cursor-pointer"
              >
                <div className={cn(
                  "flex items-center gap-2 w-full",
                  isRTL && "flex-row-reverse"
                )}>
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded"
                    style={{ backgroundColor: `${department.color}20` }}
                  >
                    <div style={{ color: department.color }}>
                      {renderIcon(department.icon)}
                    </div>
                  </div>
                  <span className={cn(
                    "flex-1",
                    isRTL ? "text-right" : "text-left"
                  )}>
                    {isRTL ? department.nameAr : department.name}
                  </span>
                  <Check
                    className={cn(
                      "h-4 w-4",
                      selectedDepartments.includes(department.id)
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export function DepartmentBadges({
  selectedDepartments,
  onRemove,
}: {
  selectedDepartments: string[]
  onRemove: (departmentId: string) => void
}) {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar' || i18n.language === 'ur'

  if (selectedDepartments.length === 0) return null

  const departments = GOVERNMENT_DEPARTMENTS.filter(dept =>
    selectedDepartments.includes(dept.id)
  )

  return (
    <div className={cn(
      "flex flex-wrap gap-2",
      isRTL && "flex-row-reverse"
    )}>
      {departments.map((department) => (
        <Badge
          key={department.id}
          variant="secondary"
          className="cursor-pointer"
          onClick={() => onRemove(department.id)}
        >
          <span style={{ color: department.color }}>
            {isRTL ? department.nameAr : department.name}
          </span>
          <span className={cn(
            "ml-1 hover:text-destructive",
            isRTL && "ml-0 mr-1"
          )}>
            ×
          </span>
        </Badge>
      ))}
    </div>
  )
}