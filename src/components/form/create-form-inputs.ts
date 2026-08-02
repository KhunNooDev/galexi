import { type FieldValues } from 'react-hook-form';

import { InputCheckbox } from '@/components/form/input-checkbox';
import { InputCombobox } from '@/components/form/input-combobox';
import { InputFile } from '@/components/form/input-file';
import { InputPass } from '@/components/form/input-pass';
import { InputTags } from '@/components/form/input-tags';
import { InputText } from '@/components/form/input-text';
import { InputTextarea } from '@/components/form/input-textarea';

export function createFormInputs<TValues extends FieldValues>() {
  return {
    InputCheckbox: InputCheckbox<TValues>,
    InputCombobox: InputCombobox<TValues>,
    InputFile: InputFile<TValues>,
    InputPass: InputPass<TValues>,
    InputTags: InputTags<TValues>,
    InputText: InputText<TValues>,
    InputTextarea: InputTextarea<TValues>,
  } as const;
}
