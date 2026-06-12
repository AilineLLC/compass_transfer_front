import type { UseFormSetError, FieldValues, Path } from 'react-hook-form';

const STRIP_PREFIXES = ['Duplicate', 'Invalid', 'Missing', 'Required', 'Existing'];

/**
 * Превращает серверный ключ ошибки в имя поля формы.
 * DuplicatePhoneNumber → phoneNumber
 * Email → email
 */
export const serverKeyToFormField = (key: string): string => {
  let field = key;
  for (const prefix of STRIP_PREFIXES) {
    if (field.startsWith(prefix)) {
      field = field.slice(prefix.length);
      break;
    }
  }
  return field.charAt(0).toLowerCase() + field.slice(1);
};

/**
 * Применяет серверные ошибки к полям формы и возвращает toast-сообщение.
 *
 * @returns сообщение для показа пользователю
 */
export const applyServerErrors = <T extends FieldValues>(
  serverErrors: Record<string, string[]>,
  setError: UseFormSetError<T>,
): string => {
  Object.keys(serverErrors).forEach(serverField => {
    if (!serverErrors[serverField]?.length) return;
    const formField = serverKeyToFormField(serverField);
    setError(formField as Path<T>, {
      type: 'server',
      message: serverErrors[serverField][0],
    });
  });

  return 'Вы указываете существующие данные, исправьте данные и попробуйте снова';
};
