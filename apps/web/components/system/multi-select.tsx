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

type MultiSelectProps<T extends Record<string, unknown>> = {
  value: any[]
  onChange: (value: any[]) => void
  items: T[]
  itemTitle?: string
  itemValue?: string
  defaultValue?: any[]
  //   pass it here instead of inputProps in order to avoid duplication and make it easy to set
  placeholder?: string
}

export default function MultiSelect(props: MultiSelectProps<any>) {
  const titleKey = props.itemTitle || "item-title"
  const valueKey = props.itemValue || "value"

  const anchor = useComboboxAnchor()

  const getValue = (value: any) =>
    props.items.find((el) => el[valueKey] == value)?.[titleKey]

  return (
    <>
      <Combobox multiple autoHighlight items={props.items} value={props.value} onValueChange={props.onChange}>
        <ComboboxInput placeholder={props.placeholder} value={props.value} />

        {/* <ComboboxChips ref={anchor} className="w-full max-w-xs">
          <ComboboxValue placeholder={props.placeholder}>
            <React.Fragment>
              {props.value.map((value: string) => (
                <ComboboxChip key={value}>{getValue(value)}</ComboboxChip>
              ))}
              <ComboboxChipsInput placeholder={props.placeholder} />
            </React.Fragment>
          </ComboboxValue>
        </ComboboxChips> */}

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
