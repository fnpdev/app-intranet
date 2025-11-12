import InvoiceBasePage from './InvoiceBasePage';

export default function InvoiceRecebimentoPage() {
  return (
    <InvoiceBasePage
      title="NF - Recebimento"
      step="recebimento"
      allowClose
      actions={[
        { value: 'NF Com Divergencia', label: 'NF Com Divergência' },
        { value: 'Finaliza Processo', label: 'Finaliza Processo' },
      ]}
    />
  );
}
