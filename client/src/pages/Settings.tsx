import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, KeyRound, CheckCircle, ExternalLink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

const PROVIDER_CONFIG = {
  gemini: { label: "Google Gemini", model: "gemini-2.5-flash", docsUrl: "https://aistudio.google.com/apikey", placeholder: "AIza..." },
  openai: { label: "OpenAI",        model: "gpt-4o-mini",      docsUrl: "https://platform.openai.com/api-keys", placeholder: "sk-..." },
  claude: { label: "Anthropic Claude", model: "claude-haiku-4-5-20251001", docsUrl: "https://console.anthropic.com/settings/keys", placeholder: "sk-ant-..." },
};

export default function Settings() {
  const [, navigate] = useLocation();
  const { data: keyStatus, isLoading, refetch } = trpc.settings.getApiKeyStatus.useQuery();
  const [provider, setProvider] = useState<"openai" | "gemini" | "claude">("gemini");
  const [apiKey, setApiKey] = useState("");
  const saveKey = trpc.settings.saveApiKey.useMutation({
    onSuccess: () => {
      toast.success("API key saved.");
      setApiKey("");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const currentProvider = keyStatus?.provider ?? "gemini";
  const currentCfg = PROVIDER_CONFIG[currentProvider as keyof typeof PROVIDER_CONFIG];

  return (
    <div className="max-w-xl mx-auto space-y-6 py-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure your AI provider and subscription.</p>
      </div>

      {/* Current AI provider status */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">AI Provider</CardTitle>
            {keyStatus?.hasKey ? (
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                <CheckCircle className="h-3 w-3 mr-1" />
                Key saved
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">No key set</Badge>
            )}
          </div>
          {keyStatus?.hasKey && (
            <CardDescription>
              Using <span className="font-medium">{currentCfg?.label}</span> · {currentCfg?.model}
            </CardDescription>
          )}
          {!keyStatus?.hasKey && (
            <CardDescription>
              Add your own API key so AI features run on your quota. Without a key, the app uses the shared server key (may be limited).
            </CardDescription>
          )}
        </CardHeader>
      </Card>

      {/* Set / update key */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{keyStatus?.hasKey ? "Update API Key" : "Add API Key"}</CardTitle>
          <CardDescription>Your key is encrypted before being stored. It is never shown after saving.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Provider</Label>
            <Select value={provider} onValueChange={(v) => setProvider(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gemini">Google Gemini</SelectItem>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="claude">Anthropic Claude</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>API Key</Label>
              <a
                href={PROVIDER_CONFIG[provider].docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                Get key <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <Input
              type="password"
              placeholder={PROVIDER_CONFIG[provider].placeholder}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              autoComplete="off"
            />
          </div>

          <Button
            className="w-full"
            disabled={!apiKey.trim() || saveKey.isPending}
            onClick={() => saveKey.mutate({ provider, apiKey: apiKey.trim() })}
          >
            {saveKey.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <KeyRound className="h-4 w-4 mr-2" />}
            Save Key
          </Button>
        </CardContent>
      </Card>

      {/* Billing link */}
      <Card className="cursor-pointer hover:bg-accent/40 transition-colors" onClick={() => navigate("/billing")}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Subscription</CardTitle>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </div>
          <CardDescription>View your plan, trial status, or manage your subscription.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
