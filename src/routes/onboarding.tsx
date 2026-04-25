import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cigarette, Euro, Calendar, ArrowRight, Wind } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { dateKey, loadPlan, savePlan, type UserPlan } from "@/lib/storage";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Get started — SmokeFree" },
      { name: "description", content: "Set up your personalized quit plan in 4 quick steps." },
    ],
  }),
  component: Onboarding,
});

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [daily, setDaily] = useState("15");
  const [packPrice, setPackPrice] = useState("8");
  const [cigsPerPack, setCigsPerPack] = useState("20");
  const defaultQuit = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 60);
    return dateKey(d);
  })();
  const [quitDate, setQuitDate] = useState(defaultQuit);

  useEffect(() => {
    if (loadPlan()) navigate({ to: "/" });
  }, [navigate]);

  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => Math.max(0, s - 1));

  const finish = () => {
    const plan: UserPlan = {
      startDate: dateKey(),
      quitDate,
      initialDailyCount: Math.max(1, parseInt(daily) || 1),
      packPrice: Math.max(0, parseFloat(packPrice) || 0),
      cigsPerPack: Math.max(1, parseInt(cigsPerPack) || 1),
    };
    savePlan(plan);
    navigate({ to: "/" });
  };

  const steps = [
    {
      icon: Wind,
      title: "Welcome to SmokeFree",
      subtitle: "A calm path away from cigarettes. We'll build a gradual plan based on your habits.",
      content: null,
      cta: "Begin",
      action: next,
    },
    {
      icon: Cigarette,
      title: "How many cigarettes per day?",
      subtitle: "Be honest — this is your starting point, not a judgment.",
      content: (
        <div className="space-y-2">
          <Label htmlFor="daily">Cigarettes / day</Label>
          <Input
            id="daily"
            type="number"
            inputMode="numeric"
            min={1}
            value={daily}
            onChange={(e) => setDaily(e.target.value)}
            className="h-14 text-center text-2xl font-semibold"
          />
        </div>
      ),
      cta: "Continue",
      action: next,
    },
    {
      icon: Euro,
      title: "Your pack",
      subtitle: "We'll calculate how much you save as you cut down.",
      content: (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="price">Price (€)</Label>
            <Input
              id="price"
              type="number"
              inputMode="decimal"
              step="0.1"
              min={0}
              value={packPrice}
              onChange={(e) => setPackPrice(e.target.value)}
              className="h-12 text-center text-lg"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cpp">Cigs / pack</Label>
            <Input
              id="cpp"
              type="number"
              inputMode="numeric"
              min={1}
              value={cigsPerPack}
              onChange={(e) => setCigsPerPack(e.target.value)}
              className="h-12 text-center text-lg"
            />
          </div>
        </div>
      ),
      cta: "Continue",
      action: next,
    },
    {
      icon: Calendar,
      title: "Your quit date",
      subtitle: "We'll reduce your daily limit linearly each week until you reach zero.",
      content: (
        <div className="space-y-2">
          <Label htmlFor="quit">Target quit date</Label>
          <Input
            id="quit"
            type="date"
            value={quitDate}
            min={dateKey()}
            onChange={(e) => setQuitDate(e.target.value)}
            className="h-14 text-center text-lg"
          />
        </div>
      ),
      cta: "Create my plan",
      action: finish,
    },
  ];

  const current = steps[step];
  const Icon = current.icon;

  return (
    <div className="flex min-h-screen flex-col px-6 py-10">
      {/* progress dots */}
      <div className="mb-12 flex justify-center gap-2">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === step ? "w-8 bg-primary" : i < step ? "w-4 bg-primary/60" : "w-4 bg-muted"
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.35 }}
          className="flex flex-1 flex-col"
        >
          <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-primary shadow-glow">
            <Icon className="h-10 w-10 text-primary-foreground" />
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-foreground">{current.title}</h1>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">{current.subtitle}</p>

          {current.content && <div className="mt-10">{current.content}</div>}

          <div className="mt-auto space-y-3 pt-12">
            <Button
              onClick={current.action}
              size="lg"
              className="h-14 w-full rounded-2xl bg-gradient-primary text-base font-semibold text-primary-foreground shadow-glow hover:opacity-95"
            >
              {current.cta}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            {step > 0 && (
              <Button
                onClick={back}
                variant="ghost"
                className="h-12 w-full text-muted-foreground hover:text-foreground"
              >
                Back
              </Button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
