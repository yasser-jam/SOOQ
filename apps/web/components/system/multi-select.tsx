"use client"

import * as React from "react"

import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@workspace/ui/components/combobox"

import { ReactNode } from "react"
import { Control, FieldPath } from "react-hook-form"
import { Loader2 } from "lucide-react"

type MultiSelectProps<T extends Record<string, unknown>> = {
  value: any[]
  onChange: (value: any[]) => void
  items: T[]
  itemTitle?: string
  itemValue?: string
  defaultValue?: any[]
  //   pass it here instead of inputProps in order to avoid duplication and make it easy to set
  placeholder?: string

  loading?: boolean
}

export default function MultiSelect(props: MultiSelectProps<any>) {
  const titleKey = props.itemTitle || "item-title"
  const valueKey = props.itemValue || "value"

  const anchor = useComboboxAnchor()

  const getTitle = (value: any) =>
    props.items.find((el) => el[valueKey] == value)?.[titleKey]

  return (
    <>
      <Combobox
        multiple
        autoHighlight
        items={props.items}
        value={props.value}
        onValueChange={props.onChange}
        disabled={props.loading}
      >
        {/* <ComboboxInput placeholder={props.placeholder} value={props.value} /> */}

        <ComboboxChips ref={anchor} className="w-full relative">
          <ComboboxValue placeholder={props.placeholder}>
            <React.Fragment>
              {props.value.map((value: string) => (
                <ComboboxChip key={value}>{getTitle(value)}</ComboboxChip>
              ))}
              <ComboboxChipsInput placeholder={props.placeholder} />
            </React.Fragment>
          </ComboboxValue>

          {props.loading && (
            <Loader2 className="absolute top-2 left-2 animate-spin" />
          )}
        </ComboboxChips>

        <ComboboxContent anchor={anchor}>
          <ComboboxEmpty>لا توجد عناصر</ComboboxEmpty>
          <ComboboxList>
            {props.items?.map((item) => (
              <ComboboxItem key={item[valueKey]} value={item[valueKey]}>
                {item[titleKey]}
              </ComboboxItem>
            ))}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </>
  )
}
