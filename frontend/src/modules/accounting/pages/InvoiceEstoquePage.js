import InvoiceBasePage from './InvoiceBasePage';

export default function InvoiceEstoquePage() {
  return (
    <InvoiceBasePage
      title="NF - Estoque"
      step="estoque"
      actions={[
        { value: 'Contagem Realizada', label: 'Contagem Realizada' },
      ]}
    />
  );
}
