import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { LANGUAGES, setLanguage, type LanguageCode } from "@/i18n";

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
  const { t, i18n } = useTranslation();
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
    toast.success(t("settings.saved"));
  };

  const reset = () => {
    clearAll();
    navigate({ to: "/onboarding" });
  };

  return (
    <div className="px-6 pt-12">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">{t("settings.title")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("settings.subtitle")}</p>

      <div className="mt-8 space-y-5">
        {/* Language selector */}
        <div className="space-y-2">
          <Label htmlFor="s-lang">{t("settings.language")}</Label>
          <Select
            value={i18n.language}
            onValueChange={(v) => setLanguage(v as LanguageCode)}
          >
            <SelectTrigger id="s-lang" className="h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((l) => (
                <SelectItem key={l.code} value={l.code}>
                  <span className="mr-2">{l.flag}</span>
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">{t("settings.languageDesc")}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="s-daily">{t("settings.originalDaily")}</Label>
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
            <Label htmlFor="s-price">{t("settings.packPrice")}</Label>
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
            <Label htmlFor="s-cpp">{t("settings.cigsPerPack")}</Label>
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
          <Label htmlFor="s-quit">{t("settings.quitDate")}</Label>
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
          {t("settings.save")}
        </Button>

        <div className="rounded-2xl border border-border bg-card/40 p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("settings.planStarted")}</p>
          <p className="mt-1 text-sm text-foreground">
            {new Date(plan.startDate).toLocaleDateString(i18n.language, {
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
              {t("settings.reset")}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("settings.resetTitle")}</AlertDialogTitle>
              <AlertDialogDescription>{t("settings.resetDesc")}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
              <AlertDialogAction onClick={reset} className="bg-destructive text-destructive-foreground">
                {t("settings.resetConfirm")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
