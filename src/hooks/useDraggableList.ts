import { useState, useRef, useCallback } from 'react'

export function useDraggableList<T extends { id: string }>(initialItems: T[], storageKey: string) {
  const getSaved = () => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (!saved) return initialItems
      const savedIds: string[] = JSON.parse(saved)
      const reordered = savedIds
        .map(id => initialItems.find(item => item.id === id))
        .filter(Boolean) as T[]
      const newItems = initialItems.filter(item => !savedIds.includes(item.id))
      return [...reordered, ...newItems]
    } catch {
      return initialItems
    }
  }

  const [items, setItems] = useState<T[]>(getSaved)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)
  const dragItem = useRef<number | null>(null)
  const dragOverItem = useRef<number | null>(null)

  const handleDragStart = useCallback((index: number) => {
    dragItem.current = index
    setDraggedIndex(index)
  }, [])

  const handleDragEnter = useCallback((index: number) => {
    dragOverItem.current = index
    setOverIndex(index)
  }, [])

  const handleDragEnd = useCallback(() => {
    if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
      setItems(prev => {
        const newItems = [...prev]
        const draggedItem = newItems.splice(dragItem.current!, 1)[0]
        newItems.splice(dragOverItem.current!, 0, draggedItem)
        localStorage.setItem(storageKey, JSON.stringify(newItems.map(i => i.id)))
        return newItems
      })
    }
    dragItem.current = null
    dragOverItem.current = null
    setDraggedIndex(null)
    setOverIndex(null)
  }, [storageKey])

  const reset = useCallback(() => {
    localStorage.removeItem(storageKey)
    setItems(initialItems)
  }, [storageKey, initialItems])

  const dragProps = useCallback((index: number) => ({
    draggable: true,
    onDragStart: () => handleDragStart(index),
    onDragEnter: () => handleDragEnter(index),
    onDragEnd: handleDragEnd,
    onDragOver: (e: React.DragEvent) => e.preventDefault(),
    style: {
      cursor: 'grab',
      opacity: draggedIndex === index ? 0.5 : 1,
      borderTop: overIndex === index && draggedIndex !== null && draggedIndex !== index ? '2px solid #0D9488' : '2px solid transparent',
      transition: 'opacity 0.15s, border-color 0.1s',
    } as React.CSSProperties,
  }), [draggedIndex, overIndex, handleDragStart, handleDragEnter, handleDragEnd])

  return { items, setItems, dragProps, reset, draggedIndex }
}
