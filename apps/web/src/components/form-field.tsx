"use client"

import { ReactNode } from "react"
import { Form, type FormItemProps } from "antd"
import {
  type FieldApi,
  type ReactFormApi,
  type DeepKeys,
  type DeepValue,
  type FormValidateOrFn,
  type FormAsyncValidateOrFn,
} from "@tanstack/react-form"

/**
 * Props for the FormField helper.
 * We use all 12 generic parameters from ReactFormApi to ensure perfect type inference.
 */
interface FormFieldProps<
  TData,
  TName extends DeepKeys<TData>,
  TOnMount extends undefined | FormValidateOrFn<TData>,
  TOnChange extends undefined | FormValidateOrFn<TData>,
  TOnChangeAsync extends undefined | FormAsyncValidateOrFn<TData>,
  TOnBlur extends undefined | FormValidateOrFn<TData>,
  TOnBlurAsync extends undefined | FormAsyncValidateOrFn<TData>,
  TOnSubmit extends undefined | FormValidateOrFn<TData>,
  TOnSubmitAsync extends undefined | FormAsyncValidateOrFn<TData>,
  TOnDynamic extends undefined | FormValidateOrFn<TData>,
  TOnDynamicAsync extends undefined | FormAsyncValidateOrFn<TData>,
  TOnServer extends undefined | FormAsyncValidateOrFn<TData>,
  TSubmitMeta,
> {
  form: ReactFormApi<
    TData,
    TOnMount,
    TOnChange,
    TOnChangeAsync,
    TOnBlur,
    TOnBlurAsync,
    TOnSubmit,
    TOnSubmitAsync,
    TOnDynamic,
    TOnDynamicAsync,
    TOnServer,
    TSubmitMeta
  >
  name: TName
  label?: ReactNode
  required?: boolean
  help?: ReactNode
  valuePropName?: FormItemProps["valuePropName"]
  children: (
    field: FieldApi<
      TData, // 1: TParentData
      TName, // 2: TName
      DeepValue<TData, TName>, // 3: TData
      undefined, // 4: TOnMount (Field)
      undefined, // 5: TOnChange (Field)
      undefined, // 6: TOnChangeAsync (Field)
      undefined, // 7: TOnBlur (Field)
      undefined, // 8: TOnBlurAsync (Field)
      undefined, // 9: TOnSubmit (Field)
      undefined, // 10: TOnSubmitAsync (Field)
      undefined, // 11: TOnDynamic (Field)
      undefined, // 12: TOnDynamicAsync (Field)
      TOnMount, // 13: TFormOnMount
      TOnChange, // 14: TFormOnChange
      TOnChangeAsync, // 15: TFormOnChangeAsync
      TOnBlur, // 16: TFormOnBlur
      TOnBlurAsync, // 17: TFormOnBlurAsync
      TOnSubmit, // 18: TFormOnSubmit
      TOnSubmitAsync, // 19: TFormOnSubmitAsync
      TOnDynamic, // 20: TFormOnDynamic
      TOnDynamicAsync, // 21: TFormOnDynamicAsync
      TOnServer, // 22: TFormOnServer
      TSubmitMeta // 23: TParentSubmitMeta
    >,
  ) => ReactNode
}

/**
 * A helper component to wrap TanStack Form fields with Ant Design Form.Item.
 * This ensures consistent styling, error messaging, and required indicators.
 */
export const FormField = <
  TData,
  TName extends DeepKeys<TData>,
  TOnMount extends undefined | FormValidateOrFn<TData>,
  TOnChange extends undefined | FormValidateOrFn<TData>,
  TOnChangeAsync extends undefined | FormAsyncValidateOrFn<TData>,
  TOnBlur extends undefined | FormValidateOrFn<TData>,
  TOnBlurAsync extends undefined | FormAsyncValidateOrFn<TData>,
  TOnSubmit extends undefined | FormValidateOrFn<TData>,
  TOnSubmitAsync extends undefined | FormAsyncValidateOrFn<TData>,
  TOnDynamic extends undefined | FormValidateOrFn<TData>,
  TOnDynamicAsync extends undefined | FormAsyncValidateOrFn<TData>,
  TOnServer extends undefined | FormAsyncValidateOrFn<TData>,
  TSubmitMeta,
>({
  form,
  name,
  label,
  required,
  help,
  valuePropName,
  children,
}: FormFieldProps<
  TData,
  TName,
  TOnMount,
  TOnChange,
  TOnChangeAsync,
  TOnBlur,
  TOnBlurAsync,
  TOnSubmit,
  TOnSubmitAsync,
  TOnDynamic,
  TOnDynamicAsync,
  TOnServer,
  TSubmitMeta
>) => {
  return (
    <form.Field name={name}>
      {(field) => {
        const errors = field.state.meta.errors
        const isTouched = field.state.meta.isTouched
        const hasError = isTouched && errors.length > 0

        // Extract error messages safely
        const errorMessages = errors.map((err: unknown) => {
          if (typeof err === "object" && err !== null && "message" in err) {
            return (err as { message: string }).message
          }
          return String(err)
        })

        return (
          <Form.Item
            label={label}
            required={required}
            validateStatus={hasError ? "error" : ""}
            help={hasError ? errorMessages.join(", ") : help}
            valuePropName={valuePropName}
          >
            {children(
              field as unknown as FieldApi<
                TData,
                TName,
                DeepValue<TData, TName>,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                TOnMount,
                TOnChange,
                TOnChangeAsync,
                TOnBlur,
                TOnBlurAsync,
                TOnSubmit,
                TOnSubmitAsync,
                TOnDynamic,
                TOnDynamicAsync,
                TOnServer,
                TSubmitMeta
              >,
            )}
          </Form.Item>
        )
      }}
    </form.Field>
  )
}
