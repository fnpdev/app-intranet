import InvoiceBasePage from './InvoiceBasePage';

export default function InvoiceSuprimentosPage() {
  return (
    <InvoiceBasePage
      title="NF - Suprimentos"
      step="suprimentos"
      actions={[
        { value: 'PC Corrigido', label: 'PC Corrigido' },
        { value: 'Recusa', label: 'Recusa' },
      ]}
    />
  );
}
