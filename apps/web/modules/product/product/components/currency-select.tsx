import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

export default function CurrencySelect(
  props: React.ComponentProps<typeof Select>
) {
  return (
    <Select {...props}>
      <SelectTrigger id="currencyCode" className="h-11 w-full">
        <SelectValue placeholder="اختر العملة" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value="SYP">SYP</SelectItem>
          <SelectItem value="USD">USD</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}