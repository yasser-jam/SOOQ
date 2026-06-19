import { Switch } from "@workspace/ui/components/switch"

type SysSwitchProps = {
  label: string
  description?: string
  value: boolean
  onChange: (value: boolean) => void
}

export default function SysSwitch(props: SysSwitchProps) {
  const { label, description, value, onChange } = props

  return (
    <>
      <div className="flex justify-between items-center rounded-lg border border-dashed border-primary bg-primary/5 px-4 py-2">
        <div>
          <label htmlFor="switch">{label}</label>
          <div className="mt-1 text-sm text-gray-500">{description}</div>
        </div>

          <Switch checked={value} onCheckedChange={onChange} />
      </div>
    </>
  )
}
