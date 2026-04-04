'use client'

import React, { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { CRMDeal, PipelineStage } from '@/lib/crm/types'
import DealCard from './DealCard'

interface KanbanBoardProps {
  stages: PipelineStage[]
  deals: CRMDeal[]
  onDealMove: (dealId: string, stageId: string) => void
  onDealClick?: (deal: CRMDeal) => void
}

function SortableDealCard({ deal }: { deal: CRMDeal }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: deal.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <DealCard deal={deal} isDragging={isDragging} />
    </div>
  )
}

function StageColumn({
  stage,
  deals,
}: {
  stage: PipelineStage
  deals: CRMDeal[]
}) {
  const totalValue = deals.reduce((sum, d) => sum + d.value, 0)
  const dealIds = deals.map((d) => d.id)

  return (
    <div
      style={{
        minWidth: 280,
        maxWidth: 320,
        backgroundColor: '#0D0E1A',
        border: '1px solid #1E2035',
        borderRadius: 12,
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}
    >
      {/* Column Header */}
      <div
        style={{
          padding: '16px 16px 12px',
          borderBottom: '1px solid #1E2035',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: stage.color || '#6C3FC5',
              display: 'inline-block',
            }}
          />
          <span
            style={{
              color: '#F1F3FA',
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            {stage.name}
          </span>
          <span
            style={{
              color: '#6B7299',
              fontSize: 12,
              marginLeft: 4,
            }}
          >
            {deals.length}
          </span>
        </div>
        <span
          style={{
            color: '#6B7299',
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          {'\u00A3'}{totalValue.toLocaleString()}
        </span>
      </div>

      {/* Drop Zone */}
      <div
        style={{
          padding: 12,
          minHeight: 200,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          overflowY: 'auto',
        }}
      >
        <SortableContext
          items={dealIds}
          strategy={verticalListSortingStrategy}
        >
          {deals.map((deal) => (
            <SortableDealCard key={deal.id} deal={deal} />
          ))}
        </SortableContext>
      </div>
    </div>
  )
}

export default function KanbanBoard({
  stages,
  deals,
  onDealMove,
}: KanbanBoardProps) {
  const [activeDeal, setActiveDeal] = useState<CRMDeal | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const sortedStages = [...stages].sort((a, b) => a.position - b.position)

  function getDealsByStage(stageId: string) {
    return deals.filter((d) => d.stage_id === stageId)
  }

  function handleDragStart(event: DragStartEvent) {
    const deal = deals.find((d) => d.id === event.active.id)
    setActiveDeal(deal || null)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDeal(null)
    const { active, over } = event
    if (!over) return

    const dealId = active.id as string
    // Determine which stage the deal was dropped into
    // over.id could be a deal id or stage container
    const overDeal = deals.find((d) => d.id === over.id)
    const targetStageId = overDeal ? overDeal.stage_id : (over.id as string)

    const sourceDeal = deals.find((d) => d.id === dealId)
    if (sourceDeal && targetStageId && sourceDeal.stage_id !== targetStageId) {
      onDealMove(dealId, targetStageId)
    }
  }

  function handleDragOver(event: DragOverEvent) {
    // Optional: handle drag over for visual feedback
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
    >
      <div
        style={{
          display: 'flex',
          gap: 16,
          overflowX: 'auto',
          paddingBottom: 16,
          minHeight: 400,
        }}
      >
        {sortedStages.map((stage) => (
          <SortableContext
            key={stage.id}
            items={getDealsByStage(stage.id).map((d) => d.id)}
            strategy={verticalListSortingStrategy}
          >
            <StageColumn
              stage={stage}
              deals={getDealsByStage(stage.id)}
            />
          </SortableContext>
        ))}
      </div>

      <DragOverlay>
        {activeDeal ? (
          <div
            style={{
              opacity: 0.8,
              border: '2px solid transparent',
              borderImage: 'linear-gradient(135deg, #8B5CF6, #22D3EE) 1',
              borderRadius: 8,
            }}
          >
            <DealCard deal={activeDeal} isDragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
