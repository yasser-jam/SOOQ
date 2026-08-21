"use client"

import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  Tooltip,
  type ChartOptions,
} from "chart.js"
import { Bar } from "react-chartjs-2"

import { formatSyp } from "@/lib/money"

import type { ProfitProduct } from "../types"

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

const BAR_COLOR = "#122640"
const GRID_COLOR = "rgba(18, 38, 64, 0.08)"

type ProfitMarginChartProps = {
  products: ProfitProduct[]
}

export function ProfitMarginChart({ products }: ProfitMarginChartProps) {
  const labels = products.map((product) => product.productTitle || product.sku)
  const margins = products.map((product) => product.marginPercent)

  const options: ChartOptions<"bar"> = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: { color: GRID_COLOR },
        ticks: { color: "#44474D", font: { size: 12 } },
      },
      y: {
        grid: { display: false },
        ticks: { color: "#44474D", font: { size: 12 } },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (item) => {
            const product = products[item.dataIndex]
            return [
              `الإيراد: ${formatSyp(product?.revenue)}`,
              `الهامش: ${product?.marginPercent ?? 0}٪`,
            ]
          },
        },
      },
    },
  }

  return (
    <div className="h-64 w-full">
      <Bar
        data={{
          labels,
          datasets: [
            {
              label: "الهامش",
              data: margins,
              backgroundColor: BAR_COLOR,
              borderRadius: 4,
              barThickness: 18,
            },
          ],
        }}
        options={options}
      />
    </div>
  )
}
