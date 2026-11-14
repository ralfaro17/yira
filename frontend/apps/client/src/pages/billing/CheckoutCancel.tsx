import { Link } from 'react-router';
import { XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function CheckoutCancel() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-8 text-center">
        <div className="flex justify-center mb-6">
          <XCircle className="h-20 w-20 text-red-500" />
        </div>
        
        <h1 className="text-3xl font-bold mb-4">
          {t('pricing.cancel.title', 'Pago cancelado')}
        </h1>
        <p className="text-gray-400 mb-8">
          {t(
            'pricing.cancel.desc',
            'El proceso de pago no fue completado. No se han realizado cargos a tu cuenta.'
          )}
        </p>
        
        <div className="flex flex-col space-y-4">
          <Link 
            to="/billing/pricing" 
            className="block w-full py-3 rounded-lg bg-white text-black font-medium hover:bg-gray-200 transition-colors"
          >
            {t('pricing.cancel.retry', 'Volver a intentar')}
          </Link>
          <Link 
            to="/" 
            className="block w-full py-3 rounded-lg bg-transparent border border-neutral-700 text-white font-medium hover:bg-neutral-900 transition-colors"
          >
            {t('pricing.cancel.backHome', 'Volver al Inicio')}
          </Link>
        </div>
      </div>
    </div>
  );
}
