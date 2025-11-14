/**
 * Command History Hook for Undo/Redo functionality
 */

import { useState, useCallback, useRef, useEffect } from "react"
import type { Command, CommandType, CommandHistory } from "@/lib/types-extended"

interface UseFormHistoryOptions {
  maxHistorySize?: number
  onUndo?: (command: Command) => void
  onRedo?: (command: Command) => void
}

export function useFormHistory(options: UseFormHistoryOptions = {}) {
  const { maxHistorySize = 50, onUndo, onRedo } = options

  const [history, setHistory] = useState<CommandHistory>({
    commands: [],
    currentIndex: -1,
  })

  const historyRef = useRef(history)
  historyRef.current = history

  /**
   * Add a new command to history
   */
  const executeCommand = useCallback(
    (type: CommandType, data: { previous: any; current: any }, description: string) => {
      setHistory((prev) => {
        // Remove any commands after current index (they will be lost when new command is added)
        const newCommands = prev.commands.slice(0, prev.currentIndex + 1)

        // Add new command
        const command: Command = {
          id: `cmd_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          type,
          timestamp: Date.now(),
          data,
          description,
        }

        newCommands.push(command)

        // Enforce max history size
        if (newCommands.length > maxHistorySize) {
          newCommands.shift()
        }

        return {
          commands: newCommands,
          currentIndex: newCommands.length - 1,
        }
      })
    },
    [maxHistorySize]
  )

  /**
   * Undo the last command
   */
  const undo = useCallback(() => {
    if (!canUndo) return null

    setHistory((prev) => {
      const newIndex = prev.currentIndex - 1
      const command = prev.commands[prev.currentIndex]

      if (command && onUndo) {
        onUndo(command)
      }

      return {
        ...prev,
        currentIndex: newIndex,
      }
    })

    return historyRef.current.commands[historyRef.current.currentIndex]
  }, [onUndo])

  /**
   * Redo the next command
   */
  const redo = useCallback(() => {
    if (!canRedo) return null

    setHistory((prev) => {
      const newIndex = prev.currentIndex + 1
      const command = prev.commands[newIndex]

      if (command && onRedo) {
        onRedo(command)
      }

      return {
        ...prev,
        currentIndex: newIndex,
      }
    })

    return historyRef.current.commands[historyRef.current.currentIndex]
  }, [onRedo])

  /**
   * Clear all history
   */
  const clearHistory = useCallback(() => {
    setHistory({
      commands: [],
      currentIndex: -1,
    })
  }, [])

  /**
   * Get command at specific index
   */
  const getCommandAt = useCallback(
    (index: number): Command | null => {
      if (index < 0 || index >= history.commands.length) {
        return null
      }
      return history.commands[index]
    },
    [history.commands]
  )

  /**
   * Jump to specific point in history
   */
  const goToIndex = useCallback(
    (index: number) => {
      if (index < -1 || index >= history.commands.length) {
        return
      }

      setHistory((prev) => ({
        ...prev,
        currentIndex: index,
      }))
    },
    [history.commands.length]
  )

  const canUndo = history.currentIndex >= 0
  const canRedo = history.currentIndex < history.commands.length - 1

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0
      const modifier = isMac ? e.metaKey : e.ctrlKey

      if (modifier) {
        if (e.key === "z" && !e.shiftKey) {
          e.preventDefault()
          undo()
        } else if ((e.key === "z" && e.shiftKey) || e.key === "y") {
          e.preventDefault()
          redo()
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [undo, redo])

  return {
    history,
    executeCommand,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
    getCommandAt,
    goToIndex,
  }
}
