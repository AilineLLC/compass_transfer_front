import { PaymentViewPage } from '@pages/(admin)/payments/view/payment-view-page';

export default function Page({ params }: { params: { id: string } }) {
  return <PaymentViewPage paymentId={params.id} />;
}
