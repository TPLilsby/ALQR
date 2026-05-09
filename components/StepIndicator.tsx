"use client";
import { Fragment } from "react";
import { Check } from "lucide-react";

interface StepConfig {
  label: string;
}

interface StepIndicatorProps {
  currentStep: 1 | 2 | 3;
  steps?: [StepConfig, StepConfig, StepConfig];
}

const DEFAULT_STEPS: [StepConfig, StepConfig, StepConfig] = [
  { label: "Domæne" },
  { label: "Analyserer" },
  { label: "QR klar" },
];

type StepState = "completed" | "active" | "pending";

export default function StepIndicator({
  currentStep,
  steps = DEFAULT_STEPS,
}: StepIndicatorProps) {
  return (
    <div className="flex items-center w-full">
      {steps.map((step, i) => {
        const state: StepState =
          i + 1 < currentStep
            ? "completed"
            : i + 1 === currentStep
            ? "active"
            : "pending";

        return (
          <Fragment key={i}>
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  state === "pending"
                    ? "bg-zinc-200 text-zinc-400"
                    : "bg-green-brand text-white"
                }`}
              >
                {state === "completed" ? <Check size={16} /> : <span>{i + 1}</span>}
              </div>
              <span
                className={`text-xs mt-1 ${
                  state === "pending" ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mb-4 ${
                  i + 1 < currentStep ? "bg-green-brand" : "bg-gray-200"
                }`}
              />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
