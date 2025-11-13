// frontend/src/modules/accounting/pages/InvoiceFiscalPage.js
import React, { useState } from "react";
import InvoiceBasePage from "./InvoiceBasePage";

const ACTIONS_BY_TRANSITION = {
  portaria: {
    allowCreate: true,
    allowUpdate: true,
    allowClose: false,
    allowLogs: true,
    allowCount: false,
    allowInvoice: false,

    fiscal: {
      label: "Fiscal",
      action: [
        { value: "Entrada NF", label: "Entrada NF" },
        { value: "Entrada Via E-Mail", label: "Entrada Via E-Mail" }
      ],
      user: [{ value: 1, label: "Geovane Prestes", default: true }]
    }
  },

  fiscal: {
    allowCreate: false,
    allowUpdate: true,
    allowClose: false,
    allowLogs: true,
    allowCount: false,
    allowInvoice: true,

    estoque: {
      label: "Estoque",
      action: [
        { value: "Liberado Contagem", label: "Liberado Contagem", default: true }
      ]
    }
  },

  estoque: {
    allowCreate: false,
    allowUpdate: true,
    allowClose: false,
    allowLogs: true,
    allowCount: true,
    allowInvoice: false,

    fiscal: {
      label: "Fiscal",
      action: [
        { value: "Contagem", label: "Realizado Contagem", default: true }
      ]
    }
  }
};

// Steps permitidos pelo módulo fiscal (a Base renderiza abas)
const STEPS = Object.keys(ACTIONS_BY_TRANSITION);

export default function InvoiceFiscalPage() {
  // inicializa com o primeiro step disponível (portaria)
  const [currentStep, setCurrentStep] = useState(STEPS[0]);

  return (
    <InvoiceBasePage
      title="NF - Fiscal"
      steps={STEPS}
      step={currentStep}           // step atual enviado para a base
      setStep={setCurrentStep}     // permite trocar abas a partir da base
      actionsByTransition={ACTIONS_BY_TRANSITION}
    />
  );
}
