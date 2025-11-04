"use client"

import { useState } from "react"
import { X, Copy, Check, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CreateOrganizationModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateOrganization?: (orgName: string, inviteLink: string) => void
}

export default function CreateOrganizationModal({
  isOpen,
  onClose,
  onCreateOrganization,
}: CreateOrganizationModalProps) {
  const [orgName, setOrgName] = useState("")
  const [inviteLink, setInviteLink] = useState("")
  const [showInviteLink, setShowInviteLink] = useState(false)
  const [copiedToClipboard, setCopiedToClipboard] = useState(false)
  const [errors, setErrors] = useState<{ orgName?: string }>({})

  const generateInviteLink = () => {
    if (!orgName.trim()) {
      setErrors({ orgName: "Organization name is required" })
      return
    }

    setErrors({})
    const uniqueCode = Math.random().toString(36).substring(2, 10).toUpperCase()
    const link = `${window.location.origin}/invite/${uniqueCode}`
    setInviteLink(link)
    setShowInviteLink(true)
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopiedToClipboard(true)
      setTimeout(() => setCopiedToClipboard(false), 2000)
    } catch {
      console.error("Failed to copy to clipboard")
    }
  }

  const handleCreateOrganization = () => {
    if (!orgName.trim()) {
      setErrors({ orgName: "Organization name is required" })
      return
    }

    if (onCreateOrganization) {
      onCreateOrganization(orgName, inviteLink)
    }

    // Reset form
    setOrgName("")
    setInviteLink("")
    setShowInviteLink(false)
    setErrors({})
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg shadow-lg w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Create Organization</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Organization Name Input */}
          <div className="space-y-2">
            <label htmlFor="org-name" className="block text-sm font-medium text-foreground">
              Organization Name
            </label>
            <input
              id="org-name"
              type="text"
              value={orgName}
              onChange={(e) => {
                setOrgName(e.target.value)
                if (errors.orgName) setErrors({})
              }}
              placeholder="e.g., My Company Inc"
              className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                errors.orgName
                  ? "border-destructive bg-destructive/5"
                  : "border-input bg-background hover:border-accent focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
              }`}
            />
            {errors.orgName && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.orgName}
              </p>
            )}
          </div>

          {/* Generate Invite Link Button */}
          {!showInviteLink ? (
            <Button
              onClick={generateInviteLink}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Generate Invite Link
            </Button>
          ) : (
            /* Invite Link Display */
            <div className="space-y-3">
              <label className="block text-sm font-medium text-foreground">Invite Link</label>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted border border-border">
                <input
                  type="text"
                  value={inviteLink}
                  readOnly
                  className="flex-1 bg-transparent text-sm text-foreground outline-none"
                />
                <button
                  onClick={copyToClipboard}
                  className="p-1 rounded hover:bg-accent/20 transition-colors text-muted-foreground hover:text-foreground"
                >
                  {copiedToClipboard ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Share this link with team members to invite them to your organization.
              </p>

              {/* Change Invite Link */}
              <Button
                variant="outline"
                onClick={generateInviteLink}
                className="w-full border-border text-foreground hover:bg-accent/10 bg-transparent"
              >
                Generate New Link
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-border text-foreground hover:bg-accent/10 bg-transparent"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateOrganization}
            disabled={!orgName.trim()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Organization
          </Button>
        </div>
      </div>
    </div>
  )
}
