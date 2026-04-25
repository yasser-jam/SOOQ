import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

export default function StatusSelect(
  props: React.ComponentProps<typeof Select>
) {
  return (
    <Select {...props}>
      <SelectTrigger id="status" className="h-11 w-full">
        <SelectValue placeholder="اختر الحالة" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value="DRAFT">مسودة</SelectItem>
          <SelectItem value="ACTIVE">نشط</SelectItem>
          <SelectItem value="ARCHIVED">مؤرشف</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
