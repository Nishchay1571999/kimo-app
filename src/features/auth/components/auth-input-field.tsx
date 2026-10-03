import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import type { TextInputProps } from 'react-native';

import { Input, InputError, InputField, InputLabel } from '@/components/ui/TextInput';

export function AuthInputField<T extends FieldValues>({ control, name, label, ...input }: {
  control: Control<T>; name: FieldPath<T>; label: string;
} & TextInputProps) {
  return (
    <Controller control={control} name={name}
      render={({ field: { value, onChange, onBlur, ref }, fieldState: { error } }) => (
        <InputField>
          <InputLabel>{label}</InputLabel>
          <Input {...input} ref={ref} value={value} onChangeText={onChange} onBlur={onBlur}
            invalid={!!error} accessibilityLabel={label} autoCorrect={false} />
          {error && <InputError>{error.message}</InputError>}
        </InputField>
      )} />
  );
}
