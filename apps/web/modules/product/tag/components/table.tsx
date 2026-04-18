"use client"

import { useQuery } from "@tanstack/react-query"

export default function Table() {
  const { data: tags, isLoading } = useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      const { productTags } = await import("../data")
      return productTags
    },
  })

  return (
    <div className="w-full overflow-hidden rounded-lg border">
      <table className="w-full border-collapse bg-white text-left text-sm text-gray-500">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-4 font-medium text-gray-900">
              Name
            </th>
            <th scope="col" className="px-6 py-4 font-medium text-gray-900">
              Description
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100 border-t border-gray-100">
          <tr className="hover:bg-gray-50">
            <td className="px-6 py-4">
              <p className="font-medium text-gray-900">Tag 1</p>
            </td>

            <td className="py- 4 px-6">
              <p className="text-gray-700">Description for Tag 1</p>
            </td>
          </tr>

          <tr className="hover:bg-gray-50">
            <td className="px-6 py-4">
              <p className="font-medium text-gray-900">Tag 2</p>
            </td>

            <td className="px-6 py-4">
              <p className="text-gray-700">Description for Tag 2</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
