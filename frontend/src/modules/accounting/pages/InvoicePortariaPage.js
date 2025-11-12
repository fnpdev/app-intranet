import InvoiceBasePage from './InvoiceBasePage';

export default function InvoicePortariaPage() {
  return (
    <InvoiceBasePage
      title="NF - Portaria"
      step="portaria"
      allowCreate
      allowUpdate={false} // 🔒 não pode atualizar
    />
  );
}
