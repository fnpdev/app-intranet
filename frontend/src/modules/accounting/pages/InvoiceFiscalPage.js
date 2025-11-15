// frontend/src/modules/accounting/pages/InvoiceFiscalPage.js

import React, { useMemo, useState } from "react";
import InvoiceBasePage from "./InvoiceBasePage";

export default function InvoiceFiscalPage({ params = [] }) {

  // =====================================================
  // 🔥 CONVERTE ARRAY DE STEPS → MAPA (para a base)
  // =====================================================
  const actionsByTransition = useMemo(() => {
    if (!Array.isArray(params)) return {};

    const map = {};
    params.forEach(stepObj => {
      map[stepObj.step] = stepObj;
    });
    return map;
  }, [params]);

  // =====================================================
  // 🔥 ORDENA STEPS PELO CAMPO "order"
  // =====================================================
  const steps = useMemo(() => {
    if (!Array.isArray(params)) return [];
    return params
      .slice()
      .sort((a, b) => (a.order || 999) - (b.order || 999))
      .map(s => s.step);
  }, [params]);

  // =====================================================
  // 🔥 DEFINE O STEP INICIAL (sempre o primeiro da ordem)
  // =====================================================
  const [currentStep, setCurrentStep] = useState(steps[0] || null);

  return (
    <InvoiceBasePage
      title="Entrada NF Fiscal"
      steps={steps}
      step={currentStep}
      setStep={setCurrentStep}
      actionsByTransition={params}  // <--- IMPORTANTE: MANTER ARRAY (novo formato)
    />
  );
}
