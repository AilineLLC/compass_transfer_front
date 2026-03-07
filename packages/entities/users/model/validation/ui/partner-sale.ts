import type { FieldErrors } from 'react-hook-form';

type SectionStatus = 'complete' | 'warning' | 'error' | 'pending';

export interface PartnerSaleFields {
    sale: number | null;
}

export function getPartnerSaleStatus(
    formData: PartnerSaleFields,
    errors: FieldErrors<PartnerSaleFields>,
    _isSubmitted: boolean,
): SectionStatus {
    if (errors.sale) return 'error';

    if (formData.sale !== undefined && formData.sale !== null) {
        return 'complete';
    }

    return 'pending';
}

export function getPartnerSaleErrors(
    formData: PartnerSaleFields,
    errors: FieldErrors<PartnerSaleFields>,
    _isSubmitted: boolean,
): string[] {
    const errorList: string[] = [];

    if (errors.sale?.message) {
        errorList.push('Ошибка - Скидка: ' + errors.sale.message);
    }

    return errorList;
}
