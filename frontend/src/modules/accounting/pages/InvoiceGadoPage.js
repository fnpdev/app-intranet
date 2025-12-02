// frontend/src/modules/accounting/pages/InvoiceEstoquePage.js

import React, { useMemo, useState } from "react";
import InvoiceBasePage from "./InvoiceBasePage";

export default function InvoiceGadoPage({ params = [] }) {

  const actionsByTransition = useMemo(() => {
    if (!Array.isArray(params)) return {};

    const map = {};
    params.forEach(stepObj => {
      map[stepObj.step] = stepObj;
    });
    return map;
  }, [params]);

  const steps = useMemo(() => {
    if (!Array.isArray(params)) return [];
    return params
      .slice()
      .sort((a, b) => (a.order || 999) - (b.order || 999))
      .map(s => s.step);
  }, [params]);

  const [currentStep, setCurrentStep] = useState(steps[0] || null);

  return (
    <InvoiceBasePage
      title="Entrada NF Gado"
      steps={steps}
      step={currentStep}
      setStep={setCurrentStep}
      actionsByTransition={params}
    />
  );
}
