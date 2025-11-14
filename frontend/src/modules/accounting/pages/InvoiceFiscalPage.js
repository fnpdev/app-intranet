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
    allowPrint: false,
    fiscal: {
      label: "Fiscal",
      action: [
        { value: "Entrada NF", label: "Entrada NF", default: true},
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
    allowPrint: false,

    estoque: {
      label: "Estoque",
      action: [
        { value: "Liberado Contagem", label: "Liberado Contagem", default: true }
      ]
    },
    
    suprimento: {
      label: "Supromentos",
      action: [
        { value: "SEM_PC", label: "Sem PC", default: true },
        { value: "SEM_For", label: "Divergencia de Qtd", default: true }
      ],
      user: [

        { value: 1, label: "Gleice", default: true },
        { value: 2, label: "Antonio", default: true }
      ]
    },
    recebimento: {
      label: "Recebimento",
      action: [
        { value: "Liberado Contagem", label: "Liberado Entrada", default: true }
      ]
    },
  },

  estoque: {
    allowCreate: false,
    allowUpdate: true,
    allowClose: false,
    allowLogs: true,
    allowCount: true,
    allowInvoice: true,
    allowPrint: true,

    fiscal: {
      label: "Fiscal",
      action: [
        { value: "Contagem", label: "Realizado Contagem", default: true }
      ]
    }
  },
  
  suprimento: {
    allowCreate: false,
    allowUpdate: true,
    allowClose: false,
    allowLogs: true,
    allowCount: false,
    allowInvoice: true,
    allowPrint: false,

    fiscal: {
      label: "Fiscal",
      action: [
        { value: "Contagem", label: "PC Corrigido", default: true },
        { value: "Contagem", label: "Recusa", default: true }
      ]
    }
  },
  
  recebimento: {
    allowCreate: false,
    allowUpdate: true,
    allowClose: true,
    allowLogs: true,
    allowCount: false,
    allowInvoice: true,
    allowPrint: false,

    fiscal: {
      label: "Fiscal",
      action: [
        { value: "Contagem", label: "NF Corrigido", default: true }
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
