import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { clearAll, loadPlan, savePlan, type UserPlan } from "@/lib/storage";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — SmokeFree" },
      { name: "description", content: "Adjust your daily count, pack price and quit date." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const [plan, setPlan] = useState<UserPlan | null>(null);
  const [daily, setDaily] = useState("");
  const [price, setPrice] = useState("");
  const [cpp, setCpp] = useState("");
  const [quit, setQuit] = useState("");

  useEffect(() => {
    const p = loadPlan();
    if (!p) {
      navigate({ to: "/onboarding" });
      return;
    }
    setPlan(p);
    setDaily(String(p.initialDailyCount));
    setPrice(String(p.packPrice));
    setCpp(String(p.cigsPerPack));
    setQuit(p.quitDate);
  }, [navigate]);

  if (!plan) return null;

  const save = () => {
    const next: UserPlan = {
      ...plan,
      initialDailyCount: Math.max(1, parseInt(daily) || 1),
      packPrice: Math.max(0, parseFloat(price) || 0),
      cigsPerPack: Math.max(1, parseInt(cpp) || 1),
      quitDate: quit,
    };
    savePlan(next);
    setPlan(next);
    toast.success("Settings saved");
  };

  const reset = () => {
    clearAll();
    navigate({ to: "/onboarding" });
  };

  return (
    <div className="px-6 pt-12">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">Settings</h1>
      <p className="mt-2 text-sm text-muted-foreground">Tweak your plan as your habits change.</p>

      <div className="mt-8 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="s-daily">Original cigarettes per day</Label>
          <Input
            id="s-daily"
            type="number"
            inputMode="numeric"
            min={1}
            value={daily}
            onChange={(e) => setDaily(e.target.value)}
            className="h-12"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="s-price">Pack price (€)</Label>
            <Input
              id="s-price"
              type="number"
              step="0.1"
              min={0}
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="h-12"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="s-cpp">Cigs / pack</Label>
            <Input
              id="s-cpp"
              type="number"
              min={1}
              inputMode="numeric"
              value={cpp}
              onChange={(e) => setCpp(e.target.value)}
              className="h-12"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="s-quit">Quit date</Label>
          <Input
            id="s-quit"
            type="date"
            value={quit}
            onChange={(e) => setQuit(e.target.value)}
            className="h-12"
          />
        </div>

        <Button
          onClick={save}
          size="lg"
          className="h-12 w-full rounded-xl bg-gradient-primary font-semibold text-primary-foreground shadow-glow hover:opacity-95"
        >
          Save changes
        </Button>

        <div className="rounded-2xl border border-border bg-card/40 p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Plan started</p>
          <p className="mt-1 text-sm text-foreground">
            {new Date(plan.startDate).toLocaleDateString(undefined, {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              className="h-12 w-full gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Reset all data
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset everything?</AlertDialogTitle>
              <AlertDialogDescription>
                This deletes your plan and all logged cigarettes. You'll start the onboarding
                again.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={reset} className="bg-destructive text-destructive-foreground">
                Reset
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
