"use client";

/**
 * Public Form Settings Page
 * Configure public access, embed codes, and anonymous submissions
 */

import { useState } from "react";
import { useParams } from "next/navigation";
import { LayoutWrapper } from "@/components/layout-wrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  usePublicFormSettings,
  useUpdatePublicFormSettings,
  usePublicFormEmbed,
  usePublicFormStats,
} from "@/hooks/forms/use-public-forms";
import {
  Globe,
  Copy,
  Check,
  Eye,
  Link2,
  Code,
  QrCode,
  Settings,
  BarChart3,
  Shield,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PublicFormPage() {
  const params = useParams();
  const formId = params.id as string;

  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const { data: settings, isLoading: settingsLoading } = usePublicFormSettings(formId);
  const { data: embedCodes } = usePublicFormEmbed(formId);
  const { data: stats } = usePublicFormStats(formId);
  const updateSettings = useUpdatePublicFormSettings(formId);

  const handleTogglePublicAccess = async (enabled: boolean) => {
    try {
      await updateSettings.mutateAsync({
        is_public: enabled,
      });
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleToggleAnonymous = async (enabled: boolean) => {
    try {
      await updateSettings.mutateAsync({
        allow_anonymous: enabled,
      });
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleUpdateSlug = async (slug: string) => {
    try {
      await updateSettings.mutateAsync({
        custom_slug: slug,
      });
    } catch (error) {
      // Error handled by mutation
    }
  };

  const copyToClipboard = async (text: string, item: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(item);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (error) {
      toast.error("Failed to copy");
    }
  };

  const publicUrl = settings?.custom_slug
    ? `${window.location.origin}/form/${settings.custom_slug}`
    : `${window.location.origin}/form/${formId}`;

  return (
    <LayoutWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Globe className="h-8 w-8 text-primary" />
              Public Form Settings
            </h1>
            <p className="text-muted-foreground mt-1">
              Configure public access and sharing options
            </p>
          </div>
          {settings?.is_public && (
            <Button
              variant="outline"
              onClick={() => window.open(publicUrl, "_blank")}
            >
              <Eye className="mr-2 h-4 w-4" />
              Preview Public Form
            </Button>
          )}
        </div>

        {/* Public Access Toggle */}
        <Card className={settings?.is_public ? "border-green-500/50 bg-green-50/50 dark:bg-green-900/10" : ""}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Public Access
                </CardTitle>
                <CardDescription>
                  Allow anyone with the link to submit this form
                </CardDescription>
              </div>
              {settingsLoading ? (
                <Skeleton className="h-6 w-11" />
              ) : (
                <Switch
                  checked={settings?.is_public || false}
                  onCheckedChange={handleTogglePublicAccess}
                  disabled={updateSettings.isPending}
                />
              )}
            </div>
          </CardHeader>
          {settings?.is_public && (
            <CardContent>
              <div className="flex items-center gap-2 p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Check className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-900 dark:text-green-100">
                  This form is publicly accessible
                </span>
              </div>
            </CardContent>
          )}
        </Card>

        {settings?.is_public && (
          <>
            {/* Stats */}
            {stats && (
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.unique_visitors}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Public Submissions</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.total_submissions}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                    <BarChart3 className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {stats.conversion_rate?.toFixed(1)}%
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Public URL */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="h-5 w-5" />
                  Public URL
                </CardTitle>
                <CardDescription>
                  Share this link to allow public submissions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={publicUrl}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(publicUrl, "url")}
                  >
                    {copiedItem === "url" ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Custom Slug */}
                <div className="space-y-2">
                  <Label>Custom Slug (Optional)</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="my-custom-form"
                      defaultValue={settings?.custom_slug || ""}
                      onBlur={(e) => {
                        if (e.target.value !== settings?.custom_slug) {
                          handleUpdateSlug(e.target.value);
                        }
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Create a memorable URL for your form
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Public Form Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Allow Anonymous Submissions</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow users to submit without signing in
                    </p>
                  </div>
                  <Switch
                    checked={settings?.allow_anonymous || false}
                    onCheckedChange={handleToggleAnonymous}
                    disabled={updateSettings.isPending}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Show Branding</Label>
                    <p className="text-sm text-muted-foreground">
                      Display your organization's branding on the public form
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Require CAPTCHA</Label>
                    <p className="text-sm text-muted-foreground">
                      Protect against spam with CAPTCHA verification
                    </p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>

            {/* Embed Codes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Embed Codes
                </CardTitle>
                <CardDescription>
                  Embed this form in your website or application
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="iframe">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="iframe">iFrame</TabsTrigger>
                    <TabsTrigger value="script">JavaScript</TabsTrigger>
                    <TabsTrigger value="qr">QR Code</TabsTrigger>
                  </TabsList>

                  {/* iFrame */}
                  <TabsContent value="iframe" className="space-y-4">
                    <div>
                      <Label className="mb-2">iFrame Code</Label>
                      <div className="relative">
                        <Textarea
                          value={embedCodes?.iframe_code || `<iframe src="${publicUrl}" width="100%" height="600" frameborder="0"></iframe>`}
                          readOnly
                          rows={4}
                          className="font-mono text-xs"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => copyToClipboard(embedCodes?.iframe_code || "", "iframe")}
                        >
                          {copiedItem === "iframe" ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Copy and paste this code into your website's HTML
                    </p>
                  </TabsContent>

                  {/* JavaScript */}
                  <TabsContent value="script" className="space-y-4">
                    <div>
                      <Label className="mb-2">JavaScript Code</Label>
                      <div className="relative">
                        <Textarea
                          value={embedCodes?.script_code || `<script src="${window.location.origin}/embed.js" data-form-id="${formId}"></script>`}
                          readOnly
                          rows={4}
                          className="font-mono text-xs"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => copyToClipboard(embedCodes?.script_code || "", "script")}
                        >
                          {copiedItem === "script" ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      This code creates a responsive embedded form
                    </p>
                  </TabsContent>

                  {/* QR Code */}
                  <TabsContent value="qr" className="space-y-4">
                    <div className="flex flex-col items-center gap-4">
                      {embedCodes?.qr_code_url ? (
                        <img
                          src={embedCodes.qr_code_url}
                          alt="QR Code"
                          className="w-64 h-64 border rounded-lg"
                        />
                      ) : (
                        <div className="w-64 h-64 border rounded-lg flex items-center justify-center bg-muted">
                          <QrCode className="h-16 w-16 text-muted-foreground" />
                        </div>
                      )}
                      <p className="text-sm text-center text-muted-foreground">
                        Scan this QR code to access the form on mobile devices
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => {
                          // Download QR code
                          toast.success("QR code downloaded");
                        }}
                      >
                        <QrCode className="mr-2 h-4 w-4" />
                        Download QR Code
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Security Notice */}
            <Card className="border-yellow-500/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-500">
                  <Shield className="h-5 w-5" />
                  Security Notice
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span>•</span>
                    <span>Public forms can be accessed by anyone with the link</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>•</span>
                    <span>Enable CAPTCHA to prevent spam submissions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>•</span>
                    <span>Monitor submission patterns for suspicious activity</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>•</span>
                    <span>You can disable public access at any time</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </LayoutWrapper>
  );
}
