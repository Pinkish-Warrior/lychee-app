import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard, CheckCircle, XCircle, Clock, Infinity, ShieldCheck } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { toast } from "sonner";

const STATUS_CONFIG = {
  trialing:  { label: "Free Trial",    icon: Clock,        color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  active:    { label: "Active",        icon: CheckCircle,  color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
  past_due:  { label: "Payment Due",   icon: XCircle,      color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
  canceled:  { label: "Canceled",      icon: XCircle,      color: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300" },
  none:      { label: "No Plan",       icon: XCircle,      color: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300" },
  lifetime:  { label: "Lifetime Free", icon: Infinity,     color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" },
};

export default function Billing() {
  const [location] = useLocation();
  const { data: status, isLoading } = trpc.billing.getStatus.useQuery();
  const checkoutMutation = trpc.billing.createCheckout.useMutation({
    onSuccess: ({ url }) => { if (url) window.location.href = url; },
    onError: (e) => toast.error(e.message),
  });
  const portalMutation = trpc.billing.createPortal.useMutation({
    onSuccess: ({ url }) => { window.location.href = url; },
    onError: (e) => toast.error(e.message),
  });

  useEffect(() => {
    if (location.includes("success=1")) toast.success("Subscription activated! Welcome aboard.");
    if (location.includes("canceled=1")) toast.info("Checkout canceled. You can upgrade anytime.");
  }, [location]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const subStatus = (status?.subscriptionStatus ?? "none") as keyof typeof STATUS_CONFIG;
  const isAdmin = status?.isAdmin ?? false;
  const cfg = STATUS_CONFIG[subStatus] ?? STATUS_CONFIG.none;
  const StatusIcon = cfg.icon;
  const trialEndsAt = status?.trialEndsAt ? new Date(status.trialEndsAt) : null;
  const trialDaysLeft = trialEndsAt ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / 86400000)) : 0;
  const isBlocked = !isAdmin && (subStatus === "canceled" || subStatus === "past_due" || subStatus === "none");
  const isManageable = subStatus === "active" || subStatus === "past_due";
  const isLifetime = isAdmin || subStatus === "lifetime";

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your Leeche subscription.</p>
      </div>

      {/* Current status card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Current Plan</CardTitle>
            <Badge className={cfg.color}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {cfg.label}
            </Badge>
          </div>
          <CardDescription>
            {isLifetime && "You have lifetime free access. Enjoy!"}
            {subStatus === "trialing" && trialEndsAt && `Trial ends ${trialEndsAt.toLocaleDateString()} (${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} left)`}
            {subStatus === "active" && `${status?.subscriptionPlan === "student" ? "Student plan · £4.99/month" : "Standard plan · £8.99/month"}`}
            {subStatus === "past_due" && "Your last payment failed. Update your payment method to keep access."}
            {subStatus === "canceled" && "Your subscription has ended. Upgrade to regain access."}
            {subStatus === "none" && "You don't have an active subscription."}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Blocked wall */}
      {isBlocked && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-sm">Access restricted</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Subscribe to capture notes, view your dashboard, and use all Leeche features.
                </p>
              </div>
            </div>
            <Button
              className="w-full"
              onClick={() => checkoutMutation.mutate()}
              disabled={checkoutMutation.isPending}
            >
              {checkoutMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CreditCard className="h-4 w-4 mr-2" />}
              {status?.isStudent ? "Subscribe · £4.99/month (Student)" : "Subscribe · £8.99/month"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Plans */}
      {!isLifetime && !isManageable && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className={status?.isStudent ? "border-primary" : ""}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Standard</CardTitle>
                {!status?.isStudent && <Badge variant="outline">Your plan</Badge>}
              </div>
              <p className="text-2xl font-bold">£8.99<span className="text-sm font-normal text-muted-foreground">/month</span></p>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-1">
              <p>✓ Full access to all features</p>
              <p>✓ AI note classification</p>
              <p>✓ Graph view</p>
              <p>✓ Your own AI API key</p>
            </CardContent>
          </Card>

          {status?.isStudent && (
            <Card className="border-primary">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Student</CardTitle>
                  <Badge className="bg-primary/10 text-primary border-0">
                    <ShieldCheck className="h-3 w-3 mr-1" />
                    Eligible
                  </Badge>
                </div>
                <p className="text-2xl font-bold">£4.99<span className="text-sm font-normal text-muted-foreground">/month</span></p>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-1">
                <p>✓ Everything in Standard</p>
                <p>✓ Student discount applied automatically</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Action buttons */}
      {!isLifetime && !isBlocked && (
        <div className="flex gap-3">
          {(subStatus === "trialing") && (
            <Button
              onClick={() => checkoutMutation.mutate()}
              disabled={checkoutMutation.isPending}
            >
              {checkoutMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CreditCard className="h-4 w-4 mr-2" />}
              {status?.isStudent ? "Upgrade · £4.99/month" : "Upgrade · £8.99/month"}
            </Button>
          )}
          {isManageable && (
            <Button
              variant="outline"
              onClick={() => portalMutation.mutate()}
              disabled={portalMutation.isPending}
            >
              {portalMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Manage / Cancel
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
