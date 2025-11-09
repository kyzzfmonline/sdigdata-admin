"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { MapPin, Loader, CheckCircle, AlertTriangle } from "lucide-react"
import type { GPSCoordinates } from "@/lib/types"

interface GPSCaptureProps {
  onCapture: (coordinates: GPSCoordinates) => void
  value?: GPSCoordinates | null
  required?: boolean
}

export function GPSCapture({ onCapture, value, required }: GPSCaptureProps) {
  const [isCapturing, setIsCapturing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [coordinates, setCoordinates] = useState<GPSCoordinates | null>(value || null)
  const [manualMode, setManualMode] = useState(false)
  const [manualLat, setManualLat] = useState("")
  const [manualLng, setManualLng] = useState("")

  useEffect(() => {
    if (value) {
      setCoordinates(value)
    }
  }, [value])

  const handleCapture = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser")
      setManualMode(true)
      return
    }

    setIsCapturing(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: GPSCoordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        }
        setCoordinates(coords)
        onCapture(coords)
        setIsCapturing(false)
      },
      (err) => {
        setIsCapturing(false)
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError(
              "Location permission denied. Please enable location access or enter coordinates manually."
            )
            break
          case err.POSITION_UNAVAILABLE:
            setError("Location information unavailable. Please enter coordinates manually.")
            break
          case err.TIMEOUT:
            setError("Location request timed out. Please try again or enter coordinates manually.")
            break
          default:
            setError("An error occurred while capturing location.")
        }
        setManualMode(true)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const lat = parseFloat(manualLat)
    const lng = parseFloat(manualLng)

    if (isNaN(lat) || isNaN(lng)) {
      setError("Please enter valid coordinates")
      return
    }

    if (lat < -90 || lat > 90) {
      setError("Latitude must be between -90 and 90")
      return
    }

    if (lng < -180 || lng > 180) {
      setError("Longitude must be between -180 and 180")
      return
    }

    const coords: GPSCoordinates = {
      latitude: lat,
      longitude: lng,
      accuracy: 0, // Manual entry has no accuracy
    }
    setCoordinates(coords)
    onCapture(coords)
    setManualMode(false)
    setError(null)
  }

  if (coordinates && !manualMode) {
    return (
      <Card className="p-4 bg-green-50 border-green-200">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-900">Location captured</p>
            <div className="text-xs text-green-700 mt-1 space-y-0.5">
              <p>Latitude: {coordinates.latitude.toFixed(6)}</p>
              <p>Longitude: {coordinates.longitude.toFixed(6)}</p>
              {coordinates.accuracy > 0 && <p>Accuracy: ±{coordinates.accuracy.toFixed(1)}m</p>}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCoordinates(null)
                setManualMode(false)
              }}
            >
              Clear
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setManualMode(true)}>
              Edit
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  if (manualMode) {
    return (
      <Card className="p-4">
        <form onSubmit={handleManualSubmit} className="space-y-3">
          <p className="text-sm font-medium text-foreground">Enter coordinates manually</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Latitude</label>
              <Input
                type="number"
                step="any"
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
                placeholder="-90 to 90"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Longitude</label>
              <Input
                type="number"
                step="any"
                value={manualLng}
                onChange={(e) => setManualLng(e.target.value)}
                placeholder="-180 to 180"
                required
              />
            </div>
          </div>
          {error && (
            <div className="flex items-start gap-2 text-xs text-orange-700">
              <AlertTriangle className="w-4 h-4 mt-0.5" />
              <p>{error}</p>
            </div>
          )}
          <div className="flex gap-2">
            <Button type="submit" size="sm">
              Save Location
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setManualMode(false)
                setError(null)
              }}
            >
              Cancel
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={handleCapture}>
              Try Auto-Capture
            </Button>
          </div>
        </form>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      <div
        className="border-2 border-dashed border-border rounded-lg p-6 text-center transition-colors cursor-pointer hover:border-primary"
        onClick={handleCapture}
      >
        {isCapturing ? (
          <>
            <Loader className="w-8 h-8 text-muted-foreground mx-auto mb-2 animate-spin" />
            <p className="text-sm font-medium text-foreground">Capturing location...</p>
            <p className="text-xs text-muted-foreground mt-1">Please wait</p>
          </>
        ) : (
          <>
            <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground mb-1">Capture GPS Location</p>
            <p className="text-xs text-muted-foreground mb-3">Requires location permission</p>
            <Button variant="outline" size="sm" onClick={handleCapture}>
              Get Location
            </Button>
          </>
        )}
      </div>

      <Button variant="ghost" size="sm" className="w-full" onClick={() => setManualMode(true)}>
        Enter manually instead
      </Button>

      {error && !manualMode && (
        <div className="p-3 bg-orange-50 border border-orange-200 rounded-md flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5" />
          <p className="text-sm text-orange-700">{error}</p>
        </div>
      )}
    </div>
  )
}
